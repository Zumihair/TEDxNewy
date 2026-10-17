"use client";

// Business card artwork, 90 x 55 mm at 300 dpi (1063 x 650). Drawn in the browser, saved as PNG.

import { ensureFonts } from "./brandkit-canvas";

export const CARD_W = 1063;
export const CARD_H = 650;
const RED = "#e62b1e";

function img(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}

const f = (w: number, px: number) => `${w} ${px}px "InterBrand", system-ui, sans-serif`;

export type CardInput = { name: string; role: string; email: string; phone: string };

export async function renderCard(canvas: HTMLCanvasElement, side: "front" | "back", c: CardInput) {
  await ensureFonts();
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;
  ctx.textBaseline = "alphabetic";
  if (side === "front") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CARD_W, CARD_H);
    ctx.fillStyle = RED;
    ctx.fillRect(0, 0, 26, CARD_H);
    const logo = await img("/brand/lockups/TEDxNewy-Standard-black.png");
    const lw = 360;
    ctx.drawImage(logo, 92, 84, lw, lw * (logo.height / logo.width));
    ctx.fillStyle = "#000000";
    ctx.font = f(700, 66);
    ctx.fillText(c.name || "First Last", 92, 360);
    ctx.fillStyle = RED;
    ctx.font = f(600, 34);
    ctx.fillText(`${c.role || "Role"}, TEDxNewy`, 92, 416);
    ctx.fillStyle = "#2a2521";
    ctx.font = f(500, 30);
    const lines = [c.email, c.phone, "tedxnewy.com.au"].filter(Boolean);
    lines.forEach((l, i) => ctx.fillText(l, 92, 590 - (lines.length - 1 - i) * 42));
  } else {
    ctx.fillStyle = RED;
    ctx.fillRect(0, 0, CARD_W, CARD_H);
    try {
      const x = await img("/brand/lockups/TEDxNewy-X-white.png");
      ctx.globalAlpha = 0.13;
      const s = 760;
      ctx.drawImage(x, CARD_W - s * 0.62, CARD_H - s * 0.78, s, s * (x.height / x.width));
      ctx.globalAlpha = 1;
    } catch {}
    const logo = await img("/brand/lockups/TEDxNewy-Standard-mono.png");
    const lw = 520;
    const lh = lw * (logo.height / logo.width);
    ctx.drawImage(logo, (CARD_W - lw) / 2, (CARD_H - lh) / 2 - 30, lw, lh);
    ctx.fillStyle = "#ffffff";
    ctx.font = f(600, 34);
    ctx.textAlign = "center";
    ctx.fillText("Ideas change everything.", CARD_W / 2, CARD_H / 2 + lh / 2 + 36);
    ctx.textAlign = "left";
  }
}

export function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
}
