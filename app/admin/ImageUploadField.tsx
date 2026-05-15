"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { Field, inputCls } from "./ui";

type Props = {
  /** Form field name — the resolved URL is posted under this name. */
  name: string;
  /** Field label shown in the UI. */
  label: string;
  /** Existing image URL (edit mode) or empty string. */
  defaultValue?: string;
  /** Storage sub-folder, e.g. "speakers", "team", "posts". */
  folder: string;
  /**
   * Identifier woven into the filename to keep uploads tidy.
   * Usually the row's slug. Falls back to a random id.
   */
  baseName?: string;
  hint?: string;
  error?: string;
  /** Preview aspect — "4:5" for portraits, "16:9" for hero images. */
  aspect?: "4/5" | "16/9" | "1/1";
  /** Fires whenever the resolved URL changes — useful for side previews. */
  onChange?: (url: string) => void;
};

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — matches storage bucket cap

export default function ImageUploadField({
  name,
  label,
  defaultValue = "",
  folder,
  baseName,
  hint,
  error,
  aspect = "4/5",
  onChange,
}: Props) {
  const [value, setValueRaw] = useState<string>(defaultValue);
  const setValue = (next: string) => {
    setValueRaw(next);
    onChange?.(next);
  };
  const [showUrlPaste, setShowUrlPaste] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClass =
    aspect === "16/9"
      ? "aspect-video"
      : aspect === "1/1"
        ? "aspect-square"
        : "aspect-[4/5]";

  const handleUpload = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Pick an image file (PNG, JPG, WebP, etc.).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrorMsg(`File too big — keep it under ${MAX_BYTES / 1024 / 1024}MB.`);
      return;
    }
    setProgress(0);

    startTransition(async () => {
      try {
        const supabase = getBrowserSupabase();
        // Per Supabase, the user must be authenticated; RLS checks they're
        // also in cms_admins via is_cms_admin(). Storage will reject otherwise.
        const ext = (file.name.split(".").pop() || "bin")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        const slugLike = (baseName || crypto.randomUUID()).replace(/[^a-z0-9-]/gi, "-");
        const path = `${folder}/${slugLike}-${Date.now()}.${ext}`;

        // Show a little progress while uploading. The Supabase upload doesn't
        // emit progress events for this path, so we just animate to ~75%.
        const ticker = setInterval(() => {
          setProgress((p) => (p === null ? null : Math.min(p + 7, 75)));
        }, 80);

        const { error: uploadError } = await supabase.storage
          .from("cms-uploads")
          .upload(path, file, {
            cacheControl: "31536000",
            upsert: false,
            contentType: file.type,
          });

        clearInterval(ticker);

        if (uploadError) {
          setProgress(null);
          setErrorMsg(uploadError.message);
          return;
        }

        const { data: publicData } = supabase.storage
          .from("cms-uploads")
          .getPublicUrl(path);

        setProgress(100);
        setValue(publicData.publicUrl);
        setTimeout(() => setProgress(null), 350);
      } catch (e) {
        setProgress(null);
        setErrorMsg(
          e instanceof Error ? e.message : "Upload failed — try again.",
        );
      }
    });
  };

  const onPick = () => fileInputRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // reset so picking the same file twice still triggers onChange
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const clear = () => {
    setValue("");
    setErrorMsg(null);
  };

  return (
    <Field label={label} hint={hint} error={error ?? errorMsg ?? undefined}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
        onChange={onFileChange}
        className="hidden"
      />
      {/* The actual posted value */}
      <input type="hidden" name={name} value={value} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        {/* Preview / drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={onPick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onPick();
            }
          }}
          className={
            `relative ${aspectClass} w-32 shrink-0 cursor-pointer overflow-hidden rounded-[var(--radius-md)] border bg-[#1a1714] transition-all ` +
            (dragOver
              ? "border-[#e02214] ring-2 ring-[#e02214]/30"
              : "border-[rgba(20,18,16,0.15)] hover:border-[#e02214]/50")
          }
        >
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.opacity = "0.15";
                }}
              />
              {progress === null && (
                <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/65 to-transparent p-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clear();
                    }}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-[#e02214]"
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50">
              <ImagePlus className="h-5 w-5" strokeWidth={1.75} />
              <span className="text-[10.5px] font-medium">Add image</span>
            </div>
          )}
          {/* Upload progress */}
          {progress !== null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-white">
              <Loader2
                className="h-5 w-5 animate-spin"
                strokeWidth={2}
              />
              <span className="font-mono text-[10.5px]">
                {progress < 100 ? "Uploading…" : "Done"}
              </span>
              <div className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[#e02214] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right column — actions */}
        <div className="flex flex-1 flex-col justify-between gap-3 rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPick}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#141210] px-3.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#000]"
            >
              <Upload className="h-3.5 w-3.5" strokeWidth={2.25} />
              {value ? "Replace" : "Upload image"}
            </button>
            <button
              type="button"
              onClick={() => setShowUrlPaste((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3.5 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
            >
              {showUrlPaste ? "Hide URL field" : "Paste URL instead"}
            </button>
          </div>

          {showUrlPaste && (
            <input
              type="url"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="https://… or /images/…"
              className={`${inputCls} py-2 text-[13px]`}
            />
          )}

          <p className="text-[12px] leading-[1.55] text-[#6b6459]">
            Drag &amp; drop an image onto the preview, click to pick, or paste a
            URL. PNG / JPG / WebP up to {MAX_BYTES / 1024 / 1024}MB.
          </p>
        </div>
      </div>
    </Field>
  );
}
