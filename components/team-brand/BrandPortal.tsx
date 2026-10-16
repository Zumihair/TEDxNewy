"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  COLOUR_GROUPS, STATEMENT_GROUPS, EVENT_FORMATS, COLOURWAYS, lockupPath,
  TAGLINE_ORIENTATIONS, TAGLINE_SVG, taglinePath, FONTS,
} from "@/lib/brand-portal-data";
import { Segmented, Icon, type IconName } from "@/components/ds";
import { TEMPLATES, TEMPLATE_GROUPS } from "./templates-data";
import Studio from "./Studio";
import CreativeStudio from "./CreativeStudio";

type Tab = "files" | "templates" | "studio";
const TABS = [
  { value: "files", label: "Brand files" },
  { value: "templates", label: "Templates" },
  { value: "studio", label: "Studio" },
];

type StudioTab = "creative" | "assets";
const STUDIO_TABS = [
  { value: "creative", label: "Social posts" },
  { value: "assets", label: "Backgrounds, banners, signature" },
];

function useToast() {
  const [toast, setToast] = useState("");
  const flash = useCallback((m: string) => { setToast(m); window.setTimeout(() => setToast(""), 1800); }, []);
  return { toast, flash };
}

/** The brand hub: files to download, templates to fill in and print, and the studio. */
export default function BrandPortal() {
  const [tab, setTab] = useState<Tab>("files");
  const [studioTab, setStudioTab] = useState<StudioTab>("creative");
  const [event, setEvent] = useState<(typeof EVENT_FORMATS)[number]>("Standard");
  const { toast, flash } = useToast();

  // Each view has a shareable link: ?view=templates, ?view=studio, ?view=assets.
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("view");
    if (v === "templates") setTab("templates");
    else if (v === "studio" || v === "creative") setTab("studio");
    else if (v === "assets") { setTab("studio"); setStudioTab("assets"); }
  }, []);

  const selectTab = useCallback((t: string) => {
    setTab(t as Tab);
    const url = new URL(window.location.href);
    if (t === "files") url.searchParams.delete("view");
    else url.searchParams.set("view", t);
    window.history.replaceState(null, "", url);
  }, []);

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
      <Segmented options={TABS} value={tab} onChange={selectTab} />

      {tab === "files" && (
        <div className="adm-stack">
          {/* logos */}
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
            <Segmented
              options={EVENT_FORMATS.map((e) => ({ value: e, label: e }))}
              value={event}
              onChange={(v) => setEvent(v as (typeof EVENT_FORMATS)[number])}
            />
            <div className="adm-grid adm-grid--logos">
              {COLOURWAYS.map((cw) => (
                <LogoSwatch key={cw.key} colourway={cw} alt={`TEDxNewy ${event} ${cw.label}`}
                  png={lockupPath(event, cw.key, "png")} svg={lockupPath(event, cw.key, "svg")} imgClass="h-12" />
              ))}
            </div>
          </section>

          {/* tagline */}
          <section className="adm-section">
            <div>
              <h2 className="adm-section__title">Tagline</h2>
              <p className="adm-card__text">&ldquo;Ideas change everything.&rdquo; In the same three colourways as the logos.</p>
            </div>
            {TAGLINE_ORIENTATIONS.map((o) => (
              <div key={o} className="adm-section">
                <h3 className="adm-minor">{o}</h3>
                <div className="adm-grid adm-grid--logos">
                  {COLOURWAYS.map((cw) => (
                    <LogoSwatch key={cw.key} colourway={cw} alt={`Tagline ${o} ${cw.label}`}
                      png={taglinePath(o, cw.key, "png")}
                      svg={TAGLINE_SVG.includes(o) ? taglinePath(o, cw.key, "svg") : undefined}
                      imgClass={o === "Vertical" ? "h-28" : "h-8"} />
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* fonts */}
          <section className="adm-section">
            <div>
              <h2 className="adm-section__title">Fonts</h2>
              <p className="adm-card__text">TEDx logos are only ever set in Inter or Helvetica. When in doubt, use Inter.</p>
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
            <div className="adm-grid adm-grid--cards">
              {STATEMENT_GROUPS.map((g) => (
                <div key={g.title} className="adm-section" style={{ alignContent: "start" }}>
                  <h3 className="adm-minor">{g.title}</h3>
                  {g.items.map((it) => (
                    <button key={it.label} onClick={() => copy(it.text, it.label)} className="adm-card adm-card--button">
                      <span className="adm-minor">{it.label}</span>
                      <span className="adm-card__text" style={{ color: "var(--ink)" }}>{it.text}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "templates" && (
        <div className="adm-stack">
          {TEMPLATE_GROUPS.map((g) => (
            <section key={g.key} className="adm-section">
              <div>
                <h2 className="adm-section__title">{g.title}</h2>
                <p className="adm-card__text">{g.blurb}</p>
              </div>
              <div className="adm-grid adm-grid--cards">
                {TEMPLATES.filter((t) => t.group === g.key).map((t) => (
                  <Link key={t.slug} href={`/admin/brand/templates/${t.slug}`} className="adm-card">
                    <div className="adm-card__top">
                      <span className="adm-chip"><Icon name={t.icon as IconName} size={18} /></span>
                      <Icon name="arrow-up-right" size={16} />
                    </div>
                    <span className="adm-card__title">{t.title}</span>
                    <span className="adm-card__text">{t.blurb}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
          <p className="adm-card__text">
            Each template opens as an editable page. Click any text to fill it in, then print or save as PDF.
            The email signature and the video call background live in the Studio.
          </p>
        </div>
      )}

      {tab === "studio" && (
        <div className="adm-stack">
          <Segmented options={STUDIO_TABS} value={studioTab} onChange={(v) => setStudioTab(v as StudioTab)} />
          {studioTab === "creative" ? <CreativeStudio /> : <Studio />}
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
