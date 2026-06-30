"use client";

import { useState, useCallback } from "react";
import {
  COLOUR_GROUPS, STATEMENT_GROUPS, EVENT_FORMATS, COLOURWAYS, lockupPath,
} from "@/lib/brand-portal-data";
import Studio from "./Studio";

function useToast() {
  const [toast, setToast] = useState("");
  const flash = useCallback((m: string) => { setToast(m); window.setTimeout(() => setToast(""), 1800); }, []);
  return { toast, flash };
}

export default function BrandPortal() {
  const [tab, setTab] = useState<"reference" | "studio">("reference");
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
    await Promise.all(jobs);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "TEDxNewy-logos.zip"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, [flash]);

  return (
    <div>
      <div className="mb-8 inline-flex rounded-full border border-ink/15 bg-white p-1">
        {(["reference", "studio"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-5 py-2 text-[13.5px] font-semibold transition ${
              tab === t ? "bg-ink text-white" : "text-ink hover:text-red"
            }`}>
            {t === "reference" ? "Brand reference" : "Creative studio"}
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
            <div className="grid gap-4 sm:grid-cols-3">
              {EVENT_FORMATS.map((ev) => (
                <div key={ev} className="rounded-2xl border border-ink/10 bg-white p-4">
                  <div className="mb-3 text-[14px] font-bold text-ink">TEDxNewy {ev === "Standard" ? "" : ev}</div>
                  <div className="space-y-3">
                    {COLOURWAYS.map((cw) => (
                      <div key={cw.key} className="rounded-lg border border-ink/10 p-2"
                        style={{ background: cw.key === "black" ? "#f4efe6" : cw.key === "white" ? "#141210" : "#e02214" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={lockupPath(ev, cw.key, "png")} alt={`TEDxNewy ${ev} ${cw.label}`} className="mx-auto h-9 object-contain" />
                        <div className="mt-2 flex items-center justify-between rounded-md bg-white/85 px-2 py-1">
                          <span className="text-[10.5px] font-semibold text-ink">{cw.label}</span>
                          <span className="flex gap-2 text-[11px] font-bold">
                            <a className="text-red hover:underline" href={lockupPath(ev, cw.key, "png")} download>PNG</a>
                            <a className="text-red hover:underline" href={lockupPath(ev, cw.key, "svg")} download>SVG</a>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
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
                        className="group overflow-hidden rounded-xl border border-ink/10 bg-white text-left transition hover:shadow-md">
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
      ) : (
        <Studio />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
