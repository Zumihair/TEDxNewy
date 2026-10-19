"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Icon } from "@/components/ds";

const INK = "000000";
const RED = "E62B1E";
const WHITE = "FFFFFF";
const SITE = "https://tedxnewy.com.au";

// Slide canvas, in inches (16:9). The same spec drives the PowerPoint file and the previews on this page,
// so the two cannot drift apart.
const W = 13.333;
const H = 7.5;
const LOGO_W = 2.2;
const LOGO_H = LOGO_W * (256 / 1412);
const X_RATIO = 929 / 948;

type ImgKey = "logoWhite" | "logoBlack" | "logoMono" | "xWhite" | "qr";
const IMG_SRC: Record<ImgKey, string> = {
  logoWhite: "/brand/media/TEDxNewy-Standard-white.png",
  logoBlack: "/brand/media/TEDxNewy-Standard-black.png",
  logoMono: "/brand/media/TEDxNewy-Standard-mono.png",
  xWhite: "/brand/lockups/TEDxNewy-X-white.png",
  qr: "",
};

type Para = { text: string; bold?: boolean; size?: number; bullet?: boolean };
type El =
  | { k: "rect"; x: number; y: number; w: number; h: number; fill: string }
  | { k: "line"; x: number; y: number; w: number; color: string; t?: number }
  | { k: "ellipse"; x: number; y: number; w: number; h: number; fill: string }
  | { k: "img"; img: ImgKey; x: number; y: number; w: number; h: number; transparency?: number }
  | {
      k: "text"; x: number; y: number; w: number; h: number; size: number; color: string; paras: Para[];
      bold?: boolean; align?: "left" | "center"; valign?: "top" | "middle"; gap?: number;
    };
type SlideSpec = { group: string; label: string; bg: string; els: El[] };

const rect = (x: number, y: number, w: number, h: number, fill: string): El => ({ k: "rect", x, y, w, h, fill });
const text = (x: number, y: number, w: number, h: number, size: number, color: string, paras: Para[] | string, o: Partial<Extract<El, { k: "text" }>> = {}): El => ({
  k: "text", x, y, w, h, size, color, paras: typeof paras === "string" ? [{ text: paras }] : paras, ...o,
});
const logo = (img: ImgKey, pos: "tl" | "br" = "br"): El => ({
  k: "img", img, x: pos === "tl" ? 0.8 : W - 0.8 - LOGO_W, y: pos === "tl" ? 0.65 : H - 0.55 - LOGO_H, w: LOGO_W, h: LOGO_H,
});
// The one ghosted X used on the title, statistic and thank-you slides: big, cropped by the right edge.
const ghostX = (): El => ({ k: "img", img: "xWhite", x: W - 6.2, y: -0.9, w: 9.6, h: 9.6 * X_RATIO, transparency: 88 });
const redBar: El = rect(0, 0, W, 0.22, RED);
const heading = (t: string): El => text(0.8, 0.8, 11, 0.9, 40, INK, t, { bold: true });

// Where white content slides start, so every one lines up with the first agenda item.
const TOP = 2.25;

const stat = (dark: boolean): SlideSpec => ({
  group: "Statistic",
  label: dark ? "Statistic, black" : "Statistic, red",
  bg: dark ? INK : RED,
  els: [
    ghostX(),
    text(0.8, 1.5, 9, 2.6, 150, WHITE, "1,200", { bold: true, valign: "middle" }),
    text(0.8, 4.4, 8, 1.0, 26, WHITE, "What this number measures, in one short line", { bold: true, valign: "top" }),
    text(0.8, 5.4, 8, 0.5, 16, dark ? "CFC8BE" : WHITE, "Where it comes from, and the period it covers"),
  ],
});

const quote = (dark: boolean): SlideSpec => ({
  group: "Quote",
  label: dark ? "Quote, black" : "Quote, red",
  bg: dark ? INK : RED,
  els: [
    text(0.8, 0.9, 2, 2, 160, dark ? RED : WHITE, "“", { bold: true, valign: "top" }),
    text(1.0, 2.3, 11, 2.4, 42, WHITE, "A short quote goes here, in a few strong lines.", { bold: true, valign: "top" }),
    rect(1.0, 5.0, 0.9, 0.09, dark ? RED : WHITE),
    text(1.0, 5.25, 9, 0.6, 18, dark ? "CFC8BE" : WHITE, "Name, role or organisation"),
  ],
});

// Four stages joined by a line, each a numbered circle with a heading and a short note.
const timeline = (dark: boolean): SlideSpec => {
  const ink = WHITE;
  const dot = dark ? RED : WHITE;
  const num = dark ? WHITE : RED;
  const stages = [
    { h: "Stage one", t: "A short note about what happens first." },
    { h: "Stage two", t: "A short note about what happens next." },
    { h: "Stage three", t: "A short note about what comes after." },
    { h: "Stage four", t: "A short note about where it ends up." },
  ];
  return {
    group: "Timeline",
    label: dark ? "Timeline, black" : "Timeline, red",
    bg: dark ? INK : RED,
    els: [
      text(0.8, 0.8, 11, 0.9, 40, WHITE, "Timeline title", { bold: true }),
      { k: "line", x: 1.4, y: TOP + 0.45, w: 10.5, color: dark ? "4D4D4D" : "F2A29B", t: 3 },
      ...stages.flatMap((s, i): El[] => {
        const cx = 1.9 + i * 3.1;
        return [
          { k: "ellipse", x: cx - 0.45, y: TOP, w: 0.9, h: 0.9, fill: dot },
          text(cx - 0.45, TOP, 0.9, 0.9, 24, num, String(i + 1), { bold: true, align: "center", valign: "middle" }),
          text(cx - 1.35, TOP + 1.3, 2.7, 0.6, 22, ink, s.h, { bold: true, align: "center", valign: "top" }),
          text(cx - 1.35, TOP + 1.95, 2.7, 1.4, 16, dark ? "CFC8BE" : WHITE, s.t, { align: "center", valign: "top" }),
        ];
      }),
    ],
  };
};

const SLIDES: SlideSpec[] = [
  // Opening
  {
    group: "Opening", label: "Title", bg: RED,
    els: [
      ghostX(),
      logo("logoMono", "tl"),
      text(0.8, 2.4, 8.2, 2.2, 54, WHITE, "Presentation title", { bold: true, valign: "top" }),
      text(0.8, 4.85, 7.6, 0.9, 20, WHITE, "A short line about what this talk covers", { valign: "top" }),
      text(0.8, 6.5, 7.6, 0.4, 14, WHITE, "Your name   |   Date", { bold: true }),
    ],
  },
  {
    group: "Opening", label: "Acknowledgement of Country", bg: INK,
    els: [
      logo("logoWhite", "tl"),
      text(0.8, 1.9, 11, 0.9, 40, WHITE, "Acknowledgement of Country", { bold: true }),
      text(
        0.8, 3.2, 10.4, 3.2, 24, WHITE,
        [
          { text: "TEDxNewy acknowledges the Awabakal and Worimi people, the Traditional Custodians of the land on which we gather today." },
          { text: "We pay our respects to Elders past and present, and extend that respect to all Aboriginal and Torres Strait Islander people joining us." },
        ],
        { valign: "top", gap: 18 },
      ),
    ],
  },
  {
    group: "Opening", label: "Agenda", bg: WHITE,
    els: [
      redBar,
      heading("Agenda"),
      ...["Where we are today", "What we have learned", "What happens next", "Questions"].flatMap((t, i): El[] => {
        const y = 2.0 + i * 1.0;
        return [
          text(0.8, y, 1.1, 0.9, 30, RED, String(i + 1).padStart(2, "0"), { bold: true, valign: "middle" }),
          text(2.1, y, 9, 0.9, 26, INK, t, { valign: "middle" }),
          { k: "line", x: 0.8, y: y + 0.95, w: 8.6, color: "D8D2C8" },
        ];
      }),
    ],
  },
  {
    group: "Opening", label: "Section title", bg: INK,
    els: [
      rect(0, 0, 0.5, H, RED),
      logo("logoWhite", "tl"),
      text(1.2, 2.3, 4, 1, 44, RED, "01", { bold: true }),
      text(1.2, 3.3, 11, 1.6, 60, WHITE, "Section title", { bold: true, valign: "top" }),
    ],
  },
  // Content
  {
    group: "Content", label: "Content with image", bg: WHITE,
    els: [
      redBar,
      heading("One idea per slide"),
      text(
        0.8, TOP, 5.8, 3.6, 22, INK,
        [
          { text: "Keep each slide to a single point", bullet: true },
          { text: "Use images and short lines, not paragraphs", bullet: true },
          { text: "Say the detail out loud instead of printing it", bullet: true },
        ],
        { valign: "top", gap: 14 },
      ),
      rect(7.1, TOP, 5.4, 4.1, RED),
      text(7.1, TOP, 5.4, 4.1, 16, WHITE, "Add an image here", { bold: true, align: "center", valign: "middle" }),
    ],
  },
  {
    group: "Content", label: "Content, text only", bg: WHITE,
    els: [
      redBar,
      heading("Keep the words short"),
      text(
        0.8, TOP, 11.4, 4.2, 26, INK,
        [
          { text: "Lead with the point, then give one reason", bullet: true },
          { text: "Use plain words and short lines", bullet: true },
          { text: "Keep to three or four points", bullet: true },
          { text: "Say the detail out loud instead of printing it", bullet: true },
        ],
        { valign: "top", gap: 16 },
      ),
    ],
  },
  {
    group: "Content", label: "Two columns", bg: WHITE,
    els: [
      redBar,
      heading("Two ideas side by side"),
      ...[
        { x: 0.8, h: "Before", t: "Describe where things started, in a sentence or two." },
        { x: 7.0, h: "After", t: "Describe what changed, and what difference it made." },
      ].flatMap((c): El[] => [
        rect(c.x, TOP, 5.5, 0.09, RED),
        text(c.x, TOP + 0.25, 5.5, 0.7, 28, RED, c.h, { bold: true }),
        text(c.x, TOP + 1.05, 5.5, 2.6, 20, INK, c.t, { valign: "top" }),
      ]),
    ],
  },
  timeline(false),
  timeline(true),
  stat(false),
  stat(true),
  quote(false),
  quote(true),
  // Closing
  {
    group: "Closing", label: "Thank you", bg: RED,
    els: [
      ghostX(),
      logo("logoMono", "tl"),
      text(0.8, 2.3, 7.6, 1.4, 66, WHITE, "Thank you", { bold: true }),
      rect(0.8, 3.85, 0.9, 0.09, WHITE),
      text(
        0.8, 4.1, 6, 1.5, 20, WHITE,
        [{ text: "Your name", bold: true }, { text: "Your email or phone" }, { text: "tedxnewy.com.au" }],
        { valign: "top" },
      ),
      rect(8.6, 2.2, 3.4, 3.4, WHITE),
      { k: "img", img: "qr", x: 8.75, y: 2.35, w: 3.1, h: 3.1 },
      text(8.6, 5.75, 3.4, 0.4, 13, WHITE, "Scan to visit tedxnewy.com.au", { bold: true, align: "center" }),
      text(0.8, 6.75, 9, 0.4, 11, WHITE, "This independent TEDx event is operated under licence from TED."),
    ],
  },
];

const GROUPS = ["Opening", "Content", "Timeline", "Statistic", "Quote", "Closing"];

/** Fetches a public image as a data URL so PowerPoint embeds it. */
async function dataUrl(path: string): Promise<string> {
  const r = await fetch(path);
  const b = await r.blob();
  return await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = rej;
    fr.readAsDataURL(b);
  });
}

const pct = (v: number, of: number) => `${(v / of) * 100}%`;
// Preview type size: points on a 13.333 inch wide slide, as a share of the slide's own width.
const cqw = (pt: number) => `${(pt / 72 / W) * 100}cqw`;

/** One slide drawn in HTML from the same spec the PowerPoint is built from. */
function Preview({ slide, qr }: { slide: SlideSpec; qr: string }) {
  return (
    <div className="adm-deck__slide" style={{ background: `#${slide.bg}`, padding: 0, display: "block", containerType: "inline-size" }}>
      {slide.els.map((e, i) => {
        const box = { position: "absolute" as const, left: pct(e.x, W), top: pct(e.y, H), width: pct(e.w, W) };
        if (e.k === "rect") return <div key={i} style={{ ...box, height: pct(e.h, H), background: `#${e.fill}` }} />;
        if (e.k === "line") return <div key={i} style={{ ...box, height: e.t ? pct(e.t / 72, H) : 1, background: `#${e.color}` }} />;
        if (e.k === "ellipse") return <div key={i} style={{ ...box, height: pct(e.h, H), borderRadius: "50%", background: `#${e.fill}` }} />;
        if (e.k === "img") {
          const src = e.img === "qr" ? qr : IMG_SRC[e.img];
          // eslint-disable-next-line @next/next/no-img-element
          return src ? <img key={i} src={src} alt="" style={{ ...box, height: pct(e.h, H), opacity: e.transparency ? 1 - e.transparency / 100 : 1 }} /> : null;
        }
        return (
          <div
            key={i}
            style={{
              ...box, height: pct(e.h, H), display: "flex", flexDirection: "column",
              justifyContent: e.valign === "top" ? "flex-start" : "center",
              textAlign: e.align ?? "left", color: `#${e.color}`, fontSize: cqw(e.size), lineHeight: 1.15,
              fontWeight: e.bold ? 700 : 400, gap: e.gap ? cqw(e.gap) : 0, overflow: "hidden",
            }}
          >
            {e.paras.map((p, j) => (
              <div key={j} style={{ fontWeight: p.bold ? 700 : undefined }}>
                {p.bullet ? "■  " : ""}{p.text}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** A ready-made deck for anyone presenting on behalf of TEDxNewy. Fourteen slides, all editable in PowerPoint. */
export default function DeckTemplate() {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [qr, setQr] = useState("");
  useEffect(() => {
    QRCode.toDataURL(SITE, { margin: 1, width: 600 }).then(setQr).catch(() => {});
  }, []);

  const build = async () => {
    setBusy(true);
    setNote("");
    try {
      const PptxGen = (await import("pptxgenjs")).default;
      const keys: ImgKey[] = ["logoWhite", "logoBlack", "logoMono", "xWhite"];
      const loaded = await Promise.all(keys.map((k) => dataUrl(IMG_SRC[k])));
      const data: Record<ImgKey, string> = {
        logoWhite: loaded[0], logoBlack: loaded[1], logoMono: loaded[2], xWhite: loaded[3],
        qr: await QRCode.toDataURL(SITE, { margin: 1, width: 600, color: { dark: "#000000", light: "#FFFFFF" } }),
      };
      const p = new PptxGen();
      p.defineLayout({ name: "W16x9", width: W, height: H });
      p.layout = "W16x9";
      p.author = "TEDxNewy";
      p.title = "TEDxNewy presentation";
      const FONT = "Arial";

      for (const spec of SLIDES) {
        const s = p.addSlide();
        s.background = { color: spec.bg };
        for (const e of spec.els) {
          if (e.k === "rect") s.addShape(p.ShapeType.rect, { x: e.x, y: e.y, w: e.w, h: e.h, fill: { color: e.fill }, line: { color: e.fill } });
          else if (e.k === "line") s.addShape(p.ShapeType.line, { x: e.x, y: e.y, w: e.w, h: 0, line: { color: e.color, width: e.t ?? 1 } });
          else if (e.k === "ellipse") s.addShape(p.ShapeType.ellipse, { x: e.x, y: e.y, w: e.w, h: e.h, fill: { color: e.fill }, line: { color: e.fill } });
          else if (e.k === "img") s.addImage({ data: data[e.img], x: e.x, y: e.y, w: e.w, h: e.h, transparency: e.transparency });
          else {
            const runs = e.paras.map((q, j) => ({
              text: q.text,
              options: {
                ...(q.bold ? { bold: true } : {}),
                ...(q.bullet ? { bullet: { code: "25A0" } } : {}),
                ...(j < e.paras.length - 1 ? { breakLine: true } : {}),
              },
            }));
            s.addText(runs, {
              x: e.x, y: e.y, w: e.w, h: e.h, fontFace: FONT, fontSize: e.size, color: e.color, bold: e.bold,
              align: e.align ?? "left", valign: e.valign ?? "middle", ...(e.gap ? { paraSpaceAfter: e.gap } : {}),
            });
          }
        }
      }

      await p.writeFile({ fileName: "tedxnewy-presentation.pptx" });
      setNote("Saved. Open it in PowerPoint or Keynote and every slide is editable.");
    } catch {
      setNote("Could not build the deck. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-stack adm-stack--tight">
      <section className="adm-panel adm-panel--tight">
        <h2 className="adm-section__title">Download the deck</h2>
        <p className="adm-card__text">Fourteen slides. Download it, then change the words, numbers and images in PowerPoint or Keynote.</p>
        <div className="adm-toolrow">
          <button type="button" className="tx-btn tx-btn--accent tx-btn--auto" disabled={busy} onClick={build}>
            <Icon name="download" size={16} /> {busy ? "Building" : "Download PowerPoint"}
          </button>
          {note && <span className="adm-card__text">{note}</span>}
        </div>
      </section>

      <section className="adm-section">
        <h2 className="adm-section__title">The fourteen slides</h2>
        {GROUPS.map((g) => (
          <div key={g} style={{ marginTop: 20 }}>
            <h3 className="adm-field__l" style={{ marginBottom: 8 }}>{g}</h3>
            <div className="adm-deck">
              {SLIDES.map((sl, i) => sl.group !== g ? null : (
                <figure key={i} style={{ margin: 0 }}>
                  <Preview slide={sl} qr={qr} />
                  <figcaption className="adm-card__text" style={{ marginTop: 4 }}>{i + 1}. {sl.label}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
