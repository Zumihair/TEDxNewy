/**
 * Renders an impact report config to a self-contained HTML document.
 *
 * Pure string templating on purpose: the same output feeds the editor's
 * live preview (iframe), the "Open print view" tab (browser Save as PDF) and
 * the server-side PDF route (headless Chromium), so it must not depend on
 * React rendering context. Pages are 4:5 (216 × 270 mm), LinkedIn's native
 * document ratio, and the type/colour system is the site's own: Bricolage
 * Grotesque with the display optical size, cream / ink / TEDx red, 12px
 * card radius. Design lineage: the hand-built Newcastle 2050 PDFs.
 *
 * `origin` is the absolute site origin (for the font file). Photo URLs are
 * already absolute (Vercel Blob / Supabase Storage).
 */

import type { ReportConfig, ReportStatement } from "./report-schema";

export type RenderOptions = {
  origin: string;
  /** Show the acknowledgement text on the close page (from lib/event-reports). */
  acknowledgement: string;
  /** Adds a tiny "auto print" script for the print-view tab. */
  autoPrint?: boolean;
};

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Escape, then turn "\n" into <br>. */
const nl = (s: string) => esc(s).replace(/\n/g, "<br>");

const attr = (s: string) => esc(s);

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return [224, 34, 20];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

/** A lighter tint of the accent for kickers on dark pages. */
function lighten(hex: string, amount = 0.45): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function css(accent: string, origin: string): string {
  const [r, g, b] = hexToRgb(accent);
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;
  return `
@font-face {
  font-family: "Bricolage";
  src: url("${origin}/fonts/BricolageGrotesque.ttf") format("truetype");
  font-weight: 200 800;
  font-stretch: 75% 100%;
}
@page { size: 216mm 270mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #f4efe6; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: "Bricolage", system-ui, sans-serif; color: #141210; -webkit-font-smoothing: antialiased; }
.page { position: relative; width: 216mm; height: 270mm; overflow: hidden; page-break-after: always; break-after: page; background: #f4efe6; padding: 18mm 18mm 26mm; display: flex; flex-direction: column; }
.page:last-of-type { page-break-after: auto; }
.page.dark { background: #141210; color: #fff; }
.page.tint { background: ${accent}; color: #fff; }
.grow { flex: 1; }
.kick { font-size: 10pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.24em; line-height: 1.3; color: ${accent}; }
.kick.on-dark { color: rgba(255,255,255,0.7); }
.kick.acc-light { color: ${lighten(accent)}; }
.disp { font-variation-settings: "opsz" 144; font-weight: 500; letter-spacing: -0.03em; line-height: 0.98; text-wrap: balance; }
.h-xxl { font-size: 58pt; }
.h-xl { font-size: 44pt; }
.h-l { font-size: 34pt; line-height: 1.04; letter-spacing: -0.025em; }
.h-s { font-size: 17pt; line-height: 1.2; letter-spacing: -0.015em; font-weight: 500; }
.lead { font-size: 15pt; line-height: 1.5; color: #2a2521; text-wrap: pretty; }
.body { font-size: 12.5pt; line-height: 1.55; color: #2a2521; text-wrap: pretty; }
.small { font-size: 10.5pt; line-height: 1.5; color: #6b6459; }
.dark .lead, .tint .lead, .cover-lead { color: rgba(255,255,255,0.86); }
.dark .body, .tint .body { color: rgba(255,255,255,0.8); }
.dark .small, .tint .small { color: rgba(255,255,255,0.55); }
em { font-style: italic; }
b, strong { font-weight: 600; }
.photo { overflow: hidden; border-radius: 12px; background: #e9e2d5; }
.photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.photo.fill { flex: 1; min-height: 0; }
.bleed { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,9,8,0.96) 0%, rgba(10,9,8,0.78) 40%, rgba(10,9,8,0.28) 72%, rgba(10,9,8,0.1) 100%); }
.glow { position: absolute; border-radius: 50%; pointer-events: none; }
.glow.acc { background: radial-gradient(circle, ${rgba(0.65)} 0%, ${rgba(0.22)} 40%, ${rgba(0)} 70%); }
.glow.red { background: radial-gradient(circle, rgba(224,34,20,0.5) 0%, rgba(224,34,20,0) 70%); }
.rel { position: relative; z-index: 1; }
.rule { border: 0; border-top: 1px solid rgba(20,18,16,0.12); }
.dark .rule, .tint .rule { border-color: rgba(255,255,255,0.18); }
.lockup { height: 12mm; display: block; }
.mark { position: absolute; left: 18mm; right: 18mm; bottom: 10mm; display: flex; justify-content: space-between; align-items: center; font-size: 8.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; color: #6b6459; }
.dark .mark, .tint .mark { color: rgba(255,255,255,0.5); }
.mark .dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #e02214; margin-right: 9px; vertical-align: 1px; }
.tint .mark .dot { background: #fff; }
.num { font-variation-settings: "opsz" 144; font-weight: 500; font-size: 20pt; letter-spacing: -0.02em; color: ${accent}; }
.dark .num { color: ${lighten(accent)}; }
.tint .num { color: rgba(255,255,255,0.7); }
.quote { border-left: 3px solid ${accent}; padding: 2mm 0 2mm 7mm; }
.dark .quote { border-color: ${lighten(accent)}; }
.tint .quote { border-color: rgba(255,255,255,0.7); }
.quote .q { font-variation-settings: "opsz" 144; font-weight: 500; font-size: 19pt; line-height: 1.22; letter-spacing: -0.02em; text-wrap: balance; }
.quote .src { margin-top: 3mm; font-size: 9.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.18em; color: #6b6459; }
.dark .quote .src, .tint .quote .src { color: rgba(255,255,255,0.5); }
.stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12mm 10mm; }
.stat .n { font-variation-settings: "opsz" 144; font-weight: 500; font-size: 52pt; letter-spacing: -0.035em; line-height: 0.95; }
.stat .l { margin-top: 3mm; font-size: 12pt; line-height: 1.4; color: rgba(255,255,255,0.65); }
.stats.three .stat .n { font-size: 40pt; }
.grid4 { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 6mm; }
.caps { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm 8mm; margin-top: 6mm; }
.caps .small { color: #2a2521; }
.fbstats { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
.fbstats .n { font-variation-settings: "opsz" 144; font-weight: 500; font-size: 36pt; letter-spacing: -0.03em; line-height: 1; }
.fbstats .l { margin-top: 2mm; font-size: 11pt; line-height: 1.4; color: #6b6459; }
.testi { border-top: 1px solid rgba(20,18,16,0.12); padding: 5mm 0; }
.testi .t { font-variation-settings: "opsz" 144; font-weight: 500; font-size: 16pt; line-height: 1.25; letter-spacing: -0.015em; }
.testi .w { margin-top: 2mm; font-size: 9.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.18em; color: #6b6459; }
.partners { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
.partner { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); border-radius: 12px; padding: 9mm 7mm; }
.partner .nm { font-variation-settings: "opsz" 144; font-weight: 500; font-size: 19pt; letter-spacing: -0.02em; line-height: 1.05; color: #fff; }
.partner .lb { margin-top: 3mm; font-size: 8.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; color: #ff9b8f; }
.link { color: #fff; font-weight: 600; }
`;
}

const LOCKUP = "/brand/lockups/TEDxNewy-Standard-white.png";

function mark(label: string, n: number, total: number): string {
  return `<div class="mark"><span><span class="dot"></span>${esc(label)}</span><span>${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span></div>`;
}

function coverPage(c: ReportConfig, origin: string): string {
  const photo = c.cover.photoUrl
    ? `<img class="bleed" src="${attr(c.cover.photoUrl)}" alt="">`
    : `<div class="bleed" style="background:#141210"></div>`;
  return `<section class="page" style="padding:0;">
  ${photo}
  <div class="shade"></div>
  <div class="glow acc" style="left:-40mm;bottom:-50mm;width:180mm;height:180mm;"></div>
  <img class="lockup" src="${origin}${LOCKUP}" alt="TEDxNewy" style="position:absolute;left:18mm;top:18mm;">
  <div class="kick on-dark" style="position:absolute;right:18mm;top:19mm;text-align:right;">${nl(c.cover.stamp)}</div>
  <div class="rel" style="position:absolute;left:18mm;right:18mm;bottom:22mm;color:#fff;">
    ${c.cover.kicker ? `<div class="kick acc-light">${esc(c.cover.kicker)}</div>` : ""}
    <h1 class="disp ${c.cover.title.length > 28 ? "h-xl" : "h-xxl"}" style="margin-top:6mm;color:#fff;">${nl(c.cover.title)}</h1>
    ${c.cover.lead ? `<p class="lead cover-lead" style="margin-top:7mm;max-width:150mm;">${nl(c.cover.lead)}</p>` : ""}
  </div>
</section>`;
}

function numbersPage(c: ReportConfig, n: number, total: number): string {
  const stats = c.numbers.stats.filter((s) => s.value || s.label);
  const three = stats.length > 4;
  return `<section class="page dark">
  <div class="glow acc" style="right:-70mm;top:-70mm;width:220mm;height:220mm;"></div>
  <div class="rel">
    <div class="kick on-dark">${esc(c.numbers.kicker)}</div>
    <div class="stats ${three ? "three" : ""}" style="margin-top:12mm;${three ? "grid-template-columns:1fr 1fr;" : ""}">
      ${stats.map((s) => `<div class="stat"><div class="n">${esc(s.value)}</div><div class="l">${esc(s.label)}</div></div>`).join("")}
    </div>
  </div>
  <div class="grow"></div>
  ${c.numbers.note ? `<p class="rel body" style="max-width:165mm;">${nl(c.numbers.note)}</p>` : ""}
  ${mark(c.footerLabel, n, total)}
</section>`;
}

function photosPage(c: ReportConfig, n: number, total: number): string {
  const items = c.photos.items.slice(0, 4);
  const hasCaps = items.some((i) => i.caption);
  return `<section class="page">
  <div class="kick">${esc(c.photos.kicker)}</div>
  ${c.photos.title ? `<h2 class="disp h-l" style="margin-top:4mm;max-width:165mm;">${nl(c.photos.title)}</h2>` : ""}
  <div class="grow grid4" style="margin-top:9mm;">
    ${items.map((i) => `<div class="photo"><img src="${attr(i.url)}" alt=""></div>`).join("")}
  </div>
  ${hasCaps ? `<div class="caps">${items.map((i) => `<p class="small">${esc(i.caption)}</p>`).join("")}</div>` : ""}
  ${mark(c.footerLabel, n, total)}
</section>`;
}

function statementPage(c: ReportConfig, s: ReportStatement, n: number, total: number): string {
  const cls = s.tone === "dark" ? "page dark" : s.tone === "tint" ? "page tint" : "page";
  const quote = s.quote
    ? `<div class="quote" style="margin-top:8mm;"><div class="q">${nl(s.quote)}</div>${s.quoteSource ? `<div class="src">${esc(s.quoteSource)}</div>` : ""}</div>`
    : "";
  const text = `
    ${s.number ? `<div class="num">${esc(s.number)}</div>` : ""}
    <h2 class="disp ${s.photoUrl ? "h-l" : "h-xl"}" style="margin-top:3mm;${s.tone !== "cream" ? "color:#fff;" : ""}">${nl(s.headline)}</h2>
    ${s.body ? `<p class="lead" style="margin-top:5mm;max-width:165mm;">${nl(s.body)}</p>` : ""}
    ${quote}`;
  if (s.photoUrl) {
    return `<section class="${cls}">
  <div class="photo fill" style="margin-bottom:9mm;"><img src="${attr(s.photoUrl)}" alt=""></div>
  <div>${text}</div>
  ${mark(c.footerLabel, n, total)}
</section>`;
  }
  const glow = s.tone === "dark" ? `<div class="glow acc" style="right:-60mm;top:-60mm;width:200mm;height:200mm;"></div>` : "";
  return `<section class="${cls}">
  ${glow}
  <div class="rel grow" style="display:flex;flex-direction:column;justify-content:center;">${text}</div>
  ${mark(c.footerLabel, n, total)}
</section>`;
}

function feedbackPage(c: ReportConfig, n: number, total: number): string {
  const stats = c.feedback.stats.slice(0, 4);
  const testis = c.feedback.testimonials.slice(0, 3);
  return `<section class="page">
  <div class="kick">${esc(c.feedback.kicker)}</div>
  ${c.feedback.title ? `<h2 class="disp h-l" style="margin-top:4mm;max-width:165mm;">${nl(c.feedback.title)}</h2>` : ""}
  ${stats.length ? `<div class="fbstats" style="margin-top:10mm;">${stats.map((s) => `<div><div class="n">${esc(s.value)}</div><div class="l">${esc(s.label)}</div></div>`).join("")}</div>` : ""}
  <div class="grow"></div>
  ${testis.length ? `<div>${testis.map((t) => `<div class="testi"><div class="t">&ldquo;${nl(t.text)}&rdquo;</div>${t.name ? `<div class="w">${esc(t.name)}</div>` : ""}</div>`).join("")}</div>` : ""}
  ${mark(c.footerLabel, n, total)}
</section>`;
}

function closePage(c: ReportConfig, n: number, total: number, origin: string, ack: string): string {
  const partners = c.close.partners.slice(0, 4);
  return `<section class="page dark">
  <div class="glow red" style="left:-50mm;bottom:-60mm;width:200mm;height:200mm;"></div>
  <div class="rel">
    <div class="kick on-dark">${esc(c.close.kicker)}</div>
    ${c.close.title ? `<h2 class="disp h-l" style="margin-top:4mm;color:#fff;max-width:165mm;">${nl(c.close.title)}</h2>` : ""}
    ${c.close.body ? `<p class="lead" style="margin-top:6mm;max-width:165mm;">${nl(c.close.body)}</p>` : ""}
    ${partners.length ? `<div class="partners" style="margin-top:8mm;">${partners.map((p) => `<div class="partner"><div class="nm">${esc(p.name)}</div>${p.label ? `<div class="lb">${esc(p.label)}</div>` : ""}</div>`).join("")}</div>` : ""}
  </div>
  <div class="grow"></div>
  <div class="rel">
    ${c.close.nextText || c.close.linkUrl ? `<div class="kick on-dark" style="font-size:8.5pt;">${esc(c.close.nextLabel)}</div>
    <p class="body" style="margin-top:2mm;max-width:165mm;">${nl(c.close.nextText)}${c.close.linkUrl ? ` <span class="link">${esc(c.close.linkLabel || c.close.linkUrl)}</span>` : ""}</p>` : ""}
    <hr class="rule" style="margin:7mm 0 5mm;">
    <div style="display:grid;grid-template-columns:1fr auto;gap:8mm;align-items:end;">
      <p class="small" style="max-width:120mm;">${c.close.showAcknowledgement ? esc(ack) : ""}</p>
      <img class="lockup" src="${origin}${LOCKUP}" alt="TEDxNewy" style="height:10mm;">
    </div>
  </div>
  ${mark(c.footerLabel, n, total)}
</section>`;
}

export function renderReportHtml(c: ReportConfig, opts: RenderOptions): string {
  const origin = opts.origin.replace(/\/$/, "");
  const pages: string[] = [];
  const total =
    1 +
    (c.numbers.enabled ? 1 : 0) +
    (c.photos.enabled && c.photos.items.length > 0 ? 1 : 0) +
    c.statements.length +
    (c.feedback.enabled ? 1 : 0) +
    1;
  let n = 1;
  pages.push(coverPage(c, origin));
  if (c.numbers.enabled) pages.push(numbersPage(c, ++n, total));
  if (c.photos.enabled && c.photos.items.length > 0) pages.push(photosPage(c, ++n, total));
  for (const s of c.statements) pages.push(statementPage(c, s, ++n, total));
  if (c.feedback.enabled) pages.push(feedbackPage(c, ++n, total));
  pages.push(closePage(c, ++n, total, origin, opts.acknowledgement));

  const auto = opts.autoPrint
    ? `<script>window.addEventListener("load",function(){document.fonts.ready.then(function(){setTimeout(function(){window.print()},300)})})</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="robots" content="noindex">
<title>${esc(c.cover.title || "Impact report")}</title>
<style>${css(c.accent, origin)}</style>
</head><body>
${pages.join("\n")}
${auto}
</body></html>`;
}
