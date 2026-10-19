"use client";

// A4 landscape sign as a PDF. Drawn on a 300 dpi canvas to match the on-screen preview, then wrapped in a
// single-page PDF (JPEG image, exact A4 page size) so the file prints edge to edge with nothing to rebuild.

import type { SignArrow, SignStyle } from "./template-docs";

const W = 3508; // 297 mm at 300 dpi
const H = 2480; // 210 mm at 300 dpi
const S = W / 1123; // preview is 1123 x 794 px
const RED = "#e62b1e";
const STONE = "#6b6459";

function img(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}

let fontReady: Promise<void> | null = null;
function ensureDisplayFont(): Promise<void> {
  if (!fontReady) {
    fontReady = new FontFace("BricolageSign", "url(/fonts/BricolageGrotesque.ttf)", { weight: "200 800" })
      .load()
      .then((f) => {
        (document as Document & { fonts: FontFaceSet }).fonts.add(f);
      });
  }
  return fontReady;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

async function drawSign(o: { title: string; sub: string; arrow: SignArrow; style: SignStyle }): Promise<HTMLCanvasElement> {
  await ensureDisplayFont();
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const white = o.style === "white";
  const bg = white ? "#ffffff" : o.style === "red" ? RED : "#000000";
  const fg = white ? "#000000" : "#ffffff";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const logo = await img(`/brand/lockups/TEDxNewy-Standard-${white ? "black" : o.style === "red" ? "mono" : "white"}.png`);
  const logoH = 64 * S;
  const logoW = logoH * (logo.width / logo.height);
  const titlePx = 96 * S;
  const subPx = 28 * S;
  const arrowBox = 190 * S;
  const gap = 28 * S;

  ctx.font = `500 ${titlePx}px "BricolageSign", sans-serif`;
  const titleLines = wrap(ctx, o.title, 14 * 0.58 * titlePx);
  const titleH = titleLines.length * titlePx;
  const total = logoH + gap + titleH + gap + subPx * 1.5 + gap + arrowBox;
  let y = (H - total) / 2;

  ctx.drawImage(logo, (W - logoW) / 2, y, logoW, logoH);
  y += logoH + gap;

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = fg;
  ctx.font = `500 ${titlePx}px "BricolageSign", sans-serif`;
  titleLines.forEach((l, i) => ctx.fillText(l, W / 2, y + i * titlePx));
  y += titleH + gap;

  ctx.font = `400 ${subPx}px "BricolageSign", sans-serif`;
  ctx.fillStyle = white ? STONE : fg;
  ctx.globalAlpha = white ? 1 : 0.75;
  ctx.fillText(o.sub, W / 2, y);
  ctx.globalAlpha = 1;
  y += subPx * 1.5 + gap;

  const k = (150 * S) / 24;
  ctx.save();
  ctx.translate(W / 2, y + arrowBox / 2);
  ctx.rotate(({ right: 0, left: Math.PI, up: -Math.PI / 2 } as const)[o.arrow]);
  ctx.scale(k, k);
  ctx.translate(-12, -12);
  ctx.strokeStyle = white ? RED : "#ffffff";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(new Path2D("M5 12h14M13 6l6 6-6 6"));
  ctx.restore();
  return c;
}

function pdfFromJpeg(jpeg: Uint8Array, wPx: number, hPx: number): Blob {
  const pageW = 841.89; // A4 landscape in points
  const pageH = 595.28;
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let len = 0;
  const push = (b: Uint8Array) => {
    chunks.push(b);
    len += b.length;
  };
  const text = (s: string) => push(enc.encode(s));
  const obj = (n: number, body: () => void) => {
    offsets[n] = len;
    text(`${n} 0 obj\n`);
    body();
    text("\nendobj\n");
  };
  const content = `q ${pageW} 0 0 ${pageH} 0 0 cm /Im0 Do Q`;
  text("%PDF-1.4\n");
  obj(1, () => text("<< /Type /Catalog /Pages 2 0 R >>"));
  obj(2, () => text("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"));
  obj(3, () => text(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`));
  obj(4, () => {
    text(`<< /Type /XObject /Subtype /Image /Width ${wPx} /Height ${hPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
    push(jpeg);
    text("\nendstream");
  });
  obj(5, () => text(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
  const xref = len;
  text(`xref\n0 6\n0000000000 65535 f \n`);
  for (let i = 1; i <= 5; i++) text(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  text(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}

export async function signagePdf(o: { title: string; sub: string; arrow: SignArrow; style: SignStyle }): Promise<Blob> {
  const canvas = await drawSign(o);
  const jpeg = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Could not render the sign"))), "image/jpeg", 0.95));
  return pdfFromJpeg(new Uint8Array(await jpeg.arrayBuffer()), W, H);
}
