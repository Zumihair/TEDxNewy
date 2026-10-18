"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  THEMES, BANNER_SIZES, EVENTS, renderBgThumb, type Bg, type EventFormat, type Spec,
  renderToCanvas, canvasToBlob, specDims,
} from "@/lib/brandkit-canvas";
import GalleryPicker from "@/components/GalleryPicker";
import type { SocialLink } from "@/lib/social-catalogue";
import { signatureHtml, signatureReplyHtml, type SigInput } from "@/lib/signature";

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
  "w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-[13.5px] text-ink outline-none focus:border-red";
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

/** One theme swatch, drawn by the same painter that makes the real image. */
function ThemeSwatch({ bg, active, onPick }: { bg: Bg; active: boolean; onPick: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) renderBgThumb(ref.current, bg).catch(() => {});
  }, [bg]);
  return (
    <button type="button" onClick={onPick} title={bg.label} className={`overflow-hidden rounded-md border-2 text-left ${active ? "border-red" : "border-ink/15"}`}>
      <canvas ref={ref} className="block h-auto w-full" style={{ aspectRatio: "16 / 9" }} />
      <span className="block px-1.5 py-1 text-[11px] font-semibold text-ink">{bg.label}</span>
    </button>
  );
}

export default function Studio({
  fixedKind,
  me = null,
}: {
  fixedKind?: "vbg" | "banner" | "signature";
  /** The signed-in person's team profile, used to fill the signature. */
  me?: { name: string; role: string | null; email: string | null; phone: string | null; socials: SocialLink[] } | null;
} = {}) {
  const [kind, setKind] = useState<Kind>(fixedKind ?? "vbg");
  const [size, setSize] = useState("Website hero");
  const [bgMode, setBgMode] = useState<"theme" | "photo">("theme");
  const [bgId, setBgId] = useState("signal");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
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
  const [sig, setSig] = useState<SigInput>({
    name: me?.name ?? "",
    role: me?.role ?? "",
    email: me?.email ?? "",
    phone: me?.phone ?? "",
    web: "tedxnewy.com.au",
    socials: me?.socials ?? [],
    aoc: false,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const bg: Bg = useMemo(() => {
    if (bgMode === "photo" && photoUrl) return { id: "photo", label: "Photo", kind: "image", value: photoUrl, dark: true, red: false };
    return THEMES.find((b) => b.id === bgId) || THEMES[0];
  }, [bgMode, photoUrl, bgId]);

  // Pick a gallery photo: fetched once into a local blob so the canvas stays exportable.
  const pickPhoto = useCallback(async (url: string) => {
    try {
      const r = await fetch(url);
      const b = await r.blob();
      setPhotoUrl(URL.createObjectURL(b));
      setBgMode("photo");
    } catch {
      setToast("Could not load that photo");
      window.setTimeout(() => setToast(""), 2200);
    }
  }, []);

  const spec: Spec | null = useMemo(() => {
    if (kind === "signature") return null;
    return {
      kind: kind as "vbg" | "banner" | "slide",
      bg, event, heading, subheading, tagline,
      size: kind === "banner" ? size : undefined,
      lockupPos: kind === "banner" ? lockupPos : undefined,
    };
  }, [kind, bg, event, heading, subheading, tagline, size, lockupPos]);

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
          color: dark ? "FFFFFF" : "000000", align: "left", valign: "top",
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
  const [origin, setOrigin] = useState<string | undefined>(undefined);
  useEffect(() => setOrigin(window.location.origin), []);
  const sigShown = useMemo(() => signatureHtml(sig, origin), [sig, origin]);
  const sigReplyHtml = useMemo(() => signatureReplyHtml(sig), [sig]);
  const sigReplyShown = useMemo(() => signatureReplyHtml(sig, origin), [sig, origin]);
  const copyHtml = useCallback(async (html: string, plain: string, okMsg: string) => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
      flash(okMsg);
    } catch {
      flash("Copy not supported here, use Download");
    }
  }, []);
  const copySig = useCallback(
    () => copyHtml(sigHtml, `${sig.name} · ${sig.role}, TEDxNewy`, "Signature copied, paste into your email client"),
    [copyHtml, sigHtml, sig],
  );
  const copySigReply = useCallback(
    () => copyHtml(sigReplyHtml, `${sig.name} · ${sig.role}, TEDxNewy`, "Reply signature copied, paste into your email client"),
    [copyHtml, sigReplyHtml, sig],
  );
  const downloadSig = useCallback(() => {
    download(new Blob([`<!doctype html><meta charset=utf-8>${sigHtml}`], { type: "text/html" }),
      `${slug(sig.name)}-signature.htm`);
  }, [sigHtml, sig, download]);
  const downloadSigReply = useCallback(() => {
    download(new Blob([`<!doctype html><meta charset=utf-8>${sigReplyHtml}`], { type: "text/html" }),
      `${slug(sig.name)}-signature-reply.htm`);
  }, [sigReplyHtml, sig, download]);

  const [pw, ph] = spec ? specDims(spec) : [16, 9];

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,360px)_1fr]">
      {/* ---- the flow ---- */}
      <div className="rounded-2xl border border-ink/10 bg-white p-5">
        {!fixedKind && (
          <Field label="What do you want?">
            <div className="grid grid-cols-2 gap-2">
              {KINDS.filter((k) => k.id !== "slide").map((k) => (
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
        )}

        {kind === "signature" ? (
          <div className={fixedKind ? "space-y-3" : "mt-4 space-y-3"}>
            {me ? (
              <p className="text-[12.5px] leading-[1.5] text-stone">
                Filled in from your profile. Change your photo, phone and socials in <a href="/admin/account" className="adm-link">My account</a>; your role is set by an admin.
              </p>
            ) : (
              <p className="text-[12.5px] leading-[1.5] text-stone">Your sign-in is not linked to a team member yet, so fill these in by hand.</p>
            )}
            <Field label="Full name"><input className={inputCls} value={sig.name} onChange={(e) => setSig({ ...sig, name: e.target.value })} placeholder="First Last" /></Field>
            <Field label="Role"><input className={inputCls} value={sig.role} readOnly={!!me} disabled={!!me} onChange={(e) => setSig({ ...sig, role: e.target.value })} placeholder="Role" /></Field>
            <Field label="Email"><input className={inputCls} value={sig.email} onChange={(e) => setSig({ ...sig, email: e.target.value })} placeholder="name@tedxnewy.com.au" /></Field>
            <Field label="Phone (optional)"><input className={inputCls} value={sig.phone} onChange={(e) => setSig({ ...sig, phone: e.target.value })} placeholder="0400 000 000" /></Field>
            <label className="flex items-center gap-2 text-[12.5px] text-ink">
              <input type="checkbox" checked={sig.aoc} onChange={(e) => setSig({ ...sig, aoc: e.target.checked })} />
              Include Acknowledgement of Country
            </label>
          </div>
        ) : (
          <div className={fixedKind ? "space-y-4" : "mt-4 space-y-4"}>
            {kind === "banner" && (
              <Field label="Size">
                <select className={selectCls} value={size} onChange={(e) => setSize(e.target.value)}>
                  {Object.keys(BANNER_SIZES).map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
            )}
            <Field label="Background">
              {kind === "banner" && (
                <div className="mb-2">
                  <Chips value={bgMode} onChange={setBgMode}
                    options={[{ id: "theme", label: "Theme" }, { id: "photo", label: "Event photo" }]} />
                </div>
              )}
              {bgMode === "theme" || kind !== "banner" ? (
                <div className="grid grid-cols-4 gap-2">
                  {THEMES.map((b) => (
                    <ThemeSwatch key={b.id} bg={b} active={bgMode === "theme" && bgId === b.id} onPick={() => { setBgMode("theme"); setBgId(b.id); }} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <button type="button" onClick={() => setGalleryOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ink/25 bg-cream px-3 py-3 text-[13px] font-semibold text-ink transition hover:border-red">
                    {photoUrl ? "Choose a different photo" : "Choose from the event gallery"}
                  </button>
                  {galleryOpen && (
                    <GalleryPicker onSelect={(photo) => pickPhoto(photo.url)} onClose={() => setGalleryOpen(false)} />
                  )}
                </div>
              )}
            </Field>
            <Field label="Event logo">
              <Chips value={event} onChange={(v) => setEvent(v as EventFormat)} options={EVENTS.map((e) => ({ id: e, label: e }))} />
            </Field>
            <Field label={`${kind === "vbg" ? "Name" : kind === "slide" ? "Title" : "Headline"} (optional)`}>
              <input className={inputCls} value={heading} onChange={(e) => setHeading(e.target.value)}
                placeholder={kind === "vbg" ? "First Last" : kind === "slide" ? "Title" : "Headline"} />
            </Field>
            <Field label={kind === "vbg" ? "Role (optional)" : "Subheading (optional)"}>
              <input className={inputCls} value={subheading} onChange={(e) => setSubheading(e.target.value)}
                placeholder={kind === "vbg" ? "Role" : "Subheading"} />
            </Field>
            {kind === "vbg" && (
              <label className="flex items-center gap-2 text-[12.5px] text-ink">
                <input type="checkbox" checked={tagline} onChange={(e) => setTagline(e.target.checked)} />
                Show &quot;x = independently organized TED event&quot;
              </label>
            )}
            {kind === "banner" && (
              <Field label="Lockup position">
                <Chips value={lockupPos} onChange={setLockupPos} options={[{ id: "top", label: "Top" }, { id: "bottom", label: "Bottom" }]} />
              </Field>
            )}
            {kind === "slide" && (
              <Field label="Format">
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
            <div>
              <span className="mb-2 block text-[12.5px] font-semibold text-ink">Full signature &middot; new emails</span>
              <div className="rounded-2xl border border-ink/10 bg-white p-6">
                <div dangerouslySetInnerHTML={{ __html: sigShown }} />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={copySig} className="btn-pill btn-red">Copy signature</button>
                <button onClick={downloadSig} className="btn-pill btn-secondary">Download .htm</button>
              </div>
            </div>
            <div className="mt-7">
              <span className="mb-2 block text-[12.5px] font-semibold text-ink">Reply signature &middot; replies and forwards</span>
              <div className="rounded-2xl border border-ink/10 bg-white p-6">
                <div dangerouslySetInnerHTML={{ __html: sigReplyShown }} />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={copySigReply} className="btn-pill btn-red">Copy signature</button>
                <button onClick={downloadSigReply} className="btn-pill btn-secondary">Download .htm</button>
              </div>
            </div>
            <p className="mt-4 text-[12.5px] text-ink-3">
              The logo and icons load from tedxnewy.com.au, so they appear in sent mail. In Gmail (Settings &rarr; General &rarr;
              Signature), add both as separate signatures, then pick the full one under &quot;FOR NEW EMAILS USE&quot; and the
              reply one under &quot;ON REPLY/FORWARD USE&quot;. Outlook has the same split under Signatures &rarr; New messages
              / Replies and forwards.
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
