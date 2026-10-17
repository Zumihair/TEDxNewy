// Client-side brand render engine for the team brand portal.
// A TypeScript/canvas port of the Python brand kit used by the asset library, so
// the portal produces the same on-brand virtual backgrounds, banners, and slides.
// Lockups live in /public/brand/lockups; Inter is loaded from /public/fonts.

export const PALETTE = {
  red: "#e62b1e",
  redDeep: "#2a0604",
  redDark: "#8c0d05",
  redBright: "#ff3626",
  cream: "#f4efe6",
  ink: "#000000",
  ink2: "#2a2521",
  ink3: "#6b6459",
  white: "#ffffff",
};

export const EVENTS = ["Standard", "Salon", "Youth"] as const;
export type EventFormat = (typeof EVENTS)[number];

export type Bg = {
  id: string;
  label: string;
  kind: "colour" | "gradient" | "image" | "theme";
  value: string; // hex, "a→b" gradient stops, or image path
  dark: boolean; // text/logo should go light
  red: boolean; // use the all-white mono lockup
};

// Background choices. Themes are drawn in code, so they stay crisp at any size and always on brand.
export const THEMES: Bg[] = [
  { id: "signal", label: "Signal", kind: "theme", value: "signal", dark: true, red: false },
  { id: "spotlight", label: "Spotlight", kind: "theme", value: "spotlight", dark: true, red: false },
  { id: "rings", label: "Rings", kind: "theme", value: "rings", dark: true, red: false },
  { id: "bold", label: "Bold red", kind: "theme", value: "bold", dark: true, red: true },
  { id: "paper", label: "Paper", kind: "theme", value: "paper", dark: false, red: false },
  { id: "clean", label: "Clean", kind: "theme", value: "clean", dark: false, red: false },
  { id: "night", label: "Night", kind: "theme", value: "night", dark: true, red: false },
  { id: "deep", label: "Deep", kind: "theme", value: "deep", dark: true, red: false },
];

export const BANNER_SIZES: Record<string, [number, number]> = {
  "LinkedIn personal cover": [1584, 396],
  "LinkedIn company cover": [1128, 191],
  "Facebook event cover": [1920, 1005],
  "Website hero": [1600, 600],
  "Email header": [1200, 400],
  "Instagram post": [1080, 1080],
  "Instagram story": [1080, 1920],
  "YouTube thumbnail": [1280, 720],
  "Zoom / virtual background": [1920, 1080],
};

// ---- font loading ----
let fontsReady: Promise<void> | null = null;
export function ensureFonts(): Promise<void> {
  if (fontsReady) return fontsReady;
  const defs: [number, string][] = [
    [500, "/fonts/Inter-Medium.ttf"],
    [600, "/fonts/Inter-SemiBold.ttf"],
    [700, "/fonts/Inter-Bold.ttf"],
    [800, "/fonts/Inter-ExtraBold.ttf"],
  ];
  fontsReady = Promise.all(
    defs.map(async ([weight, url]) => {
      const f = new FontFace("InterBrand", `url(${url})`, { weight: String(weight) });
      await f.load();
      (document as Document & { fonts: FontFaceSet }).fonts.add(f);
    })
  ).then(() => undefined);
  return fontsReady;
}

const font = (weight: number, px: number) => `${weight} ${px}px "InterBrand", system-ui, sans-serif`;

// ---- image cache ----
const imgCache = new Map<string, Promise<HTMLImageElement>>();
function loadImage(src: string): Promise<HTMLImageElement> {
  let p = imgCache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = src;
    });
    imgCache.set(src, p);
  }
  return p;
}

function lockupStyle(bg: Bg): "black" | "white" | "mono" {
  if (bg.red) return "mono";
  return bg.dark ? "white" : "black";
}

// ---- drawing helpers ----
function coverDraw(ctx: CanvasRenderingContext2D, im: HTMLImageElement, w: number, h: number, focusY = 0.4) {
  const s = Math.max(w / im.width, h / im.height);
  const nw = im.width * s, nh = im.height * s;
  const x = (w - nw) / 2, y = -(nh - h) * focusY;
  ctx.drawImage(im, x, y, nw, nh);
}

function scrim(ctx: CanvasRenderingContext2D, w: number, h: number, frac: number, strength: number, top = false) {
  const gh = h * frac;
  const grad = top ? ctx.createLinearGradient(0, 0, 0, gh) : ctx.createLinearGradient(0, h - gh, 0, h);
  const a = (strength / 255).toFixed(3);
  if (top) {
    grad.addColorStop(0, `rgba(0,0,0,${a})`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, gh);
  } else {
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, `rgba(0,0,0,${a})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - gh, w, gh);
  }
}

/** A small seeded random generator, so the Signal network looks the same every time. */
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

async function paintTheme(ctx: CanvasRenderingContext2D, w: number, h: number, id: string) {
  const u = Math.min(w, h);
  const fillAll = (c: string | CanvasGradient) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, w, h);
  };
  switch (id) {
    case "signal": {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, PALETTE.redDeep);
      g.addColorStop(1, "#5a0c06");
      fillAll(g);
      const r = rng(11);
      const pts = Array.from({ length: 26 }, () => ({ x: r() * w, y: r() * h }));
      ctx.lineWidth = Math.max(1, u * 0.0025);
      ctx.strokeStyle = "rgba(255,255,255,0.13)";
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < u * 0.42) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      pts.forEach((p, i) => {
        ctx.fillStyle = i % 9 === 0 ? PALETTE.red : "rgba(255,255,255,0.4)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, u * (i % 9 === 0 ? 0.011 : 0.006), 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
    case "spotlight": {
      fillAll(PALETTE.ink);
      const g = ctx.createRadialGradient(w * 0.82, h * 1.05, 0, w * 0.82, h * 1.05, Math.max(w, h) * 0.85);
      g.addColorStop(0, "rgba(230,43,30,0.85)");
      g.addColorStop(0.45, "rgba(140,13,5,0.35)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      fillAll(g);
      break;
    }
    case "rings": {
      fillAll(PALETTE.redDeep);
      const cx = w * 0.88, cy = h * 0.9;
      for (let i = 6; i >= 1; i--) {
        ctx.beginPath();
        ctx.arc(cx, cy, u * 0.2 * i, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 ? "rgba(230,43,30,0.16)" : "rgba(230,43,30,0.07)";
        ctx.fill();
      }
      break;
    }
    case "bold": {
      fillAll(PALETTE.red);
      try {
        const x = await loadImage("/brand/lockups/TEDxNewy-X-white.png");
        const sz = u * 1.25;
        ctx.globalAlpha = 0.13;
        ctx.drawImage(x, w - sz * 0.72, h - sz * 0.78, sz, sz * (x.height / x.width));
        ctx.globalAlpha = 1;
      } catch {}
      break;
    }
    case "paper": {
      fillAll(PALETTE.cream);
      try {
        const x = await loadImage("/brand/lockups/TEDxNewy-X-red.png");
        const sz = u * 1.15;
        ctx.globalAlpha = 0.1;
        ctx.drawImage(x, w - sz * 0.7, h - sz * 0.8, sz, sz * (x.height / x.width));
        ctx.globalAlpha = 1;
      } catch {}
      break;
    }
    case "clean": {
      fillAll(PALETTE.white);
      ctx.fillStyle = PALETTE.red;
      ctx.fillRect(0, h - u * 0.045, w, u * 0.045);
      break;
    }
    case "night": {
      fillAll(PALETTE.ink);
      ctx.fillStyle = PALETTE.red;
      ctx.fillRect(w - u * 0.06, 0, u * 0.06, h);
      break;
    }
    default: {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#3d0a05");
      g.addColorStop(1, PALETTE.redDeep);
      fillAll(g);
    }
  }
}

/** Draws a background into a small canvas, for the picker swatches. */
export async function renderBgThumb(canvas: HTMLCanvasElement, bg: Bg) {
  canvas.width = 160;
  canvas.height = 90;
  await paintBackground(canvas.getContext("2d")!, 160, 90, bg);
}

async function paintBackground(ctx: CanvasRenderingContext2D, w: number, h: number, bg: Bg) {
  if (bg.kind === "theme") {
    await paintTheme(ctx, w, h, bg.value);
  } else if (bg.kind === "image") {
    const im = await loadImage(bg.value);
    coverDraw(ctx, im, w, h);
    scrim(ctx, w, h, 0.62, 205, false);
    scrim(ctx, w, h, 0.4, 120, true);
  } else if (bg.kind === "gradient") {
    const [a, b] = bg.value.split("→");
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = bg.value;
    ctx.fillRect(0, 0, w, h);
  }
}

async function drawLockup(
  ctx: CanvasRenderingContext2D, event: EventFormat, style: string,
  targetW: number, x: number, y: number, anchor: "tl" | "tr" | "bl"
) {
  const im = await loadImage(`/brand/lockups/TEDxNewy-${event}-${style}.png`);
  const s = targetW / im.width;
  const lw = targetW, lh = im.height * s;
  let px = x, py = y;
  if (anchor === "tr") px = x - lw;
  if (anchor === "bl") py = y - lh;
  ctx.drawImage(im, px, py, lw, lh);
  return { lw, lh };
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width <= maxW || !cur) cur = t;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawBlock(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number,
  maxW: number, leading: number, align: "left" = "left"
) {
  const lines = wrapLines(ctx, text, maxW);
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], x, y + i * leading);
  return y + lines.length * leading;
}

// ---- compositions ----
export type Spec = {
  kind: "vbg" | "banner" | "slide";
  bg: Bg;
  event: EventFormat;
  heading?: string;
  subheading?: string;
  tagline?: boolean;
  size?: string;
  lockupPos?: "top" | "bottom";
};

export function specDims(spec: Spec): [number, number] {
  if (spec.kind === "banner") return BANNER_SIZES[spec.size || "Website hero"] || [1600, 600];
  return [1920, 1080];
}

export async function renderToCanvas(canvas: HTMLCanvasElement, spec: Spec) {
  await ensureFonts();
  const [w, h] = specDims(spec);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.textBaseline = "top";
  await paintBackground(ctx, w, h, spec.bg);
  const style = lockupStyle(spec.bg);
  const txt = spec.bg.dark ? PALETTE.white : PALETTE.ink;
  const sub = spec.bg.dark ? "#ebe6e1" : PALETTE.ink3;

  if (spec.kind === "vbg") {
    const M = w * 0.055;
    await drawLockup(ctx, spec.event, style, w * 0.26, M, M, "tl");
    if (spec.heading) {
      const y = h - M - h * 0.16;
      ctx.fillStyle = txt;
      ctx.font = font(800, h * 0.072);
      ctx.fillText(spec.heading, M, y);
      if (spec.subheading) {
        ctx.fillStyle = sub;
        ctx.font = font(500, h * 0.038);
        ctx.fillText(spec.subheading, M, y + h * 0.085);
      }
    }
    if (spec.tagline) {
      ctx.fillStyle = sub;
      ctx.font = font(500, h * 0.024);
      const t = "x = independently organized TED event";
      ctx.fillText(t, w - M - ctx.measureText(t).width, h - M - h * 0.03);
    }
  } else if (spec.kind === "banner") {
    const M = Math.min(w, h) * 0.09;
    const lkW = w * (w >= h ? 0.2 : 0.55);
    let ty = M;
    if ((spec.lockupPos || "top") === "top") {
      const { lh } = await drawLockup(ctx, spec.event, style, lkW, M, M, "tl");
      ty = M + lh + h * 0.06;
    }
    const maxW = w - 2 * M;
    if (spec.heading) {
      ctx.fillStyle = txt;
      ctx.font = font(800, h * (w >= h ? 0.12 : 0.075));
      ty = drawBlock(ctx, spec.heading, M, ty, maxW, h * (w >= h ? 0.13 : 0.085)) + h * 0.02;
    }
    if (spec.subheading) {
      ctx.fillStyle = sub;
      ctx.font = font(500, h * (w >= h ? 0.05 : 0.034));
      drawBlock(ctx, spec.subheading, M, ty, maxW, h * (w >= h ? 0.062 : 0.045));
    }
    if ((spec.lockupPos || "top") === "bottom") {
      await drawLockup(ctx, spec.event, style, lkW, M, h - M, "bl");
    }
  } else {
    // slide title
    const M = w * 0.075;
    ctx.fillStyle = PALETTE.red;
    ctx.fillRect(M, h * 0.4, w * 0.06, 10);
    let y = h * 0.44;
    if (spec.heading) {
      ctx.fillStyle = txt;
      ctx.font = font(800, h * 0.11);
      y = drawBlock(ctx, spec.heading, M, y, w - 2 * M, h * 0.115) + h * 0.02;
    }
    if (spec.subheading) {
      ctx.fillStyle = sub;
      ctx.font = font(500, h * 0.04);
      drawBlock(ctx, spec.subheading, M, y, w * 0.7, h * 0.05);
    }
    await drawLockup(ctx, spec.event, style, w * 0.16, w - M, M, "tr");
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
}
