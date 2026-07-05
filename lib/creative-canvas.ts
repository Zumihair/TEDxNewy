// Client-side compositor for the Creative studio: turn an uploaded photo into
// an on-brand social post. Parametric layout (every size is relative to the
// canvas W/H) so the same spec renders identically at any resolution — a small
// canvas for the live preview, a 2x canvas for the high-res export.
//
// Shares fonts + palette with lib/brandkit-canvas so both studios stay on brand.

import { ensureFonts, PALETTE, EVENTS, type EventFormat } from "./brandkit-canvas";

export { EVENTS, type EventFormat };

// ---- output shapes ----
export type Aspect = "1:1" | "4:5";
export const ASPECTS: { id: Aspect; label: string; sub: string; w: number; h: number }[] = [
  { id: "1:1", label: "Square", sub: "1080 × 1080", w: 1080, h: 1080 },
  { id: "4:5", label: "Portrait", sub: "1080 × 1350", w: 1080, h: 1350 },
];

export type Placement = "none" | "bottom" | "top" | "whole";
export type BrandPlacement = Placement | "diagonal";
export type Corner = "none" | "tl" | "tr" | "bl" | "br";
export type BlockPos = "top" | "center" | "bottom";
export type Align = "left" | "center" | "right";
export type ChipPlace = "text" | "logo";
export type LogoStyle = "mono" | "white" | "black";

export type ChipColour = "red" | "white" | "ink" | "cream" | "redDeep";
export const CHIP_COLOURS: { id: ChipColour; label: string; bg: string; fg: string }[] = [
  { id: "red", label: "Red", bg: PALETTE.red, fg: "#ffffff" },
  { id: "white", label: "White", bg: "#ffffff", fg: PALETTE.ink },
  { id: "ink", label: "Ink", bg: PALETTE.ink, fg: "#ffffff" },
  { id: "cream", label: "Cream", bg: PALETTE.cream, fg: PALETTE.ink },
  { id: "redDeep", label: "Deep red", bg: PALETTE.redDeep, fg: "#ffffff" },
];

export const LOGO_STYLES: { id: LogoStyle; label: string }[] = [
  { id: "mono", label: "White" },
  { id: "white", label: "Red + white" },
  { id: "black", label: "Red + dark" },
];

export type PostSpec = {
  aspect: Aspect;
  // photo framing
  zoom: number; // 1..3
  focusX: number; // 0..1 (0 = show left edge, 1 = right edge)
  focusY: number; // 0..1
  // overlays
  dark: { placement: Placement; strength: number }; // strength 0..1
  brand: { placement: BrandPlacement; colour: "red" | "white"; strength: number };
  // brand mark
  logo: { corner: Corner; style: LogoStyle; event: EventFormat };
  // text block (chip + headline + subtext move together)
  textColour: "white" | "ink";
  block: BlockPos;
  align: Align;
  chip: { show: boolean; text: string; colour: ChipColour; place: ChipPlace };
  headline: string;
  subtext: string;
  // carousel call to action
  cta: { show: boolean; text: string };
};

export const DEFAULT_SPEC: PostSpec = {
  aspect: "4:5",
  zoom: 1,
  focusX: 0.5,
  focusY: 0.5,
  dark: { placement: "bottom", strength: 0.55 },
  brand: { placement: "none", colour: "red", strength: 0.5 },
  logo: { corner: "tl", style: "mono", event: "Standard" },
  textColour: "white",
  block: "bottom",
  align: "left",
  chip: { show: false, text: "Ideas worth spreading", colour: "red", place: "text" },
  headline: "",
  subtext: "",
  cta: { show: false, text: "Swipe" },
};

// ---- small helpers ----
const f = (weight: number, px: number) => `${weight} ${px}px "PJS", system-ui, sans-serif`;

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(""); continue; }
    let cur = "";
    for (const w of words) {
      const t = cur ? cur + " " + w : w;
      if (ctx.measureText(t).width <= maxW || !cur) cur = t;
      else { out.push(cur); cur = w; }
    }
    if (cur) out.push(cur);
  }
  return out;
}

// ---- photo ----
function drawPhoto(ctx: CanvasRenderingContext2D, im: HTMLImageElement, W: number, H: number, zoom: number, fx: number, fy: number) {
  const base = Math.max(W / im.width, H / im.height);
  const s = base * Math.max(1, zoom);
  const nw = im.width * s, nh = im.height * s;
  const x = (W - nw) * fx; // both W-nw and H-nh are <= 0 (overhang)
  const y = (H - nh) * fy;
  ctx.drawImage(im, x, y, nw, nh);
}

// ---- overlays ----
function overlay(ctx: CanvasRenderingContext2D, W: number, H: number, hex: string, placement: BrandPlacement, strength: number) {
  const [r, g, b] = hexToRgb(hex);
  const solid = `rgba(${r},${g},${b},${strength})`;
  const clear = `rgba(${r},${g},${b},0)`;
  if (placement === "whole") {
    ctx.fillStyle = solid;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  let grad: CanvasGradient;
  if (placement === "bottom") grad = ctx.createLinearGradient(0, H, 0, H * 0.28);
  else if (placement === "top") grad = ctx.createLinearGradient(0, 0, 0, H * 0.72);
  else grad = ctx.createLinearGradient(0, H, W, 0); // diagonal: bottom-left -> top-right
  grad.addColorStop(0, solid);
  grad.addColorStop(1, clear);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// ---- logo ----
const lockupCache = new Map<string, Promise<HTMLImageElement>>();
function loadLockup(src: string): Promise<HTMLImageElement> {
  let p = lockupCache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = src;
    });
    lockupCache.set(src, p);
  }
  return p;
}

type LogoRect = { x: number; y: number; w: number; h: number } | null;

async function drawLogo(ctx: CanvasRenderingContext2D, W: number, H: number, spec: PostSpec): Promise<LogoRect> {
  if (spec.logo.corner === "none") return null;
  const src = `/brand/lockups/TEDxNewy-${spec.logo.event}-${spec.logo.style}.png`;
  let im: HTMLImageElement;
  try { im = await loadLockup(src); } catch { return null; }
  const targetW = W * 0.26;
  const s = targetW / im.width;
  const lw = targetW, lh = im.height * s;
  const pad = W * 0.055;
  let x = pad, y = pad;
  if (spec.logo.corner === "tr" || spec.logo.corner === "br") x = W - pad - lw;
  if (spec.logo.corner === "bl" || spec.logo.corner === "br") y = H - pad - lh;
  ctx.drawImage(im, x, y, lw, lh);
  return { x, y, w: lw, h: lh };
}

// ---- chip (a pill that autofits its text) ----
function chipMetrics(ctx: CanvasRenderingContext2D, text: string, h: number) {
  const fs = h * 0.46;
  ctx.font = f(700, fs);
  const padX = h * 0.44;
  return { fs, padX, w: ctx.measureText(text).width + padX * 2 };
}

// Paints a chip with its top-left at (x, y); returns its width.
function paintChip(ctx: CanvasRenderingContext2D, colour: ChipColour, text: string, x: number, y: number, h: number) {
  const c = CHIP_COLOURS.find((k) => k.id === colour) ?? CHIP_COLOURS[0];
  const { fs, padX, w } = chipMetrics(ctx, text, h);
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = c.bg;
  ctx.fill();
  ctx.fillStyle = c.fg;
  const pa = ctx.textAlign, pb = ctx.textBaseline;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + h / 2 + fs * 0.04);
  ctx.textAlign = pa;
  ctx.textBaseline = pb;
  return w;
}

// Chip sitting in the logo band, on the side opposite the logo.
function drawInlineChip(ctx: CanvasRenderingContext2D, W: number, H: number, spec: PostSpec, logoRect: LogoRect) {
  if (!spec.chip.show || spec.chip.place !== "logo") return;
  const text = spec.chip.text.trim();
  if (!text) return;
  const h = H * 0.046;
  const pad = W * 0.055;
  const onBottom = spec.logo.corner === "bl" || spec.logo.corner === "br";
  const logoLeft = spec.logo.corner === "tl" || spec.logo.corner === "bl";
  const y = logoRect ? logoRect.y + (logoRect.h - h) / 2 : onBottom ? H - pad - h : pad;
  const { w } = chipMetrics(ctx, text, h);
  // opposite side of the logo; if the logo is hidden, sit at the left margin
  const x = spec.logo.corner === "none" ? pad : logoLeft ? W - pad - w : pad;
  paintChip(ctx, spec.chip.colour, text, x, y, h);
}

// ---- text block (chip + headline + subtext) ----

function drawText(ctx: CanvasRenderingContext2D, W: number, H: number, spec: PostSpec) {
  const M = W * 0.075;
  const maxW = W - 2 * M;
  const col = spec.textColour === "white" ? "#ffffff" : PALETTE.ink;
  const sub = spec.textColour === "white" ? "rgba(255,255,255,0.86)" : PALETTE.ink3;

  const hlSize = H * 0.062, hlLead = hlSize * 1.1;
  const subSize = H * 0.03, subLead = subSize * 1.35;
  const chipInBlock = spec.chip.show && spec.chip.place === "text" && !!spec.chip.text.trim();
  const chipH = chipInBlock ? H * 0.046 : 0;

  ctx.textBaseline = "top";
  ctx.font = f(800, hlSize);
  const hlLines = spec.headline.trim() ? wrap(ctx, spec.headline, maxW) : [];
  ctx.font = f(500, subSize);
  const subLines = spec.subtext.trim() ? wrap(ctx, spec.subtext, maxW) : [];

  const gapChip = chipH ? H * 0.022 : 0;
  const gapSub = hlLines.length && subLines.length ? H * 0.024 : 0;
  const blockH =
    chipH + gapChip + hlLines.length * hlLead + gapSub + subLines.length * subLead;
  if (blockH === 0) return;

  const pad = H * 0.075;
  let y =
    spec.block === "top" ? pad :
    spec.block === "center" ? (H - blockH) / 2 :
    H - pad - blockH;

  const anchorX = spec.align === "left" ? M : spec.align === "right" ? W - M : W / 2;
  ctx.textAlign = spec.align;

  if (chipH) {
    const text = spec.chip.text.trim();
    const { w } = chipMetrics(ctx, text, chipH);
    const cx = spec.align === "left" ? anchorX : spec.align === "right" ? anchorX - w : anchorX - w / 2;
    paintChip(ctx, spec.chip.colour, text, cx, y, chipH);
    y += chipH + gapChip;
  }

  ctx.textAlign = spec.align;
  if (hlLines.length) {
    ctx.font = f(800, hlSize);
    ctx.fillStyle = col;
    for (const line of hlLines) { ctx.fillText(line, anchorX, y); y += hlLead; }
    y += gapSub;
  }
  if (subLines.length) {
    ctx.font = f(500, subSize);
    ctx.fillStyle = sub;
    for (const line of subLines) { ctx.fillText(line, anchorX, y); y += subLead; }
  }
  ctx.textAlign = "left";
}

// ---- carousel CTA (bottom-right text + arrow) ----
function drawCta(ctx: CanvasRenderingContext2D, W: number, H: number, spec: PostSpec) {
  if (!spec.cta.show) return;
  const text = (spec.cta.text || "Swipe").trim().toUpperCase();
  const col = spec.textColour === "white" ? "#ffffff" : PALETTE.ink;
  const fs = H * 0.026;
  const M = W * 0.075;
  const cy = H - H * 0.06;
  const arrowSize = fs * 1.05;
  const gap = fs * 0.5;

  ctx.font = f(700, fs);
  const tw = text ? ctx.measureText(text).width : 0;
  const totalW = tw + (text ? gap : 0) + arrowSize;
  const startX = W - M - totalW;

  ctx.fillStyle = col;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  if (text) ctx.fillText(text, startX, cy + fs * 0.04);
  ctx.textBaseline = "top";

  // drawn arrow (crisp, brand-agnostic)
  const ax = startX + tw + (text ? gap : 0);
  ctx.strokeStyle = col;
  ctx.lineWidth = arrowSize * 0.13;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(ax, cy);
  ctx.lineTo(ax + arrowSize, cy);
  ctx.moveTo(ax + arrowSize * 0.58, cy - arrowSize * 0.34);
  ctx.lineTo(ax + arrowSize, cy);
  ctx.lineTo(ax + arrowSize * 0.58, cy + arrowSize * 0.34);
  ctx.stroke();
}

// ---- main ----
export async function renderPost(
  canvas: HTMLCanvasElement,
  spec: PostSpec,
  im: HTMLImageElement | null,
  scale = 1,
) {
  await ensureFonts();
  const a = ASPECTS.find((x) => x.id === spec.aspect) ?? ASPECTS[0];
  const W = a.w * scale, H = a.h * scale;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  ctx.textBaseline = "top";

  if (im) drawPhoto(ctx, im, W, H, spec.zoom, spec.focusX, spec.focusY);
  else { ctx.fillStyle = PALETTE.ink; ctx.fillRect(0, 0, W, H); }

  if (spec.dark.placement !== "none" && spec.dark.strength > 0) {
    overlay(ctx, W, H, "#000000", spec.dark.placement, spec.dark.strength);
  }
  if (spec.brand.placement !== "none" && spec.brand.strength > 0) {
    overlay(ctx, W, H, spec.brand.colour === "red" ? PALETTE.red : "#ffffff", spec.brand.placement, spec.brand.strength);
  }
  const logoRect = await drawLogo(ctx, W, H, spec);
  drawText(ctx, W, H, spec);
  drawInlineChip(ctx, W, H, spec, logoRect);
  drawCta(ctx, W, H, spec);
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((res) => canvas.toBlob((b) => res(b!), type, quality));
}
