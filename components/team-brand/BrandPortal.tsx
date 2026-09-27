"use client";

import { useState, useCallback, useEffect } from "react";
import {
  COLOUR_GROUPS, STATEMENT_GROUPS, EVENT_FORMATS, COLOURWAYS, lockupPath,
  TAGLINE_ORIENTATIONS, TAGLINE_SVG, taglinePath, FONTS,
} from "@/lib/brand-portal-data";
import Studio from "./Studio";
import CreativeStudio from "./CreativeStudio";

type Tab = "reference" | "studio" | "creative";
const TABS: { id: Tab; label: string }[] = [
  { id: "reference", label: "Brand reference" },
  { id: "studio", label: "Brand studio" },
  { id: "creative", label: "Creative studio" },
];

function useToast() {
  const [toast, setToast] = useState("");
  const flash = useCallback((m: string) => { setToast(m); window.setTimeout(() => setToast(""), 1800); }, []);
  return { toast, flash };
}

export default function BrandPortal() {
  const [tab, setTab] = useState<Tab>("reference");
  const [event, setEvent] = useState<(typeof EVENT_FORMATS)[number]>("Standard");
  const { toast, flash } = useToast();

  // Sync the active tab with the URL so each view has a shareable link:
  // /team-brand (Brand reference), ?view=studio (Brand studio),
  // ?view=creative (Creative studio).
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("view");
    if (v === "studio" || v === "creative") setTab(v);
  }, []);

  const selectTab = useCallback((t: Tab) => {
    setTab(t);
    const url = new URL(window.location.href);
    if (t === "reference") url.searchParams.delete("view");
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
    <div>
      <div className="mb-8 inline-flex flex-wrap rounded-full border border-ink/15 bg-white p-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => selectTab(t.id)}
            className={`rounded-full px-5 py-2 text-[13.5px] font-semibold transition ${
              tab === t.id ? "bg-ink text-white" : "text-ink hover:text-red"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "reference" ? (
        <div className="space-y-14">
          {/* logos */}
          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="mb-1 text-2xl font-bold tracking-tight text-ink">Logos</h2>
                <p className="text-[14px] text-ink-3">PNG for everyday, SVG for print and large format. White or black backgrounds only.</p>
              </div>
              <button onClick={downloadAllLogos} className="btn-pill btn-dark">Download all (zip)</button>
            </div>
            <div className="mb-4 inline-flex flex-wrap rounded-full border border-ink/15 bg-white p-1" role="group" aria-label="Event format">
              {EVENT_FORMATS.map((ev) => (
                <button key={ev} onClick={() => setEvent(ev)} aria-pressed={event === ev}
                  className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
                    event === ev ? "bg-ink text-white" : "text-ink hover:text-red"
                  }`}>
                  {ev}
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {COLOURWAYS.map((cw) => (
                <LogoSwatch key={cw.key} colourway={cw} alt={`TEDxNewy ${event} ${cw.label}`}
                  png={lockupPath(event, cw.key, "png")} svg={lockupPath(event, cw.key, "svg")} imgClass="h-12" />
              ))}
            </div>
          </section>

          {/* tagline */}
          <section>
            <div className="mb-5">
              <h2 className="mb-1 text-2xl font-bold tracking-tight text-ink">Tagline</h2>
              <p className="text-[14px] text-ink-3">&ldquo;Ideas change everything.&rdquo; In the same three colourways as the logos.</p>
            </div>
            <div className="space-y-6">
              {TAGLINE_ORIENTATIONS.map((o) => (
                <div key={o}>
                  <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-red">{o}</div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {COLOURWAYS.map((cw) => (
                      <LogoSwatch key={cw.key} colourway={cw} alt={`Tagline ${o} ${cw.label}`}
                        png={taglinePath(o, cw.key, "png")}
                        svg={TAGLINE_SVG.includes(o) ? taglinePath(o, cw.key, "svg") : undefined}
                        imgClass={o === "Vertical" ? "h-28" : "h-8"} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* fonts */}
          <section>
            <h2 className="mb-1 text-2xl font-bold tracking-tight text-ink">Fonts</h2>
            <p className="mb-5 text-[14px] text-ink-3">
              TEDx logos are only ever set in Inter or Helvetica. When in doubt, use Inter.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {FONTS.map((f) => (
                <div key={f.name} className="flex flex-col rounded-xl border border-ink/10 bg-white p-4">
                  <div className="mb-3 text-[12px] font-bold uppercase tracking-wide text-red">{f.role}</div>
                  <div className="rounded-lg bg-cream px-4 py-5 text-ink" style={{ fontFamily: f.family }}>
                    <div className="text-[26px] leading-[1.1] tracking-tight" style={{ fontWeight: f.weight }}>
                      Ideas change everything<span className="text-red">.</span>
                    </div>
                    <div className="mt-3 text-[15px] font-normal">Aa Bb Cc Dd Ee 0123456789</div>
                  </div>
                  <div className="mt-3 text-[15px] font-bold text-ink">{f.name}</div>
                  <p className="mt-1 flex-1 text-[13.5px] leading-snug text-ink-3">{f.body}</p>
                  {f.link && (
                    <a href={f.link.href} target="_blank" rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-red hover:underline">
                      {f.link.label} <span aria-hidden>&rarr;</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* colours */}
          <section>
            <h2 className="mb-1 text-2xl font-bold tracking-tight text-ink">Colours</h2>
            <p className="mb-5 text-[14px] text-ink-3">Click a swatch to copy its hex.</p>
            <div className="space-y-6">
              {COLOUR_GROUPS.map((g) => (
                <div key={g.title}>
                  <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-red">{g.title}</div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                    {g.swatches.map((s) => (
                      <button key={s.name} onClick={() => copy(s.hex, s.hex)}
                        className="group flex flex-col justify-start overflow-hidden rounded-xl border border-ink/10 bg-white text-left transition hover:shadow-md">
                        <div className="h-16 w-full" style={{ background: s.hex, borderBottom: s.light ? "1px solid #eee" : "none" }} />
                        <div className="p-2.5">
                          <div className="text-[13px] font-semibold text-ink">{s.name}</div>
                          <div className="font-mono text-[11.5px] text-ink-3 group-hover:text-red">{s.hex}</div>
                          {s.note && <div className="text-[10.5px] text-ink-3">{s.note}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* statements */}
          <section>
            <h2 className="mb-1 text-2xl font-bold tracking-tight text-ink">Brand statements</h2>
            <p className="mb-5 text-[14px] text-ink-3">Click any line to copy it.</p>
            <div className="grid gap-6 md:grid-cols-2">
              {STATEMENT_GROUPS.map((g) => (
                <div key={g.title}>
                  <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-red">{g.title}</div>
                  <div className="space-y-2">
                    {g.items.map((it) => (
                      <button key={it.label} onClick={() => copy(it.text, it.label)}
                        className="block w-full rounded-xl border border-ink/10 bg-white p-3.5 text-left transition hover:border-red/40 hover:shadow-sm">
                        <div className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-3">{it.label}</div>
                        <div className="text-[13.5px] leading-snug text-ink">{it.text}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : tab === "studio" ? (
        <Studio />
      ) : (
        <CreativeStudio />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
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
    <div className="flex flex-col rounded-lg border border-ink/10 p-2" style={{ background: SWATCH_BG[colourway.key] }}>
      <div className="flex flex-1 items-center justify-center px-2 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={png} alt={alt} className={`max-w-full object-contain ${imgClass}`} />
      </div>
      <div className="flex items-center justify-between rounded-md bg-white/85 px-2 py-1">
        <span className="text-[10.5px] font-semibold text-ink">{colourway.label}</span>
        <span className="flex gap-2 text-[11px] font-bold">
          <a className="text-red hover:underline" href={png} download>PNG</a>
          {svg && <a className="text-red hover:underline" href={svg} download>SVG</a>}
        </span>
      </div>
    </div>
  );
}
