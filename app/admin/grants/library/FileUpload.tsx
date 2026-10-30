"use client";

import { useRef, useState } from "react";
import { Loader2, Paperclip, Upload, X } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { useToast } from "../../Toaster";
import { LIBRARY_BUCKET } from "./shared";

const MAX_BYTES = 60 * 1024 * 1024; // matches the bucket cap

export type StoredFile = { url: string; name: string; path: string } | null;

/**
 * Upload a letter or evidence file straight from the browser to the public
 * `documents` bucket, under the admin's own session (the same route the
 * Documents library and image uploads take), then hand the result to the
 * surrounding <form> as three hidden inputs. Nothing is saved until the form is.
 */
export default function FileUpload({
  folder,
  label,
  hint,
  initial,
}: {
  folder: "letters" | "files";
  label: string;
  hint?: string;
  initial: StoredFile;
}) {
  const [file, setFile] = useState<StoredFile>(initial);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();

  async function pick(f: File | undefined | null) {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast.error(`That file is too big. Keep it under ${MAX_BYTES / 1024 / 1024} MB.`);
      return;
    }
    setBusy(true);
    try {
      const supabase = getBrowserSupabase();
      const ext = (f.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
      const base =
        f.name
          .replace(/\.[^.]+$/, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 60) || "file";
      const path = `grants/${folder}/${base}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(LIBRARY_BUCKET).upload(path, f, {
        cacheControl: "3600",
        upsert: false,
        contentType: f.type || "application/octet-stream",
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      const { data } = supabase.storage.from(LIBRARY_BUCKET).getPublicUrl(path);
      setFile({ url: data.publicUrl, name: f.name, path });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="tx-field">
      <span className="tx-field__label">{label}</span>
      <input type="hidden" name="file_url" value={file?.url ?? ""} />
      <input type="hidden" name="file_name" value={file?.name ?? ""} />
      <input type="hidden" name="storage_path" value={file?.path ?? ""} />
      <div className="adm-lib__upload">
        {file && (
          <span className="adm-lib__attached">
            <Paperclip className="h-3.5 w-3.5" strokeWidth={2.25} />
            <a href={file.url} target="_blank" rel="noreferrer">
              {file.name}
            </a>
            <button type="button" onClick={() => setFile(null)} aria-label="Remove this file" title="Remove this file">
              <X className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          </span>
        )}
        <button
          type="button"
          className="tx-btn tx-btn--secondary tx-btn--sm tx-btn--auto"
          onClick={() => input.current?.click()}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
          ) : (
            <Upload className="h-4 w-4" strokeWidth={2.25} />
          )}
          {file ? "Replace file" : "Upload a file"}
        </button>
        <input
          ref={input}
          type="file"
          hidden
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>
      {hint && <span className="adm-card__text">{hint}</span>}
    </div>
  );
}
