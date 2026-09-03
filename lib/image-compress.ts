"use client";

/**
 * Browser-side image compression for social uploads.
 *
 * Instagram (which Buffer publishes to) rejects an image over 8MB and
 * downscales anything wider than 1440px, so a straight-from-camera photo can
 * fail to publish with an "image too large" error, and our own upload also
 * refuses anything over the 8MB cms-uploads bucket cap. This shrinks an image
 * to Instagram-friendly bounds ONLY when it needs it: an image already within
 * the byte budget and the max edge is returned untouched, so nothing
 * already-small is re-encoded and loses quality. When work is needed it caps
 * the longest edge at Instagram's own 1440px maximum and re-encodes to JPEG,
 * stepping quality (then scale) down until the result fits the byte budget.
 *
 * Canvas-only, no dependency, and runs entirely in the browser. Video is never
 * passed here (it has its own, larger limit) and animated GIFs / SVGs are
 * returned untouched, since flattening them to a canvas would drop the
 * animation or rasterise a vector.
 */

export type CompressOptions = {
  /** Longest side allowed, in pixels. Defaults to Instagram's own 1440px max. */
  maxEdge?: number;
  /** Byte ceiling the result must fit under. */
  maxBytes?: number;
  /** JPEG quality to start from (0–1). */
  quality?: number;
  /** Quality is never dropped below this before scale is reduced instead. */
  minQuality?: number;
};

export type CompressResult = {
  /** The file to upload — the original when no work was needed, otherwise a
   *  re-encoded JPEG. */
  file: File;
  /** Whether the image was actually re-encoded. */
  compressed: boolean;
  originalBytes: number;
  finalBytes: number;
};

// Instagram scales anything wider than this down anyway, so it is both the
// safe target and a free way to cut bytes.
const DEFAULT_MAX_EDGE = 1440;
// Comfortably under Instagram's / the bucket's 8MB hard limit, with room for
// Buffer's own overhead.
const DEFAULT_MAX_BYTES = 7 * 1024 * 1024;
const DEFAULT_QUALITY = 0.85;
const DEFAULT_MIN_QUALITY = 0.4;

/** Raster types we can safely redraw. GIF is excluded (would drop animation)
 *  and SVG is not a raster. */
function isCompressibleImage(type: string): boolean {
  return (
    type === "image/jpeg" ||
    type === "image/png" ||
    type === "image/webp" ||
    type === "image/avif"
  );
}

async function decode(file: File): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; close: () => void }> {
  // createImageBitmap is the fast path and avoids an object URL round-trip.
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
      close: () => bitmap.close(),
    };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read the image."));
      el.src = url;
    });
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
      close: () => URL.revokeObjectURL(url),
    };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
  );
}

/**
 * Returns an upload-ready file. Never throws for a normal image: if anything
 * about the re-encode goes wrong it falls back to the original, so a compressor
 * hiccup can never block an upload that would otherwise have worked.
 */
export async function compressImage(
  file: File,
  opts: CompressOptions = {},
): Promise<CompressResult> {
  const maxEdge = opts.maxEdge ?? DEFAULT_MAX_EDGE;
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  const initialQuality = opts.quality ?? DEFAULT_QUALITY;
  const minQuality = opts.minQuality ?? DEFAULT_MIN_QUALITY;

  const untouched: CompressResult = {
    file,
    compressed: false,
    originalBytes: file.size,
    finalBytes: file.size,
  };

  if (!isCompressibleImage(file.type)) return untouched;

  let decoded: Awaited<ReturnType<typeof decode>> | null = null;
  try {
    decoded = await decode(file);
    const longest = Math.max(decoded.width, decoded.height);

    const needsResize = longest > maxEdge;
    const needsReencode = file.size > maxBytes;
    // Already fits, in both bytes and dimensions: hand it back as-is so a
    // small, well-shot photo keeps its original quality and format.
    if (!needsResize && !needsReencode) return untouched;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return untouched;

    const baseScale = Math.min(1, maxEdge / longest);

    const render = async (scale: number, quality: number): Promise<Blob | null> => {
      const w = Math.max(1, Math.round(decoded!.width * scale));
      const h = Math.max(1, Math.round(decoded!.height * scale));
      canvas.width = w;
      canvas.height = h;
      // JPEG has no alpha; flatten any transparency onto white rather than
      // black so a PNG with a cut-out background reads sensibly.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      decoded!.draw(ctx, w, h);
      return canvasToBlob(canvas, quality);
    };

    let scale = baseScale;
    let quality = initialQuality;
    let blob = await render(scale, quality);

    // Step quality down first (cheap, keeps resolution), then scale, until it
    // fits or there is nothing left to give.
    while (blob && blob.size > maxBytes) {
      if (quality > minQuality + 0.001) {
        quality = Math.max(minQuality, quality - 0.12);
      } else if (scale > 0.3) {
        scale *= 0.82;
        quality = initialQuality;
      } else {
        break;
      }
      blob = await render(scale, quality);
    }

    if (!blob) return untouched;
    // Defensive: if re-encoding somehow produced a bigger file than we started
    // with and the original already fit the budget, keep the original.
    if (blob.size >= file.size && file.size <= maxBytes) return untouched;

    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    const out = new File([blob], `${base}.jpg`, { type: "image/jpeg" });
    return {
      file: out,
      compressed: true,
      originalBytes: file.size,
      finalBytes: out.size,
    };
  } catch {
    // Any decode/encode failure: fall back to the original untouched.
    return untouched;
  } finally {
    decoded?.close();
  }
}
