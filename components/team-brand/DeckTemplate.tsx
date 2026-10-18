"use client";

import { useState } from "react";
import { Icon } from "@/components/ds";

const INK = "000000";
const RED = "E62B1E";
const WHITE = "FFFFFF";

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

type Fields = { title: string; subtitle: string; presenter: string; date: string };

/** A short, ready-made deck for anyone presenting on behalf of TEDxNewy. Seven slides, all editable in PowerPoint. */
export default function DeckTemplate() {
  const [f, setF] = useState<Fields>({
    title: "Presentation title",
    subtitle: "A short line about what this talk covers",
    presenter: "Your name",
    date: "Date",
  });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const set = (k: keyof Fields, v: string) => setF((s) => ({ ...s, [k]: v }));

  const build = async () => {
    setBusy(true);
    setNote("");
    try {
      const PptxGen = (await import("pptxgenjs")).default;
      const [white, black, xWhite] = await Promise.all([
        dataUrl("/brand/media/TEDxNewy-Standard-white.png"),
        dataUrl("/brand/media/TEDxNewy-Standard-black.png"),
        dataUrl("/brand/lockups/TEDxNewy-X-white.png"),
      ]);
      const p = new PptxGen();
      p.defineLayout({ name: "W16x9", width: 13.333, height: 7.5 });
      p.layout = "W16x9";
      p.author = "TEDxNewy";
      p.title = f.title;
      const FONT = "Arial";
      const logoW = 2.4;
      const logoH = logoW * (256 / 1412);

      // Bold red, to match the virtual background and the business card: solid TEDx red with a big ghosted X,
      // white type, and black or white pages in between.
      const ghostX = (sl: ReturnType<typeof p.addSlide>, size = 7.6) =>
        sl.addImage({ data: xWhite, x: 13.333 - size * 0.72, y: 7.5 - size * 0.78, w: size, h: size * (929 / 948), transparency: 87 });
      const redBar = (sl: ReturnType<typeof p.addSlide>) =>
        sl.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.22, fill: { color: RED }, line: { color: RED } });

      // 1. Title
      let s = p.addSlide();
      s.background = { color: RED };
      ghostX(s);
      s.addImage({ data: white, x: 0.8, y: 0.7, w: logoW, h: logoH });
      s.addText(f.title, { x: 0.8, y: 2.4, w: 9.6, h: 2.2, fontFace: FONT, fontSize: 54, bold: true, color: WHITE, valign: "top" });
      s.addShape(p.ShapeType.rect, { x: 0.8, y: 4.75, w: 0.9, h: 0.09, fill: { color: WHITE }, line: { color: WHITE } });
      s.addText(f.subtitle, { x: 0.8, y: 5.0, w: 8.6, h: 0.9, fontFace: FONT, fontSize: 20, color: WHITE, valign: "top" });
      s.addText(`${f.presenter}   |   ${f.date}`, { x: 0.8, y: 6.5, w: 8.6, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: WHITE });

      // 2. Agenda
      s = p.addSlide();
      s.background = { color: WHITE };
      redBar(s);
      s.addText("Agenda", { x: 0.8, y: 0.8, w: 11, h: 0.9, fontFace: FONT, fontSize: 40, bold: true, color: INK });
      ["Where we are today", "What we have learned", "What happens next", "Questions"].forEach((t, i) => {
        s.addText(String(i + 1), { x: 0.8, y: 2.0 + i * 1.0, w: 0.7, h: 0.7, fontFace: FONT, fontSize: 30, bold: true, color: RED, valign: "middle" });
        s.addText(t, { x: 1.6, y: 2.0 + i * 1.0, w: 10, h: 0.7, fontFace: FONT, fontSize: 24, color: INK, valign: "middle" });
      });
      s.addImage({ data: black, x: 10.1, y: 6.7, w: 2.4, h: logoH });

      // 3. Content with image area
      s = p.addSlide();
      s.background = { color: WHITE };
      redBar(s);
      s.addText("One idea per slide", { x: 0.8, y: 0.8, w: 11, h: 0.9, fontFace: FONT, fontSize: 40, bold: true, color: INK });
      s.addText(
        [
          { text: "Keep each slide to a single point", options: { bullet: { code: "25A0" }, breakLine: true } },
          { text: "Use images and short lines, not paragraphs", options: { bullet: { code: "25A0" }, breakLine: true } },
          { text: "Say the detail out loud instead of printing it", options: { bullet: { code: "25A0" } } },
        ],
        { x: 0.8, y: 2.0, w: 5.8, h: 3.6, fontFace: FONT, fontSize: 22, color: INK, valign: "top", paraSpaceAfter: 14 },
      );
      s.addShape(p.ShapeType.rect, { x: 7.1, y: 2.0, w: 5.4, h: 4.2, fill: { color: RED }, line: { color: RED } });
      s.addText("Add an image here", { x: 7.1, y: 2.0, w: 5.4, h: 4.2, fontFace: FONT, fontSize: 16, bold: true, color: WHITE, align: "center", valign: "middle" });
      s.addImage({ data: black, x: 0.8, y: 6.7, w: 2.4, h: logoH });

      // 4. Section divider
      s = p.addSlide();
      s.background = { color: INK };
      s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 0.5, h: 7.5, fill: { color: RED }, line: { color: RED } });
      s.addText("01", { x: 1.2, y: 2.3, w: 4, h: 1, fontFace: FONT, fontSize: 44, bold: true, color: RED });
      s.addText("Section title", { x: 1.2, y: 3.3, w: 11, h: 1.6, fontFace: FONT, fontSize: 60, bold: true, color: WHITE, valign: "top" });
      s.addImage({ data: white, x: 1.2, y: 6.5, w: 2.0, h: 2.0 * (256 / 1412) });

      // 5. Two columns
      s = p.addSlide();
      s.background = { color: WHITE };
      redBar(s);
      s.addText("Two ideas side by side", { x: 0.8, y: 0.8, w: 11, h: 0.9, fontFace: FONT, fontSize: 40, bold: true, color: INK });
      [
        { x: 0.8, h: "Before", t: "Describe where things started, in a sentence or two." },
        { x: 7.0, h: "After", t: "Describe what changed, and what difference it made." },
      ].forEach((c) => {
        s.addShape(p.ShapeType.rect, { x: c.x, y: 2.0, w: 5.5, h: 0.09, fill: { color: RED }, line: { color: RED } });
        s.addText(c.h, { x: c.x, y: 2.25, w: 5.5, h: 0.7, fontFace: FONT, fontSize: 28, bold: true, color: RED });
        s.addText(c.t, { x: c.x, y: 3.05, w: 5.5, h: 2.6, fontFace: FONT, fontSize: 20, color: INK, valign: "top" });
      });
      s.addImage({ data: black, x: 10.1, y: 6.7, w: 2.4, h: logoH });

      // 6. Quote
      s = p.addSlide();
      s.background = { color: RED };
      ghostX(s, 6.4);
      s.addText("“A quote or a big number goes here.”", { x: 1.0, y: 1.9, w: 10.3, h: 2.8, fontFace: FONT, fontSize: 44, bold: true, color: WHITE, valign: "top" });
      s.addShape(p.ShapeType.rect, { x: 1.0, y: 5.0, w: 0.9, h: 0.09, fill: { color: WHITE }, line: { color: WHITE } });
      s.addText("Who said it, or what it measures", { x: 1.0, y: 5.25, w: 9, h: 0.6, fontFace: FONT, fontSize: 18, color: WHITE });

      // 7. Thank you
      s = p.addSlide();
      s.background = { color: RED };
      ghostX(s);
      s.addImage({ data: white, x: 0.8, y: 0.7, w: logoW, h: logoH });
      s.addText("Thank you", { x: 0.8, y: 2.6, w: 9, h: 1.4, fontFace: FONT, fontSize: 66, bold: true, color: WHITE });
      s.addText([
        { text: f.presenter, options: { breakLine: true } },
        { text: "tedxnewy.com.au" },
      ], { x: 0.8, y: 4.4, w: 8, h: 1.2, fontFace: FONT, fontSize: 20, color: WHITE, valign: "top" });
      s.addText("This independent TEDx event is operated under licence from TED.", { x: 0.8, y: 6.7, w: 9, h: 0.4, fontFace: FONT, fontSize: 11, color: WHITE });

      const safe = (f.title || "tedxnewy-deck").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tedxnewy-deck";
      await p.writeFile({ fileName: `${safe}.pptx` });
      setNote("Saved. Open it in PowerPoint or Keynote and every slide is editable.");
    } catch {
      setNote("Could not build the deck. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const slides: { bg: string; fg: string; title: string; sub?: string; rule?: boolean }[] = [
    { bg: "#e62b1e", fg: "#fff", title: f.title, sub: f.subtitle, rule: true },
    { bg: "#fff", fg: "#000", title: "Agenda", sub: "1  2  3  4" },
    { bg: "#fff", fg: "#000", title: "One idea per slide", sub: "Short lines and a red image block" },
    { bg: "#000", fg: "#fff", title: "Section title", sub: "01" },
    { bg: "#fff", fg: "#000", title: "Two ideas side by side", sub: "Before | After" },
    { bg: "#e62b1e", fg: "#fff", title: "A quote or a big number", rule: true },
    { bg: "#e62b1e", fg: "#fff", title: "Thank you", sub: f.presenter },
  ];

  return (
    <div className="adm-stack adm-stack--tight">
      <section className="adm-panel adm-panel--tight">
        <h2 className="adm-section__title">Your details</h2>
        <div className="adm-fields">
          <label className="block">
            <span className="adm-field__l">Title</span>
            <input className="tx-input" value={f.title} onChange={(e) => set("title", e.target.value)} />
          </label>
          <label className="block">
            <span className="adm-field__l">Subtitle</span>
            <input className="tx-input" value={f.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </label>
          <label className="block">
            <span className="adm-field__l">Presenter</span>
            <input className="tx-input" value={f.presenter} onChange={(e) => set("presenter", e.target.value)} />
          </label>
          <label className="block">
            <span className="adm-field__l">Date</span>
            <input className="tx-input" value={f.date} onChange={(e) => set("date", e.target.value)} />
          </label>
        </div>
        <div className="adm-toolrow">
          <button type="button" className="tx-btn tx-btn--accent tx-btn--auto" disabled={busy} onClick={build}>
            <Icon name="download" size={16} /> {busy ? "Building" : "Download PowerPoint"}
          </button>
          {note && <span className="adm-card__text">{note}</span>}
        </div>
      </section>

      <section className="adm-section">
        <h2 className="adm-section__title">The seven slides</h2>
        <div className="adm-deck">
          {slides.map((sl, i) => (
            <div key={i} className="adm-deck__slide" style={{ background: sl.bg, color: sl.fg }}>
              {sl.rule && <i style={{ background: sl.bg === "#e62b1e" ? "#fff" : "#e62b1e" }} />}
              <b>{sl.title}</b>
              {sl.sub && <span>{sl.sub}</span>}
              <em>{i + 1}</em>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
