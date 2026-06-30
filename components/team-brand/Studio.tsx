"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BACKGROUNDS, BANNER_SIZES, EVENTS, type Bg, type EventFormat, type Spec,
  renderToCanvas, canvasToBlob, specDims,
} from "@/lib/brandkit-canvas";
import { signatureHtml, type SigInput } from "@/lib/signature";

type Kind = "vbg" | "banner" | "slide" | "signature";

const KINDS: { id: Kind; label: string; blurb: string }[] = [
  { id: "vbg", label: "Virtual background", blurb: "1920 × 1080 for video calls" },
  { id: "banner", label: "Banner", blurb: "Social, web, and email covers" },
  { id: "slide", label: "PowerPoint slide", blurb: "Editable 16:9 title slide" },
  { id: "signature", label: "Email signature", blurb: "Copy into Gmail or Outlook" },
];

function slug(s: string) {
  return (s || "tedxnewy").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tedxnewy";
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-ink-3">{hint}</span>}
    </label>
  );
}

const selectCls =
  "w-full rounded-lg border border-ink/15 bg-cream-light px-3 py-2 text-[13.5px] text-ink outline-none focus:border-red";
const inputCls = selectCls;

function Chips<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { id: T; label: string; sub?: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.id} type="button" onClick={() => onChange(o.id)}
          className={`rounded-lg border px-3 py-2 text-left text-[12.5px] transition ${
            value === o.id ? "border-red bg-red text-white" : "border-ink/15 bg-white text-ink hover:border-red/50"
          }`}>
          <span className="block font-semibold leading-tight">{o.label}</span>
          {o.sub && <span className={`block text-[10.5px] ${value === o.id ? "text-white/80" : "text-ink-3"}`}>{o.sub}</span>}
        </button>
      ))}
    </div>
  );
}

export default function Studio() {
  const [kind, setKind] = useState<Kind>("vbg");
  const [size, setSize] = useState("Website hero");
  const [bgGroup, setBgGroup] = useState<"colour" | "gradient" | "image">("colour");
  const [bgId, setBgId] = useState("ink");
  const [event, setEvent] = useState<EventFormat>("Standard");
  const [heading, setHeading] = useState("");
  const [subheading, setSubheading] = useState("");
  const [tagline, setTagline] = useState(true);
  const [lockupPos, setLockupPos] = useState<"top" | "bottom">("top");
  const [format, setFormat] = useState("PNG");
  const [filename, setFilename] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  // signature state
  const [sig, setSig] = useState<SigInput>({ name: "", role: "", email: "", phone: "", web: "tedxnewy.com.au", aoc: false });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const bg: Bg = useMemo(() => {
    const list = BACKGROUNDS[bgGroup];
    return list.find((b) => b.id === bgId) || list[0];
  }, [bgGroup, bgId]);

  const spec: Spec | null = useMemo(() => {
    if (kind === "signature") return null;
    return {
      kind: kind as "vbg" | "banner" | "slide",
      bg, event, heading, subheading, tagline,
      size: kind === "banner" ? size : undefined,
      lockupPos: kind === "banner" ? lockupPos : undefined,
    };
  }, [kind, bg, event, heading, subheading, tagline, size, lockupPos]);

  // when the group changes, reset only if the current swatch isn't in it
  useEffect(() => {
    if (!BACKGROUNDS[bgGroup].some((b) => b.id === bgId)) setBgId(BACKGROUNDS[bgGroup][0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgGroup]);
  // slides default to the PowerPoint format
  useEffect(() => { setFormat(kind === "slide" ? "PowerPoint (.pptx)" : "PNG"); }, [kind]);

  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 2200); };

  // Render offscreen and only blit the latest result, so rapid option changes
  // can't interleave partial paints on the visible canvas.
  const seq = useRef(0);
  useEffect(() => {
    if (!spec || !canvasRef.current) return;
    const myRun = ++seq.current;
    (async () => {
      const off = document.createElement("canvas");
      try { await renderToCanvas(off, spec); } catch { flash("Preview error"); return; }
      const vis = canvasRef.current;
      if (myRun !== seq.current || !vis) return;
      vis.width = off.width; vis.height = off.height;
      vis.getContext("2d")!.drawImage(off, 0, 0);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec]);

  const download = useCallback((blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, []);

  const handleSave = useCallback(async () => {
    if (!spec || !canvasRef.current) return;
    setBusy(true);
    try {
      const base = slug(filename || heading || kind);
      if (kind === "slide" && format.startsWith("Power")) {
        const PptxGen = (await import("pptxgenjs")).default;
        // render a clean background (no text) for the slide, then add editable text boxes
        const bgSpec: Spec = { ...spec, heading: "", subheading: "" };
        const tmp = document.createElement("canvas");
        await renderToCanvas(tmp, bgSpec);
        const bgData = tmp.toDataURL("image/png");
        const p = new PptxGen();
        p.defineLayout({ name: "W16x9", width: 13.333, height: 7.5 });
        p.layout = "W16x9";
        const s = p.addSlide();
        s.addImage({ data: bgData, x: 0, y: 0, w: 13.333, h: 7.5 });
        const dark = spec.bg.dark;
        s.addText(heading || "Add your title here", {
          x: 0.95, y: 3.25, w: 11, h: 2.4, fontFace: "Arial", fontSize: 40, bold: true,
          color: dark ? "FFFFFF" : "141210", align: "left", valign: "top",
        });
        s.addText(subheading || "Add a subtitle", {
          x: 0.95, y: 5.7, w: 9.5, h: 0.9, fontFace: "Arial", fontSize: 18,
          color: dark ? "E6E6E1" : "6B6459", align: "left", valign: "top",
        });
        await p.writeFile({ fileName: `${base}.pptx` });
      } else {
        const blob = await canvasToBlob(canvasRef.current);
        download(blob, `${base}.png`);
      }
      flash("Saved");
    } catch {
      flash("Could not save");
    } finally {
      setBusy(false);
    }
  }, [spec, kind, format, filename, heading, subheading, download]);

  // ---------- signature actions ----------
  const sigHtml = useMemo(() => signatureHtml(sig), [sig]);
  const copySig = useCallback(async () => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([sigHtml], { type: "text/html" }),
          "text/plain": new Blob([`${sig.name} · ${sig.role}, TEDxNewy`], { type: "text/plain" }),
        }),
      ]);
      flash("Signature copied — paste into your email client");
    } catch {
      flash("Copy not supported here — use Download");
    }
  }, [sigHtml, sig]);
  const downloadSig = useCallback(() => {
    download(new Blob([`<!doctype html><meta charset=utf-8>${sigHtml}`], { type: "text/html" }),
      `${slug(sig.name)}-signature.htm`);
  }, [sigHtml, sig, download]);

  const [pw, ph] = spec ? specDims(spec) : [16, 9];

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,360px)_1fr]">
      {/* ---- the flow ---- */}
      <div className="rounded-2xl border border-ink/10 bg-white p-5">
        <Field label="1 · What do you want?">
          <div className="grid grid-cols-2 gap-2">
            {KINDS.map((k) => (
              <button key={k.id} type="button" onClick={() => setKind(k.id)}
                className={`rounded-lg border p-2.5 text-left transition ${
                  kind === k.id ? "border-red bg-red text-white" : "border-ink/15 bg-white text-ink hover:border-red/50"
                }`}>
                <span className="block text-[12.5px] font-semibold leading-tight">{k.label}</span>
                <span className={`block text-[10.5px] ${kind === k.id ? "text-white/80" : "text-ink-3"}`}>{k.blurb}</span>
              </button>
            ))}
          </div>
        </Field>

        {kind === "signature" ? (
          <div className="mt-4 space-y-3">
            <Field label="Full name"><input className={inputCls} value={sig.name} onChange={(e) => setSig({ ...sig, name: e.target.value })} placeholder="Will Berry" /></Field>
            <Field label="Role"><input className={inputCls} value={sig.role} onChange={(e) => setSig({ ...sig, role: e.target.value })} placeholder="Chief Operating Officer" /></Field>
            <Field label="Email"><input className={inputCls} value={sig.email} onChange={(e) => setSig({ ...sig, email: e.target.value })} placeholder="will@tedxnewy.com.au" /></Field>
            <Field label="Phone (optional)"><input className={inputCls} value={sig.phone} onChange={(e) => setSig({ ...sig, phone: e.target.value })} placeholder="0400 000 000" /></Field>
            <label className="flex items-center gap-2 text-[12.5px] text-ink">
              <input type="checkbox" checked={sig.aoc} onChange={(e) => setSig({ ...sig, aoc: e.target.checked })} />
              Include Acknowledgement of Country
            </label>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {kind === "banner" && (
              <Field label="2 · Size">
                <select className={selectCls} value={size} onChange={(e) => setSize(e.target.value)}>
                  {Object.keys(BANNER_SIZES).map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
            )}
            <Field label={`${kind === "banner" ? "3" : "2"} · Background`}>
              <div className="mb-2">
                <Chips value={bgGroup} onChange={setBgGroup}
                  options={[{ id: "colour", label: "Colour" }, { id: "gradient", label: "Gradient" }, { id: "image", label: "Photo" }]} />
              </div>
              <div className="flex flex-wrap gap-2">
                {BACKGROUNDS[bgGroup].map((b) => (
                  <button key={b.id} type="button" title={b.label} onClick={() => setBgId(b.id)}
                    className={`h-9 w-9 overflow-hidden rounded-md border-2 ${bgId === b.id ? "border-red" : "border-ink/15"}`}
                    style={b.kind === "image" ? { backgroundImage: `url(${b.value})`, backgroundSize: "cover" }
                      : b.kind === "gradient" ? { background: `linear-gradient(135deg, ${b.value.replace("→", ", ")})` }
                      : { background: b.value }} />
                ))}
              </div>
            </Field>
            <Field label={`${kind === "banner" ? "4" : "3"} · Event logo`}>
              <Chips value={event} onChange={(v) => setEvent(v as EventFormat)} options={EVENTS.map((e) => ({ id: e, label: e }))} />
            </Field>
            <Field label={`${kind === "banner" ? "5" : "4"} · ${kind === "vbg" ? "Name" : kind === "slide" ? "Title" : "Headline"} (optional)`}>
              <input className={inputCls} value={heading} onChange={(e) => setHeading(e.target.value)}
                placeholder={kind === "vbg" ? "Will Berry" : kind === "slide" ? "What if Newcastle led the world?" : "Ideas worth spreading"} />
            </Field>
            <Field label={kind === "vbg" ? "Role (optional)" : "Subheading (optional)"}>
              <input className={inputCls} value={subheading} onChange={(e) => setSubheading(e.target.value)}
                placeholder={kind === "vbg" ? "Chief Operating Officer" : "TEDxNewy · 2026"} />
            </Field>
            {kind === "vbg" && (
              <label className="flex items-center gap-2 text-[12.5px] text-ink">
                <input type="checkbox" checked={tagline} onChange={(e) => setTagline(e.target.checked)} />
                Show &quot;x = independently organized TED event&quot;
              </label>
            )}
            {kind === "banner" && (
              <Field label="6 · Lockup position">
                <Chips value={lockupPos} onChange={setLockupPos} options={[{ id: "top", label: "Top" }, { id: "bottom", label: "Bottom" }]} />
              </Field>
            )}
            {kind === "slide" && (
              <Field label="5 · Format">
                <select className={selectCls} value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option>PowerPoint (.pptx)</option>
                  <option>PNG</option>
                </select>
              </Field>
            )}
            <Field label="File name">
              <input className={inputCls} value={filename} onChange={(e) => setFilename(e.target.value)} placeholder={slug(heading || kind)} />
            </Field>
          </div>
        )}
      </div>

      {/* ---- preview + actions ---- */}
      <div>
        {kind === "signature" ? (
          <>
            <div className="rounded-2xl border border-ink/10 bg-white p-6">
              <div dangerouslySetInnerHTML={{ __html: sigHtml }} />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={copySig} className="btn-pill btn-red">Copy signature</button>
              <button onClick={downloadSig} className="btn-pill btn-secondary">Download .htm</button>
            </div>
            <p className="mt-3 text-[12.5px] text-ink-3">
              The logo and icons load from tedxnewy.com.au, so they appear in sent mail. Paste into Gmail or Outlook signature settings.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center rounded-2xl border border-ink/10 bg-[repeating-conic-gradient(#eee_0_25%,#fff_0_50%)] bg-[length:22px_22px] p-3">
              <canvas ref={canvasRef} className="max-h-[58vh] max-w-full rounded-md shadow-md"
                style={{ aspectRatio: `${pw} / ${ph}` }} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button onClick={handleSave} disabled={busy} className="btn-pill btn-red disabled:opacity-60">
                {busy ? "Saving…" : `Save ${format.startsWith("Power") ? "PowerPoint" : "PNG"}`}
              </button>
              <span className="text-[12.5px] text-ink-3">{pw} × {ph}px</span>
            </div>
          </>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
