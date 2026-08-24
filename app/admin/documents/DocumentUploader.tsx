"use client";

import { useRef, useState, useTransition } from "react";
import { FileUp, Loader2, Upload, X } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { Field, PrimaryButton, inputCls } from "../ui";
import { addDocument } from "./actions";
import { formatBytes } from "./format";

const BUCKET = "documents";
const MAX_BYTES = 60 * 1024 * 1024; // matches the bucket cap

/**
 * Upload a file straight from the browser to the `documents` bucket, then
 * hand the resulting URL to the addDocument server action along with the
 * title and category. Same shape as ImageUploadField: the admin's own session
 * authorises the storage write via RLS.
 */
export default function DocumentUploader({
  categories,
}: {
  /** Existing categories, offered as suggestions. */
  categories: string[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Impact reports");
  const [progress, setProgress] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pick = (f: File | undefined | null) => {
    setErrorMsg(null);
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setErrorMsg(`File too big. Keep it under ${MAX_BYTES / 1024 / 1024} MB.`);
      return;
    }
    setFile(f);
    if (!title) {
      // Sensible default: the filename without its extension.
      setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    }
  };

  const submit = () => {
    if (!file) {
      setErrorMsg("Choose a file first.");
      return;
    }
    if (!title.trim()) {
      setErrorMsg("Give it a title.");
      return;
    }
    setErrorMsg(null);
    setProgress(0);

    startTransition(async () => {
      try {
        const supabase = getBrowserSupabase();
        const ext = (file.name.split(".").pop() || "bin")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        const folder = category
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || "general";
        const base = title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 60) || "document";
        const path = `${folder}/${base}-${Date.now()}.${ext}`;

        // No progress events from this upload path; animate to ~80% so the
        // admin can see something is happening on a 20 MB PDF.
        const ticker = setInterval(() => {
          setProgress((p) => (p === null ? null : Math.min(p + 3, 80)));
        }, 120);

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "application/octet-stream",
          });

        clearInterval(ticker);

        if (uploadError) {
          setProgress(null);
          setErrorMsg(uploadError.message);
          return;
        }

        const { data: publicData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(path);

        setProgress(95);

        const fd = new FormData();
        fd.set("title", title.trim());
        fd.set("description", description.trim());
        fd.set("category", category.trim() || "General");
        fd.set("file_url", publicData.publicUrl);
        fd.set("storage_path", path);
        fd.set("file_name", file.name);
        fd.set("mime_type", file.type);
        fd.set("size_bytes", String(file.size));
        await addDocument(fd); // redirects on success
      } catch (e) {
        // Next's redirect() throws internally; let it through untouched.
        if (e && typeof e === "object" && "digest" in e) throw e;
        setProgress(null);
        setErrorMsg(e instanceof Error ? e.message : "Upload failed. Try again.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        className={
          "rounded-[var(--radius-md)] border border-dashed p-4 text-center transition-colors " +
          (dragOver
            ? "border-[#e02214] bg-[rgba(224,34,20,0.04)]"
            : "border-[rgba(20,18,16,0.18)] bg-[#f9f5ec]")
        }
      >
        {file ? (
          <div className="flex items-center justify-between gap-3 text-left">
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-medium text-[#141210]">
                {file.name}
              </div>
              <div className="text-[12px] text-[#6b6459]">
                {formatBytes(file.size)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              aria-label="Remove file"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6b6459] hover:bg-[rgba(20,18,16,0.06)]"
            >
              <X className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 py-4 text-[#6b6459]"
          >
            <FileUp className="h-6 w-6" strokeWidth={1.75} />
            <span className="text-[13px]">
              Drop a file here, or <span className="font-medium text-[#141210]">choose one</span>
            </span>
            <span className="text-[11.5px]">PDF, Word, Excel, PowerPoint, ZIP or image. Up to 60 MB.</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      <Field label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Youth Futures Lab impact report"
          className={inputCls}
        />
      </Field>
      <Field label="Category" hint="Groups the list. Pick an existing one or type a new one.">
        <input
          list="document-categories"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputCls}
        />
        <datalist id="document-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      <Field label="Description" hint="Optional. One line on what it is or who it's for.">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputCls}
        />
      </Field>

      {progress !== null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(20,18,16,0.08)]">
          <div
            className="h-full rounded-full bg-[#e02214] transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {errorMsg && (
        <p className="text-[12.5px] font-medium text-[#b91404]">{errorMsg}</p>
      )}

      <div className="flex items-center justify-between gap-3">
        <PrimaryButton type="button" onClick={submit} disabled={busy || !file}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
          ) : (
            <Upload className="h-4 w-4" strokeWidth={2.25} />
          )}
          {busy ? "Uploading…" : "Upload document"}
        </PrimaryButton>
        <p className="text-[11.5px] leading-[1.4] text-[#8a8278]">
          Links are public — keep anything confidential out.
        </p>
      </div>
    </div>
  );
}
