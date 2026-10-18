"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { Icon } from "@/components/ds";

const INK = "000000";
const RED = "E62B1E";
const WHITE = "FFFFFF";
const SITE = "https://tedxnewy.com.au";

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

/** A ready-made deck for anyone presenting on behalf of TEDxNewy. Nine slides, all editable in PowerPoint. */
export default function DeckTemplate() {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

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
      const qr = await QRCode.toDataURL(SITE, { margin: 1, width: 600, color: { dark: "#000000", light: "#FFFFFF" } });
      const p = new PptxGen();
      p.defineLayout({ name: "W16x9", width: 13.333, height: 7.5 });
      p.layout = "W16x9";
      p.author = "TEDxNewy";
      p.title = "TEDxNewy presentation";
      const FONT = "Arial";
      const W = 13.333;
      const H = 7.5;
      const logoW = 2.2;
      const logoH = logoW * (256 / 1412);

      type Slide = ReturnType<typeof p.addSlide>;
      // The logo sits on every slide: white on red or black, black on white.
      const logo = (sl: Slide, onDark: boolean, pos: "tl" | "br" = "br") =>
        sl.addImage({ data: onDark ? white : black, x: pos === "tl" ? 0.8 : W - 0.8 - logoW, y: pos === "tl" ? 0.65 : H - 0.55 - logoH, w: logoW, h: logoH });
      // The ghosted X from the bold red virtual background, cropped by the slide edge.
      const ghostX = (sl: Slide, size: number, x: number, y: number, transparency = 85) =>
        sl.addImage({ data: xWhite, x, y, w: size, h: size * (929 / 948), transparency });
      const redBar = (sl: Slide) => sl.addShape(p.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.22, fill: { color: RED }, line: { color: RED } });
      const heading = (sl: Slide, t: string) =>
        sl.addText(t, { x: 0.8, y: 0.8, w: 11, h: 0.9, fontFace: FONT, fontSize: 40, bold: true, color: INK });
      const rule = (sl: Slide, x: number, y: number, color: string) =>
        sl.addShape(p.ShapeType.rect, { x, y, w: 0.9, h: 0.09, fill: { color }, line: { color } });

      // 1. Title: bold red, a big X cropped by the right edge and a smaller one overlapping it
      let s = p.addSlide();
      s.background = { color: RED };
      ghostX(s, 9.6, W - 6.2, -0.9, 88);
      ghostX(s, 5.2, W - 4.1, H - 3.6, 80);
      logo(s, true, "tl");
      s.addText("Presentation title", { x: 0.8, y: 2.4, w: 8.2, h: 2.2, fontFace: FONT, fontSize: 54, bold: true, color: WHITE, valign: "top" });
      rule(s, 0.8, 4.75, WHITE);
      s.addText("A short line about what this talk covers", { x: 0.8, y: 5.0, w: 7.6, h: 0.9, fontFace: FONT, fontSize: 20, color: WHITE, valign: "top" });
      s.addText("Your name   |   Date", { x: 0.8, y: 6.5, w: 7.6, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: WHITE });

      // 2. Acknowledgement of Country
      s = p.addSlide();
      s.background = { color: INK };
      s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 0.5, h: H, fill: { color: RED }, line: { color: RED } });
      s.addText("Acknowledgement of Country", { x: 1.2, y: 1.0, w: 11, h: 0.9, fontFace: FONT, fontSize: 40, bold: true, color: WHITE });
      rule(s, 1.2, 2.1, RED);
      s.addText(
        [
          { text: "TEDxNewy acknowledges the Awabakal and Worimi people, the Traditional Custodians of the land on which we gather today.", options: { breakLine: true } },
          { text: " ", options: { breakLine: true, fontSize: 10 } },
          { text: "We pay our respects to Elders past and present, and extend that respect to all Aboriginal and Torres Strait Islander people joining us." },
        ],
        { x: 1.2, y: 2.5, w: 10.2, h: 3.2, fontFace: FONT, fontSize: 24, color: WHITE, valign: "top" },
      );
      logo(s, true);

      // 3. Agenda: a vertical list with divider lines
      s = p.addSlide();
      s.background = { color: WHITE };
      redBar(s);
      heading(s, "Agenda");
      ["Where we are today", "What we have learned", "What happens next", "Questions"].forEach((t, i) => {
        const y = 2.0 + i * 1.0;
        s.addText(String(i + 1).padStart(2, "0"), { x: 0.8, y, w: 1.1, h: 0.9, fontFace: FONT, fontSize: 30, bold: true, color: RED, valign: "middle" });
        s.addText(t, { x: 2.1, y, w: 9, h: 0.9, fontFace: FONT, fontSize: 26, color: INK, valign: "middle" });
        s.addShape(p.ShapeType.line, { x: 0.8, y: y + 0.95, w: 8.6, h: 0, line: { color: "D8D2C8", width: 1 } });
      });
      logo(s, false);

      // 4. Content with image area
      s = p.addSlide();
      s.background = { color: WHITE };
      redBar(s);
      heading(s, "One idea per slide");
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
      logo(s, false, "tl");

      // 5. Section divider
      s = p.addSlide();
      s.background = { color: INK };
      s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 0.5, h: H, fill: { color: RED }, line: { color: RED } });
      s.addText("01", { x: 1.2, y: 2.3, w: 4, h: 1, fontFace: FONT, fontSize: 44, bold: true, color: RED });
      s.addText("Section title", { x: 1.2, y: 3.3, w: 11, h: 1.6, fontFace: FONT, fontSize: 60, bold: true, color: WHITE, valign: "top" });
      logo(s, true);

      // 6. Two columns
      s = p.addSlide();
      s.background = { color: WHITE };
      redBar(s);
      heading(s, "Two ideas side by side");
      [
        { x: 0.8, h: "Before", t: "Describe where things started, in a sentence or two." },
        { x: 7.0, h: "After", t: "Describe what changed, and what difference it made." },
      ].forEach((c) => {
        s.addShape(p.ShapeType.rect, { x: c.x, y: 2.0, w: 5.5, h: 0.09, fill: { color: RED }, line: { color: RED } });
        s.addText(c.h, { x: c.x, y: 2.25, w: 5.5, h: 0.7, fontFace: FONT, fontSize: 28, bold: true, color: RED });
        s.addText(c.t, { x: c.x, y: 3.05, w: 5.5, h: 2.6, fontFace: FONT, fontSize: 20, color: INK, valign: "top" });
      });
      logo(s, false);

      // 7. Statistic
      s = p.addSlide();
      s.background = { color: RED };
      ghostX(s, 7.6, W - 4.6, H - 5.9);
      logo(s, true, "tl");
      s.addText("1,200", { x: 0.8, y: 1.5, w: 9, h: 2.6, fontFace: FONT, fontSize: 150, bold: true, color: WHITE, valign: "middle" });
      rule(s, 0.8, 4.3, WHITE);
      s.addText("What this number measures, in one short line", { x: 0.8, y: 4.55, w: 8, h: 1.0, fontFace: FONT, fontSize: 26, bold: true, color: WHITE, valign: "top" });
      s.addText("Where it comes from, and the period it covers", { x: 0.8, y: 5.55, w: 8, h: 0.5, fontFace: FONT, fontSize: 16, color: WHITE });

      // 8. Quote
      s = p.addSlide();
      s.background = { color: INK };
      s.addText("“", { x: 0.8, y: 0.9, w: 2, h: 2, fontFace: FONT, fontSize: 160, bold: true, color: RED, valign: "top" });
      s.addText("A short quote goes here, in a few strong lines.", { x: 1.0, y: 2.3, w: 11, h: 2.4, fontFace: FONT, fontSize: 42, bold: true, color: WHITE, valign: "top" });
      rule(s, 1.0, 5.0, RED);
      s.addText("Name, role or organisation", { x: 1.0, y: 5.25, w: 9, h: 0.6, fontFace: FONT, fontSize: 18, color: WHITE });
      logo(s, true);

      // 9. Thank you, with a QR code to the website
      s = p.addSlide();
      s.background = { color: RED };
      ghostX(s, 9.6, W - 6.2, -0.9, 88);
      ghostX(s, 5.2, W - 4.1, H - 3.6, 80);
      logo(s, true, "tl");
      s.addText("Thank you", { x: 0.8, y: 2.3, w: 7.6, h: 1.4, fontFace: FONT, fontSize: 66, bold: true, color: WHITE });
      rule(s, 0.8, 3.85, WHITE);
      s.addText(
        [
          { text: "Your name", options: { bold: true, breakLine: true } },
          { text: "Your email or phone", options: { breakLine: true } },
          { text: "tedxnewy.com.au" },
        ],
        { x: 0.8, y: 4.1, w: 6, h: 1.5, fontFace: FONT, fontSize: 20, color: WHITE, valign: "top" },
      );
      s.addShape(p.ShapeType.rect, { x: 8.6, y: 2.2, w: 3.4, h: 3.4, fill: { color: WHITE }, line: { color: WHITE } });
      s.addImage({ data: qr, x: 8.75, y: 2.35, w: 3.1, h: 3.1 });
      s.addText("Scan to visit tedxnewy.com.au", { x: 8.6, y: 5.75, w: 3.4, h: 0.4, fontFace: FONT, fontSize: 13, bold: true, color: WHITE, align: "center" });
      s.addText("This independent TEDx event is operated under licence from TED.", { x: 0.8, y: 6.75, w: 9, h: 0.4, fontFace: FONT, fontSize: 11, color: WHITE });

      await p.writeFile({ fileName: "tedxnewy-presentation.pptx" });
      setNote("Saved. Open it in PowerPoint or Keynote and every slide is editable.");
    } catch {
      setNote("Could not build the deck. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const slides: { bg: string; fg: string; title: string; sub?: string; rule?: boolean }[] = [
    { bg: "#e62b1e", fg: "#fff", title: "Presentation title", sub: "Big X on the right", rule: true },
    { bg: "#000", fg: "#fff", title: "Acknowledgement of Country" },
    { bg: "#fff", fg: "#000", title: "Agenda", sub: "01 to 04, with dividers" },
    { bg: "#fff", fg: "#000", title: "One idea per slide", sub: "Short lines and a red image block" },
    { bg: "#000", fg: "#fff", title: "Section title", sub: "01" },
    { bg: "#fff", fg: "#000", title: "Two ideas side by side", sub: "Before | After" },
    { bg: "#e62b1e", fg: "#fff", title: "1,200", sub: "A statistic" },
    { bg: "#000", fg: "#fff", title: "A quote", sub: "Who said it" },
    { bg: "#e62b1e", fg: "#fff", title: "Thank you", sub: "With a QR code", rule: true },
  ];

  return (
    <div className="adm-stack adm-stack--tight">
      <section className="adm-panel adm-panel--tight">
        <h2 className="adm-section__title">Download the deck</h2>
        <p className="adm-card__text">Nine slides with the logo throughout. Download it, then change the words, numbers and images in PowerPoint or Keynote.</p>
        <div className="adm-toolrow">
          <button type="button" className="tx-btn tx-btn--accent tx-btn--auto" disabled={busy} onClick={build}>
            <Icon name="download" size={16} /> {busy ? "Building" : "Download PowerPoint"}
          </button>
          {note && <span className="adm-card__text">{note}</span>}
        </div>
      </section>

      <section className="adm-section">
        <h2 className="adm-section__title">The nine slides</h2>
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
