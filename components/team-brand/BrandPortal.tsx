"use client";

import { useState, useCallback } from "react";
import {
  COLOUR_GROUPS, STATEMENT_GROUPS, EVENT_FORMATS, COLOURWAYS, lockupPath,
  TAGLINE_ORIENTATIONS, TAGLINE_SVG, taglinePath, FONTS,
} from "@/lib/brand-portal-data";
import { Segmented, Icon } from "@/components/ds";

const X_COLOURS = [
  { key: "red", label: "Red" },
  { key: "white", label: "White" },
  { key: "black", label: "Black" },
];

function useToast() {
  const [toast, setToast] = useState("");
  const flash = useCallback((m: string) => { setToast(m); window.setTimeout(() => setToast(""), 1800); }, []);
  return { toast, flash };
}

/** Logos and branding: files to download, colours, fonts and the lines we copy again and again. */
export default function BrandPortal() {
  const [event, setEvent] = useState<(typeof EVENT_FORMATS)[number]>("Standard");
  const [colourway, setColourway] = useState<string>("black");
  const [xColour, setXColour] = useState("red");
  const [tagColour, setTagColour] = useState<string>("black");
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
    for (const c of X_COLOURS) {
      for (const ext of ["png", "svg"] as const) {
        const path = `/brand/lockups/TEDxNewy-X-${c.key}.${ext}`;
        jobs.push(fetch(path).then((r) => (r.ok ? r.blob() : null)).then((b) => { if (b) zip.file(path.split("/").pop()!, b); }));
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
          <div className="adm-brandtop">
            <p className="adm-card__text">Every logo, tagline and X in PNG and SVG, in one zip.</p>
            <button onClick={downloadAllLogos} className="tx-btn tx-btn--primary tx-btn--sm tx-btn--auto">
              Download all (zip)
            </button>
          </div>
          <div className="adm-brandcols">
            <LogoCard
              title="Logos"
              blurb="PNG for everyday, SVG for print and large format. White or black backgrounds only."
              colours={COLOURWAYS.map((c) => ({ key: c.key, label: c.label }))}
              colour={colourway}
              onColour={setColourway}
              variants={EVENT_FORMATS.map((e) => ({ key: e, label: e }))}
              variant={event}
              onVariant={(v) => setEvent(v as (typeof EVENT_FORMATS)[number])}
              png={lockupPath(event, colourway, "png")}
              svg={lockupPath(event, colourway, "svg")}
              alt={`TEDxNewy ${event}`}
              imgClass="adm-logo__img adm-logo__img--wide"
            />
            <LogoCard
              title="Tagline"
              blurb={"\u201CIdeas change everything.\u201D In the same three colourways as the logos."}
              colours={COLOURWAYS.map((c) => ({ key: c.key, label: c.label }))}
              colour={tagColour}
              onColour={setTagColour}
              variants={TAGLINE_ORIENTATIONS.map((o) => ({ key: o, label: o }))}
              variant={orientation}
              onVariant={(v) => setOrientation(v as (typeof TAGLINE_ORIENTATIONS)[number])}
              png={taglinePath(orientation, tagColour, "png")}
              svg={TAGLINE_SVG.includes(orientation) ? taglinePath(orientation, tagColour, "svg") : undefined}
              alt={`Tagline ${orientation}`}
              imgClass={orientation === "Vertical" ? "adm-logo__img adm-logo__img--tall" : "adm-logo__img adm-logo__img--tag"}
            />
            <LogoCard
              title="The X"
              blurb="Just the X from the logo, as a vector. For avatars, favicons and small spaces."
              colours={X_COLOURS}
              colour={xColour}
              onColour={setXColour}
              png={`/brand/lockups/TEDxNewy-X-${xColour}.png`}
              svg={`/brand/lockups/TEDxNewy-X-${xColour}.svg`}
              alt="TEDx X mark"
              imgClass="adm-logo__img adm-logo__img--x"
              xMode
            />
          </div>

          {/* fonts */}
          <section className="adm-section">
            <div>
              <h2 className="adm-section__title">Fonts</h2>
              <p className="adm-card__text">TEDx logos are only ever set in Inter. Use it for everything, with Bricolage Grotesque for the website.</p>
            </div>
            <div className="adm-grid adm-fontgrid">
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
            <div className="adm-colcols">
              {COLOUR_GROUPS.map((g) => (
                <div key={g.title} className="adm-panel adm-panel--tight">
                  <h3 className="adm-minor">{g.title}</h3>
                  <div className="adm-swlist">
                    {g.swatches.map((s) => (
                      <button key={s.name} onClick={() => copy(s.hex, s.hex)} className="adm-swrow">
                        <span className="adm-swrow__chip" style={{ background: s.hex, boxShadow: s.light ? "inset 0 0 0 1px var(--line)" : "none" }} />
                        <span className="adm-swrow__body">
                          <span className="adm-card__title" style={{ fontSize: 14 }}>{s.name}</span>
                          <span className="adm-swatch__hex">{s.hex}{s.note ? ` · ${s.note}` : ""}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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

const SWATCH_BG: Record<string, string> = { black: "#f4efe6", white: "#000000", mono: "#e62b1e", red: "#f4efe6" };

type Opt = { key: string; label: string };

// One logo family: a colour toggle, an optional variant toggle, a preview stage of fixed height (so the three
// cards line up) and the download links for exactly what is on screen.
function LogoCard({ title, blurb, colours, colour, onColour, variants, variant, onVariant, png, svg, alt, imgClass, xMode }: {
  title: string; blurb: string;
  colours: Opt[]; colour: string; onColour: (v: string) => void;
  variants?: Opt[]; variant?: string; onVariant?: (v: string) => void;
  png: string; svg?: string; alt: string; imgClass: string; xMode?: boolean;
}) {
  const bg = xMode ? (colour === "white" ? "#000000" : "#f4efe6") : SWATCH_BG[colour];
  return (
    <section className="adm-panel adm-panel--tight adm-brandcard">
      <div className="adm-brandcard__head">
        <h2 className="adm-section__title">{title}</h2>
        <p className="adm-card__text">{blurb}</p>
      </div>
      <div className="adm-brandcard__pickers">
        <Segmented options={colours.map((c) => ({ value: c.key, label: c.label }))} value={colour} onChange={onColour} />
        {variants && variant && onVariant ? (
          <Segmented options={variants.map((c) => ({ value: c.key, label: c.label }))} value={variant} onChange={onVariant} />
        ) : null}
      </div>
      <div className="adm-logo adm-logo--stage" style={{ background: bg }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={png} alt={alt} className={imgClass} />
      </div>
      <div className="adm-brandcard__dl">
        <span className="adm-card__text">Download this one</span>
        <span className="adm-logo__links">
          <a href={png} download>PNG</a>
          {svg && <a href={svg} download>SVG</a>}
        </span>
      </div>
    </section>
  );
}
