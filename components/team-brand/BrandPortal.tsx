"use client";

import { useState, useCallback } from "react";
import {
  COLOUR_GROUPS, STATEMENT_GROUPS, EVENT_FORMATS, COLOURWAYS, lockupPath,
  TAGLINE_ORIENTATIONS, TAGLINE_SVG, taglinePath, FONTS,
} from "@/lib/brand-portal-data";
import { Segmented, Icon } from "@/components/ds";

function useToast() {
  const [toast, setToast] = useState("");
  const flash = useCallback((m: string) => { setToast(m); window.setTimeout(() => setToast(""), 1800); }, []);
  return { toast, flash };
}

/** Logos and branding: files to download, colours, fonts and the lines we copy again and again. */
export default function BrandPortal() {
  const [event, setEvent] = useState<(typeof EVENT_FORMATS)[number]>("Standard");
  const [colourway, setColourway] = useState<string>("black");
  const [orientation, setOrientation] = useState<(typeof TAGLINE_ORIENTATIONS)[number]>("Horizontal");
  const { toast, flash } = useToast();

  const copy = useCallback((text: string, what: string) => {
    navigator.clipboard.writeText(text).then(() => flash(`Copied ${what}`), () => flash("Copy failed"));
  }, [flash]);

  const downloadAllLogos = useCallback(async () => {
    flash("Zipping logos…");
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const jobs: Promise<void>[] = [];
    for (const ev of EVENT_FORMATS) {
      for (const cw of COLOURWAYS) {
        for (const ext of ["png", "svg"] as const) {
          const path = lockupPath(ev, cw.key, ext);
          jobs.push(
            fetch(path).then((r) => (r.ok ? r.blob() : null)).then((b) => { if (b) zip.file(path.split("/").pop()!, b); })
          );
        }
      }
    }
    for (const o of TAGLINE_ORIENTATIONS) {
      for (const cw of COLOURWAYS) {
        for (const ext of TAGLINE_SVG.includes(o) ? (["png", "svg"] as const) : (["png"] as const)) {
          const path = taglinePath(o, cw.key, ext);
          jobs.push(
            fetch(path).then((r) => (r.ok ? r.blob() : null)).then((b) => { if (b) zip.file(path.split("/").pop()!, b); })
          );
        }
      }
    }
    await Promise.all(jobs);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "TEDxNewy-logos.zip"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, [flash]);

  return (
    <div className="adm-stack">
      {(
        <div className="adm-stack adm-stack--tight">
          {/* logos: one preview at a time, every colourway one click away */}
          <section className="adm-section">
            <div className="adm-card__top">
              <div>
                <h2 className="adm-section__title">Logos</h2>
                <p className="adm-card__text">PNG for everyday, SVG for print and large format. White or black backgrounds only.</p>
              </div>
              <button onClick={downloadAllLogos} className="tx-btn tx-btn--primary tx-btn--sm tx-btn--auto">
                Download all (zip)
              </button>
            </div>
            <div className="adm-pickers">
              <Segmented
                options={EVENT_FORMATS.map((e) => ({ value: e, label: e }))}
                value={event}
                onChange={(v) => setEvent(v as (typeof EVENT_FORMATS)[number])}
              />
              <Segmented options={COLOURWAYS.map((c) => ({ value: c.key, label: c.label }))} value={colourway} onChange={setColourway} />
            </div>
            <div className="adm-logopair">
              <LogoSwatch
                colourway={COLOURWAYS.find((c) => c.key === colourway) ?? COLOURWAYS[0]}
                alt={`TEDxNewy ${event}`}
                png={lockupPath(event, colourway, "png")}
                svg={lockupPath(event, colourway, "svg")}
                imgClass="h-12"
              />
              <ul className="adm-dl">
                {COLOURWAYS.map((cw) => (
                  <li key={cw.key}>
                    <span>{cw.label}</span>
                    <span className="adm-logo__links">
                      <a href={lockupPath(event, cw.key, "png")} download>PNG</a>
                      <a href={lockupPath(event, cw.key, "svg")} download>SVG</a>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* tagline */}
          <section className="adm-section">
            <div>
              <h2 className="adm-section__title">Tagline</h2>
              <p className="adm-card__text">&ldquo;Ideas change everything.&rdquo; In the same three colourways as the logos.</p>
            </div>
            <div className="adm-pickers">
              <Segmented
                options={TAGLINE_ORIENTATIONS.map((o) => ({ value: o, label: o }))}
                value={orientation}
                onChange={(v) => setOrientation(v as (typeof TAGLINE_ORIENTATIONS)[number])}
              />
            </div>
            <div className="adm-logopair">
              <LogoSwatch
                colourway={COLOURWAYS.find((c) => c.key === colourway) ?? COLOURWAYS[0]}
                alt={`Tagline ${orientation}`}
                png={taglinePath(orientation, colourway, "png")}
                svg={TAGLINE_SVG.includes(orientation) ? taglinePath(orientation, colourway, "svg") : undefined}
                imgClass={orientation === "Vertical" ? "h-24" : "h-8"}
              />
              <ul className="adm-dl">
                {COLOURWAYS.map((cw) => (
                  <li key={cw.key}>
                    <span>{cw.label}</span>
                    <span className="adm-logo__links">
                      <a href={taglinePath(orientation, cw.key, "png")} download>PNG</a>
                      {TAGLINE_SVG.includes(orientation) && <a href={taglinePath(orientation, cw.key, "svg")} download>SVG</a>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* fonts */}
          <section className="adm-section">
            <div>
              <h2 className="adm-section__title">Fonts</h2>
              <p className="adm-card__text">TEDx logos are only ever set in Inter. Use it for everything, with Bricolage Grotesque for the website.</p>
            </div>
            <div className="adm-grid adm-grid--cards">
              {FONTS.map((f) => (
                <div key={f.name} className="adm-card">
                  <span className="adm-minor">{f.role}</span>
                  <div className="adm-fontdemo" style={{ fontFamily: f.family }}>
                    <div style={{ fontWeight: f.weight, fontSize: 26, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                      Ideas change everything<span style={{ color: "var(--red)" }}>.</span>
                    </div>
                    <div style={{ marginTop: 12, fontSize: 15 }}>Aa Bb Cc Dd Ee 0123456789</div>
                  </div>
                  <span className="adm-card__title">{f.name}</span>
                  <p className="adm-card__text">{f.body}</p>
                  {f.link && (
                    <a href={f.link.href} target="_blank" rel="noopener noreferrer" className="adm-link">
                      {f.link.label} <Icon name="arrow-up-right" size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* colours */}
          <section className="adm-section">
            <div>
              <h2 className="adm-section__title">Colours</h2>
              <p className="adm-card__text">Click a swatch to copy its hex.</p>
            </div>
            {COLOUR_GROUPS.map((g) => (
              <div key={g.title} className="adm-section">
                <h3 className="adm-minor">{g.title}</h3>
                <div className="adm-grid adm-grid--swatches">
                  {g.swatches.map((s) => (
                    <button key={s.name} onClick={() => copy(s.hex, s.hex)} className="adm-swatch">
                      <span className="adm-swatch__chip" style={{ background: s.hex, borderBottom: s.light ? "1px solid var(--line)" : "none" }} />
                      <span className="adm-swatch__body">
                        <span className="adm-card__title" style={{ fontSize: 14 }}>{s.name}</span>
                        <span className="adm-swatch__hex">{s.hex}</span>
                        {s.note && <span className="adm-card__text" style={{ fontSize: 12 }}>{s.note}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* statements */}
          <section className="adm-section">
            <div>
              <h2 className="adm-section__title">Brand statements</h2>
              <p className="adm-card__text">Click any line to copy it.</p>
            </div>
            <div className="adm-stack adm-stack--tight">
              {STATEMENT_GROUPS.map((g) => (
                <div key={g.title} className="adm-section">
                  <h3 className="adm-minor">{g.title}</h3>
                  <div className="adm-grid adm-grid--cards">
                  {g.items.map((it) => (
                    <button key={it.label} onClick={() => copy(it.text, it.label)} className="adm-card adm-card--button">
                      <span className="adm-minor">{it.label}</span>
                      <span className="adm-card__text" style={{ color: "var(--ink)" }}>{it.text}</span>
                    </button>
                  ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {toast && <div className="adm-toast">{toast}</div>}
    </div>
  );
}

const SWATCH_BG: Record<string, string> = { black: "#f4efe6", white: "#000000", mono: "#e62b1e" };

// One logo on the background its colourway is made for, with its downloads.
function LogoSwatch({ colourway, alt, png, svg, imgClass }: {
  colourway: { key: string; label: string };
  alt: string;
  png: string;
  svg?: string;
  imgClass: string;
}) {
  return (
    <div className="adm-logo" style={{ background: SWATCH_BG[colourway.key] }}>
      <div className="adm-logo__stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={png} alt={alt} className={`max-w-full object-contain ${imgClass}`} />
      </div>
      <div className="adm-logo__bar">
        <span>{colourway.label}</span>
        <span className="adm-logo__links">
          <a href={png} download>PNG</a>
          {svg && <a href={svg} download>SVG</a>}
        </span>
      </div>
    </div>
  );
}
