"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { Field, inputCls } from "../ui";
import { useToast } from "../Toaster";
import { addSponsorFile, deleteSponsorFile } from "./actions";

export type SponsorFile = {
  id: string;
  sponsor_id: string;
  name: string;
  kind: string;
  file_url: string;
  size_bytes: number | null;
  created_at: string;
};

const KINDS = [
  { id: "agreement", label: "Agreement" },
  { id: "logo", label: "Logo" },
  { id: "invoice", label: "Invoice" },
  { id: "other", label: "Other" },
];
const MAX_BYTES = 60 * 1024 * 1024;

const size = (n: number | null) =>
  n == null ? "" : n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

/** The files shelf for one sponsor: agreements, logo packs and anything else worth keeping. */
export default function SponsorFiles({
  sponsorId,
  files,
  ready,
}: {
  sponsorId: string;
  files: SponsorFile[];
  ready: boolean;
}) {
  const toast = useToast();
  const [kind, setKind] = useState("agreement");
  const [busy, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  if (!ready) {
    return (
      <p className="adm-card__text">
        Files need one database step first: run the sponsor files SQL (20261018_sponsor_roster_files.sql) in Supabase,
        then this opens up.
      </p>
    );
  }

  const upload = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error("That file is over 60 MB.");
      return;
    }
    start(async () => {
      try {
        const supabase = getBrowserSupabase();
        const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
        const base = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "file";
        const path = `sponsors/${sponsorId}/${base}-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("documents").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "application/octet-stream",
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        const { data } = supabase.storage.from("documents").getPublicUrl(path);
        const fd = new FormData();
        fd.set("sponsor_id", sponsorId);
        fd.set("name", file.name);
        fd.set("kind", kind);
        fd.set("file_url", data.publicUrl);
        fd.set("storage_path", path);
        fd.set("size_bytes", String(file.size));
        const res = await addSponsorFile(fd);
        if (res.ok) toast.success("File added.");
        else toast.error(res.error ?? "Could not save the file.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed.");
      }
    });
  };

  const remove = (id: string) =>
    start(async () => {
      const fd = new FormData();
      fd.set("id", id);
      const res = await deleteSponsorFile(fd);
      if (res.ok) toast.success("File removed.");
      else toast.error(res.error ?? "Could not remove it.");
    });

  return (
    <div className="space-y-4">
      <div className="adm-files__add">
        <Field label="Type">
          <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </Field>
        <button type="button" className="tx-btn tx-btn--accent adm-write" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} /> : <Upload className="h-4 w-4" strokeWidth={2.25} />}
          {busy ? "Working" : "Add a file"}
        </button>
        <input
          ref={input}
          type="file"
          className="hidden"
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {files.length === 0 ? (
        <p className="adm-empty">No files yet. Add the agreement, logo pack or anything else worth keeping.</p>
      ) : (
        <ul className="adm-alist">
          {files.map((f) => (
            <li key={f.id} className="adm-crow">
              <a href={f.file_url} target="_blank" rel="noreferrer" className="adm-crow__main">
                <span className="adm-crow__title">
                  <FileText className="mr-2 inline h-4 w-4 align-[-3px]" strokeWidth={2} />
                  {f.name}
                </span>
                <span className="adm-crow__meta">
                  {KINDS.find((k) => k.id === f.kind)?.label ?? "Other"}
                  {f.size_bytes ? ` · ${size(f.size_bytes)}` : ""}
                </span>
              </a>
              <button type="button" className="tx-iconbtn" aria-label={`Remove ${f.name}`} disabled={busy} onClick={() => remove(f.id)}>
                <Trash2 className="h-4 w-4" strokeWidth={2.25} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="adm-card__text">Links are public to anyone who has them. Keep anything confidential out.</p>
    </div>
  );
}
