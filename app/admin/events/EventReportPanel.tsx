"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileUp, Loader2, Trash2 } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { inputCls } from "../ui";
import { useToast } from "../Toaster";
import { clearEventReport, setEventReport } from "./reportActions";

type Doc = { id: string; title: string; file_url: string };

/**
 * Attach whatever style of report suits the event: upload a file, pick one from the Documents library, or
 * paste a link. One report per event; attaching another replaces it.
 */
export default function EventReportPanel({
  eventId,
  eventSlug,
  current,
  docs,
}: {
  eventId: string;
  eventSlug: string;
  current: { url: string; title: string } | null;
  docs: Doc[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState(current?.title ?? "");
  const [link, setLink] = useState("");
  const [busy, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = (url: string, name: string) =>
    start(async () => {
      const err = await setEventReport(eventId, name, url);
      if (err) toast.error(err);
      else {
        toast.success("Report attached.");
        setLink("");
        router.refresh();
      }
    });

  const upload = async (file: File | undefined | null) => {
    if (!file) return;
    if (file.size > 60 * 1024 * 1024) return toast.error("File too big. Keep it under 60 MB.");
    setUploading(true);
    try {
      const supabase = getBrowserSupabase();
      const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `event-reports/${eventSlug}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("documents").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });
      if (error) return toast.error(error.message);
      const { data } = supabase.storage.from("documents").getPublicUrl(path);
      save(data.publicUrl, title || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-5">
      {current ? (
        <div className="adm-docrow">
          <span className="adm-docrow__badge">REPORT</span>
          <span className="adm-docrow__title">{current.title}</span>
          <a href={current.url} target="_blank" rel="noopener noreferrer" className="adm-link">
            Open <ExternalLink className="inline h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            className="adm-write adm-linkbtn"
            disabled={busy}
            onClick={() =>
              start(async () => {
                const err = await clearEventReport(eventId);
                if (err) toast.error(err);
                else router.refresh();
              })
            }
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove report</span>
          </button>
        </div>
      ) : (
        <p className="adm-card__text">No report attached yet.</p>
      )}

      <div className="adm-write space-y-3">
        <label className="tx-field">
          <span className="tx-field__label">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Impact report 2026" className={inputCls} />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" className="sr-only" id={`rep-${eventId}`} onChange={(e) => upload(e.target.files?.[0])} />
          <label htmlFor={`rep-${eventId}`} className="tx-btn tx-btn--secondary tx-btn--sm tx-btn--auto" style={{ cursor: "pointer" }}>
            {uploading || busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            Upload a file
          </label>
          {docs.length > 0 && (
            <select
              className={inputCls}
              style={{ maxWidth: 280 }}
              value=""
              onChange={(e) => {
                const d = docs.find((x) => x.id === e.target.value);
                if (d) save(d.file_url, title || d.title);
              }}
            >
              <option value="">Pick from Documents</option>
              {docs.map((d) => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Or paste a link, https://" className={inputCls} style={{ maxWidth: 360 }} />
          <button type="button" className="tx-btn tx-btn--accent tx-btn--sm tx-btn--auto" disabled={busy || !link.trim()} onClick={() => save(link, title || "Report")}>
            Attach link
          </button>
        </div>
      </div>
    </div>
  );
}
