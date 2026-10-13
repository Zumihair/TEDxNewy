import { NextResponse } from "next/server";
import sharp from "sharp";
import { CROPPABLE_SRC, IMAGE_RATIOS, ratioValue, type ImageRatio } from "@/lib/newsletter-blocks";

/**
 * Centre cover-crop for newsletter images, so an image block can have a fixed
 * shape (square, 5:4, 16:9, banner...) in every mail client. CSS object-fit
 * and aspect-ratio don't work in Outlook, so the crop is made here and the
 * email just points at the result. Public on purpose (mail clients fetch it),
 * so it only accepts images from our own Supabase public storage: it is not
 * an open image proxy.
 */
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const src = url.searchParams.get("src") ?? "";
  const r = url.searchParams.get("r") as ImageRatio | null;
  const ratio = r && IMAGE_RATIOS.some((x) => x.id === r) ? ratioValue(r) : null;
  const w = Math.min(Math.max(parseInt(url.searchParams.get("w") ?? "", 10) || 1200, 100), 1600);
  if (!ratio || !CROPPABLE_SRC.test(src)) {
    return new NextResponse("Bad request", { status: 400 });
  }
  const upstream = await fetch(src);
  if (!upstream.ok) return new NextResponse("Not found", { status: 404 });
  const input = Buffer.from(await upstream.arrayBuffer());
  const h = Math.round(w / ratio);
  const img = sharp(input).rotate().resize(w, h, { fit: "cover", position: "centre" });
  const meta = await sharp(input).metadata();
  const out = meta.hasAlpha
    ? await img.png().toBuffer()
    : await img.jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  return new NextResponse(new Uint8Array(out), {
    headers: {
      "Content-Type": meta.hasAlpha ? "image/png" : "image/jpeg",
      "Cache-Control": "public, max-age=604800, s-maxage=2592000",
    },
  });
}
