"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Images, UploadCloud } from "lucide-react";
import GalleryPicker from "@/components/GalleryPicker";
import {
  ASPECTS, CHIP_COLOURS, LOGO_STYLES, EVENTS, DEFAULT_SPEC,
  renderPost, canvasToBlob,
  type PostSpec, type Placement, type BrandPlacement, type Corner,
  type BlockPos, type Align, type ChipPlace, type EventFormat,
} from "@/lib/creative-canvas";

function slug(s: string) {
  return (s || "tedxnewy-post").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tedxnewy-post";
}

// ---- shared little controls (mirrors the Brand studio styling) ----
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-ink-3">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-ink/15 bg-cream-light px-3 py-2 text-[13.5px] text-ink outline-none focus:border-red";

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

function Slider({ value, onChange, min = 0, max = 1, step = 0.01 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-red" />
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-[12.5px] font-semibold text-ink">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="accent-red" />
      {label}
    </label>
  );
}

const PLACEMENTS: { id: Placement; label: string }[] = [
  { id: "none", label: "None" }, { id: "bottom", label: "Bottom" },
  { id: "top", label: "Top" }, { id: "whole", label: "Whole" },
];
const BRAND_PLACEMENTS: { id: BrandPlacement; label: string }[] = [
  ...PLACEMENTS, { id: "diagonal", label: "Diagonal" },
];
const CORNERS: { id: Corner; label: string }[] = [
  { id: "tl", label: "Top left" }, { id: "tr", label: "Top right" },
  { id: "bl", label: "Bottom left" }, { id: "br", label: "Bottom right" },
  { id: "none", label: "Hidden" },
];

/**
 * Payload handed back when the studio runs in "attach" mode (used by
 * /admin/socials): the 2x PNG render, the spec that produced it (stored so
 * the design can be reopened and edited later), and the source photo if one
 * was picked in this session — either a freshly uploaded `sourceFile`, or
 * `sourceImageUrl` when it came from the gallery picker (already permanently
 * hosted, so the caller doesn't need to re-upload it). Both are null when
 * editing an existing design without replacing its photo.
 */
export type AttachPayload = {
  blob: Blob;
  spec: PostSpec;
  sourceFile: File | null;
  sourceImageUrl: string | null;
};

export default function CreativeStudio({
  initialSpec,
  initialImageUrl,
  attachLabel = "Attach to post",
  onAttach,
}: {
  initialSpec?: PostSpec;
  initialImageUrl?: string;
  attachLabel?: string;
  onAttach?: (payload: AttachPayload) => Promise<void>;
} = {}) {
  const [spec, setSpec] = useState<PostSpec>(initialSpec ?? DEFAULT_SPEC);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [imgName, setImgName] = useState("");
  const [format, setFormat] = useState<"PNG" | "JPG">("PNG");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [toast, setToast] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const objUrl = useRef<string | null>(null);
  const sourceFile = useRef<File | null>(null);
  const sourceImageUrl = useRef<string | null>(null);

  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 2200); };

  // nested spec setters
  const set = (patch: Partial<PostSpec>) => setSpec((s) => ({ ...s, ...patch }));
  const setDark = (patch: Partial<PostSpec["dark"]>) => setSpec((s) => ({ ...s, dark: { ...s.dark, ...patch } }));
  const setBrand = (patch: Partial<PostSpec["brand"]>) => setSpec((s) => ({ ...s, brand: { ...s.brand, ...patch } }));
  const setLogo = (patch: Partial<PostSpec["logo"]>) => setSpec((s) => ({ ...s, logo: { ...s.logo, ...patch } }));
  const setChip = (patch: Partial<PostSpec["chip"]>) => setSpec((s) => ({ ...s, chip: { ...s.chip, ...patch } }));
  const setCta = (patch: Partial<PostSpec["cta"]>) => setSpec((s) => ({ ...s, cta: { ...s.cta, ...patch } }));

  const loadFile = useCallback((file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { flash("That's not an image file"); return; }
    if (objUrl.current) URL.revokeObjectURL(objUrl.current);
    const url = URL.createObjectURL(file);
    objUrl.current = url;
    const im = new Image();
    im.onload = () => setImg(im);
    im.onerror = () => flash("Couldn't read that image. Try a JPG or PNG (HEIC isn't supported).");
    im.src = url;
    sourceFile.current = file;
    sourceImageUrl.current = null;
    setImgName(file.name.replace(/\.[^.]+$/, ""));
    setSpec((s) => ({ ...s, zoom: 1, focusX: 0.5, focusY: 0.5 }));
  }, []);

  // Fetch-to-blob keeps the canvas untainted regardless of CORS image quirks.
  // Used both to reopen a saved design's source photo (isNewPick unset, so
  // the source refs stay untouched) and for a fresh gallery pick.
  const loadFromUrl = useCallback((url: string, opts?: { isNewPick?: boolean; name?: string }) => {
    (async () => {
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error();
        const b = await r.blob();
        if (objUrl.current) URL.revokeObjectURL(objUrl.current);
        const objectUrl = URL.createObjectURL(b);
        objUrl.current = objectUrl;
        const im = new Image();
        im.onload = () => setImg(im);
        im.onerror = () => flash("Couldn't read that image.");
        im.src = objectUrl;
        if (opts?.isNewPick) {
          sourceFile.current = null;
          sourceImageUrl.current = url;
          setImgName(opts.name ?? "gallery-photo");
          setSpec((s) => ({ ...s, zoom: 1, focusX: 0.5, focusY: 0.5 }));
        }
      } catch {
        flash(
          opts?.isNewPick
            ? "Couldn't load that photo. Try again."
            : "Couldn't load the saved photo. Upload it again to keep editing.",
        );
      }
    })();
  }, []);

  // Attach mode, reopening a saved design: load its source photo from storage.
  useEffect(() => {
    if (!initialImageUrl) return;
    loadFromUrl(initialImageUrl);
  }, [initialImageUrl, loadFromUrl]);

  // revoke the object URL on unmount
  useEffect(() => () => { if (objUrl.current) URL.revokeObjectURL(objUrl.current); }, []);

  // live preview: render offscreen, blit only the latest so rapid edits don't tear
  const seq = useRef(0);
  useEffect(() => {
    if (!canvasRef.current) return;
    const myRun = ++seq.current;
    (async () => {
      const off = document.createElement("canvas");
      try { await renderPost(off, spec, img, 1); } catch { return; }
      const vis = canvasRef.current;
      if (myRun !== seq.current || !vis) return;
      vis.width = off.width; vis.height = off.height;
      vis.getContext("2d")!.drawImage(off, 0, 0);
    })();
  }, [spec, img]);

  const handleSave = useCallback(async () => {
    if (!img) { flash("Add a photo first"); return; }
    setBusy(true);
    try {
      const off = document.createElement("canvas");
      await renderPost(off, spec, img, 2); // 2x for a crisp, high-res export
      const type = format === "JPG" ? "image/jpeg" : "image/png";
      const blob = await canvasToBlob(off, type, 0.95);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug(imgName || spec.headline)}.${format === "JPG" ? "jpg" : "png"}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      flash("Saved");
    } catch {
      flash("Could not save");
    } finally {
      setBusy(false);
    }
  }, [img, spec, format, imgName]);

  const handleAttach = useCallback(async () => {
    if (!onAttach) return;
    if (!img) { flash("Add a photo first"); return; }
    setBusy(true);
    try {
      const off = document.createElement("canvas");
      await renderPost(off, spec, img, 2);
      const blob = await canvasToBlob(off, "image/png", 0.95);
      await onAttach({
        blob,
        spec,
        sourceFile: sourceFile.current,
        sourceImageUrl: sourceImageUrl.current,
      });
    } catch (e) {
      flash(e instanceof Error && e.message ? e.message : "Could not attach");
    } finally {
      setBusy(false);
    }
  }, [img, spec, onAttach]);

  const aspect = ASPECTS.find((a) => a.id === spec.aspect)!;

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,380px)_1fr]">
      {/* ---- controls ---- */}
      <div className="max-h-[76vh] space-y-5 overflow-y-auto rounded-2xl border border-ink/10 bg-white p-5 pr-4">
        <Field label="1 · Photo" hint="Any image, or pick an event photo already on the site.">
          <div className="flex gap-2">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-ink/25 bg-cream-light px-3 py-3 text-[13px] font-semibold text-ink transition hover:border-red">
              <UploadCloud className="h-4 w-4" strokeWidth={2} />
              {img ? "Replace photo" : "Upload photo"}
            </button>
            <button type="button" onClick={() => setGalleryOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-ink/25 bg-cream-light px-3 py-3 text-[13px] font-semibold text-ink transition hover:border-red">
              <Images className="h-4 w-4" strokeWidth={2} />
              Select from gallery
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden
            onChange={(e) => loadFile(e.target.files?.[0])} />
          {galleryOpen && (
            <GalleryPicker
              onSelect={(photo) => loadFromUrl(photo.url, { isNewPick: true, name: photo.name })}
              onClose={() => setGalleryOpen(false)}
            />
          )}
        </Field>

        <Field label="2 · Shape">
          <Chips value={spec.aspect} onChange={(v) => set({ aspect: v })}
            options={ASPECTS.map((a) => ({ id: a.id, label: a.label, sub: a.sub }))} />
        </Field>

        {img && (
          <div className="space-y-3 rounded-xl border border-ink/10 bg-cream-light p-3">
            <Field label={`Zoom · ${spec.zoom.toFixed(2)}×`}>
              <Slider value={spec.zoom} min={1} max={3} step={0.01} onChange={(v) => set({ zoom: v })} />
            </Field>
            <Field label="Position across">
              <Slider value={spec.focusX} onChange={(v) => set({ focusX: v })} />
            </Field>
            <Field label="Position up / down">
              <Slider value={spec.focusY} onChange={(v) => set({ focusY: v })} />
            </Field>
          </div>
        )}

        <Field label="3 · Dark overlay">
          <Chips value={spec.dark.placement} onChange={(v) => setDark({ placement: v })} options={PLACEMENTS} />
          {spec.dark.placement !== "none" && (
            <div className="mt-2"><Slider value={spec.dark.strength} onChange={(v) => setDark({ strength: v })} /></div>
          )}
        </Field>

        <Field label="4 · Additional overlay">
          <div className="mb-2">
            <Chips value={spec.brand.colour} onChange={(v) => setBrand({ colour: v })}
              options={[{ id: "red", label: "Red" }, { id: "white", label: "White" }]} />
          </div>
          <Chips value={spec.brand.placement} onChange={(v) => setBrand({ placement: v })} options={BRAND_PLACEMENTS} />
          {spec.brand.placement !== "none" && (
            <div className="mt-2"><Slider value={spec.brand.strength} onChange={(v) => setBrand({ strength: v })} /></div>
          )}
        </Field>

        <Field label="5 · Logo">
          <div className="mb-2">
            <Chips value={spec.logo.style} onChange={(v) => setLogo({ style: v })}
              options={LOGO_STYLES.map((s) => ({ id: s.id, label: s.label }))} />
          </div>
          <div className="mb-2">
            <Chips value={spec.logo.event} onChange={(v) => setLogo({ event: v as EventFormat })}
              options={EVENTS.map((e) => ({ id: e, label: e }))} />
          </div>
          <Chips value={spec.logo.corner} onChange={(v) => setLogo({ corner: v })} options={CORNERS} />
        </Field>

        <Field label="6 · Text">
          <div className="space-y-3">
            <input className={inputCls} value={spec.headline} onChange={(e) => set({ headline: e.target.value })}
              placeholder="Headline" />
            <textarea className={inputCls} rows={2} value={spec.subtext} onChange={(e) => set({ subtext: e.target.value })}
              placeholder="Supporting line (optional)" />
            <div>
              <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">Placement</span>
              <div className="mb-2">
                <Chips value={spec.block} onChange={(v) => set({ block: v })}
                  options={[{ id: "top" as BlockPos, label: "Top" }, { id: "center" as BlockPos, label: "Middle" }, { id: "bottom" as BlockPos, label: "Bottom" }]} />
              </div>
              <Chips value={spec.align} onChange={(v) => set({ align: v })}
                options={[{ id: "left" as Align, label: "Left" }, { id: "center" as Align, label: "Centre" }, { id: "right" as Align, label: "Right" }]} />
            </div>
            <div>
              <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">Colour</span>
              <Chips value={spec.textColour} onChange={(v) => set({ textColour: v })}
                options={[{ id: "white" as const, label: "White" }, { id: "ink" as const, label: "Dark" }]} />
            </div>
          </div>
        </Field>

        <Field label="7 · Chip">
          <Toggle on={spec.chip.show} onChange={(v) => setChip({ show: v })} label="Show chip" />
          {spec.chip.show && (
            <div className="mt-2 space-y-2">
              <input className={inputCls} value={spec.chip.text} onChange={(e) => setChip({ text: e.target.value })}
                placeholder="Chip label" />
              <div className="flex flex-wrap gap-2">
                {CHIP_COLOURS.map((c) => (
                  <button key={c.id} type="button" title={c.label} onClick={() => setChip({ colour: c.id })}
                    className={`h-8 w-8 rounded-md border-2 ${spec.chip.colour === c.id ? "border-red" : "border-ink/15"}`}
                    style={{ background: c.bg }} />
                ))}
              </div>
              <div>
                <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">Placement</span>
                <Chips value={spec.chip.place} onChange={(v) => setChip({ place: v })}
                  options={[{ id: "text" as ChipPlace, label: "Above text" }, { id: "logo" as ChipPlace, label: "By logo" }]} />
              </div>
            </div>
          )}
        </Field>

        <Field label="8 · Carousel arrow">
          <Toggle on={spec.cta.show} onChange={(v) => setCta({ show: v })} label="Show swipe cue (bottom right)" />
          {spec.cta.show && (
            <input className={`${inputCls} mt-2`} value={spec.cta.text} onChange={(e) => setCta({ text: e.target.value })}
              placeholder="Swipe" />
          )}
        </Field>

        <Field label="Export">
          <Chips value={format} onChange={setFormat}
            options={[{ id: "PNG" as const, label: "PNG", sub: "Lossless" }, { id: "JPG" as const, label: "JPG", sub: "Smaller" }]} />
        </Field>
      </div>

      {/* ---- preview + actions ---- */}
      <div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); loadFile(e.dataTransfer.files?.[0]); }}
          className={`relative flex items-center justify-center rounded-2xl border p-3 transition ${
            dragOver ? "border-red bg-red/5" : "border-ink/10 bg-[repeating-conic-gradient(#eee_0_25%,#fff_0_50%)] bg-[length:22px_22px]"
          }`}
        >
          <canvas ref={canvasRef} className="max-h-[70vh] max-w-full rounded-md shadow-md"
            style={{ aspectRatio: `${aspect.w} / ${aspect.h}` }} />
          {!img && (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="absolute inset-3 flex flex-col items-center justify-center gap-2 rounded-md text-white/90">
              <UploadCloud className="h-8 w-8" strokeWidth={1.5} />
              <span className="text-[13.5px] font-semibold">Drop an image or click to upload</span>
              <span className="text-[11.5px] text-white/70">JPG, PNG, WebP</span>
            </button>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {onAttach && (
            <button onClick={handleAttach} disabled={busy || !img} className="btn-pill btn-red disabled:opacity-60">
              {busy ? "Working…" : attachLabel}
            </button>
          )}
          <button onClick={handleSave} disabled={busy || !img}
            className={`btn-pill ${onAttach ? "btn-dark" : "btn-red"} disabled:opacity-60`}>
            {busy ? "Saving…" : `Save ${format}`}
          </button>
          <span className="text-[12.5px] text-ink-3">{aspect.w * 2} × {aspect.h * 2}px</span>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
