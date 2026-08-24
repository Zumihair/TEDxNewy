"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Newspaper, Paperclip, Send, Upload, X } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { Card, Field, PrimaryButton, SecondaryButton, inputCls } from "../ui";
import PreviewModal from "../_blocks/PreviewModal";
import {
  MEDIA_RELEASE_PDF_URL,
  MEDIA_RELEASE_PDF_FILENAME,
  MEDIA_STATUSES,
  type MediaContact,
} from "@/lib/media-constants";
import { previewMediaRelease, sendMediaRelease } from "./actions";

const BUCKET = "documents";
const MAX_BYTES = 60 * 1024 * 1024;

const STATUS_CHIP: Record<string, string> = {
  prospect: "bg-[#f1ede4] text-[#6b6459]",
  pitched: "bg-[rgba(23,96,122,0.1)] text-[#17607a]",
  responded: "bg-[rgba(200,132,26,0.14)] text-[#8a5a12]",
  covered: "bg-[rgba(47,107,65,0.12)] text-[#2f6b41]",
  declined: "bg-[rgba(224,34,20,0.08)] text-[#b91404]",
};

const dateFmt = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  timeZone: "Australia/Sydney",
});

/**
 * The New release composer: subject/body (controlled, so Preview always
 * shows exactly what's in the boxes right now — including whichever
 * signature "Sign as" last set), an attachment (upload one, or one click to
 * reuse the branded release PDF), and the send table. A fresh instance is
 * mounted per sender (see `key={sender}` in page.tsx) so switching Jake/Will
 * always starts from that signature's own draft rather than an edited one.
 */
export default function ReleaseComposer({
  subject: initialSubject,
  body: initialBody,
  prospectsCount,
  contacts,
}: {
  subject: string;
  body: string;
  prospectsCount: number;
  contacts: MediaContact[];
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const useBrandedPdf = () => {
    setAttachmentUrl(MEDIA_RELEASE_PDF_URL);
    setAttachmentName(MEDIA_RELEASE_PDF_FILENAME);
  };

  const upload = (file: File | undefined | null) => {
    if (!file) return;
    setUploadError(null);
    if (file.size > MAX_BYTES) {
      setUploadError(`File too big. Keep it under ${MAX_BYTES / 1024 / 1024} MB.`);
      return;
    }
    setUploading(true);
    startTransition(async () => {
      try {
        const supabase = getBrowserSupabase();
        const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `media/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]+/g, "-")}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "application/octet-stream",
        });
        if (error) {
          setUploadError(error.message);
          return;
        }
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        setAttachmentUrl(data.publicUrl);
        setAttachmentName(file.name || `attachment.${ext}`);
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Upload failed. Try again.");
      } finally {
        setUploading(false);
      }
    });
  };

  return (
    <form action={sendMediaRelease}>
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(31,74,92,0.08)] text-[#1f4a5c]">
              <Newspaper className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <div className="font-sans text-[17px] font-medium text-[#141210]">
                The Signal release
              </div>
              <div className="text-[12.5px] text-[#6b6459]">
                Edit anything below, then send per contact or to all prospects at once.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PreviewModal getHtml={(scheme) => previewMediaRelease({ subject, body }, scheme)} />
            <PrimaryButton type="submit" name="all" value="1">
              <Send className="h-3.5 w-3.5" strokeWidth={2.25} />
              Send to all prospects ({prospectsCount})
            </PrimaryButton>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <Field label="Subject">
            <input
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Pitch + release">
            <textarea
              name="body"
              rows={18}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={`${inputCls} font-mono text-[13px] leading-[1.6]`}
            />
          </Field>

          <div>
            <span
              className="block font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
              style={{ letterSpacing: "0.24em" }}
            >
              Attachment
            </span>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {attachmentUrl ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#f1ede4] py-1.5 pl-3.5 pr-2 text-[12.5px] text-[#2a2521]">
                  <Paperclip className="h-3.5 w-3.5 text-[#6b6459]" strokeWidth={2.25} />
                  <span className="max-w-[220px] truncate">{attachmentName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentUrl("");
                      setAttachmentName("");
                    }}
                    aria-label="Remove attachment"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[#8a8278] hover:bg-[rgba(20,18,16,0.08)] hover:text-[#141210]"
                  >
                    <X className="h-3 w-3" strokeWidth={2.5} />
                  </button>
                </span>
              ) : (
                <>
                  <SecondaryButton type="button" onClick={useBrandedPdf}>
                    <Paperclip className="h-3.5 w-3.5" strokeWidth={2.25} />
                    Use branded release PDF
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
                    ) : (
                      <Upload className="h-3.5 w-3.5" strokeWidth={2.25} />
                    )}
                    {uploading ? "Uploading…" : "Upload a file"}
                  </SecondaryButton>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      upload(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </>
              )}
            </div>
            {uploadError && (
              <p className="mt-1.5 text-[12px] font-medium text-[#b91404]">{uploadError}</p>
            )}
            <input type="hidden" name="attachment_url" value={attachmentUrl} />
            <input type="hidden" name="attachment_name" value={attachmentName} />
          </div>
        </div>

        {/* Contacts: rows submit the same form with their contactId. */}
        <div className="mt-6 border-t border-[rgba(20,18,16,0.08)] pt-4">
          <div className="mb-2 font-sans text-[15px] font-medium text-[#141210]">
            Send individually
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-[rgba(20,18,16,0.1)] font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
                  <th className="py-2 pr-4 font-semibold">Contact</th>
                  <th className="py-2 pr-4 font-semibold">Outlet</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#8a8278]">
                      No contacts yet. Add some on the Contacts tab.
                    </td>
                  </tr>
                )}
                {contacts.map((c) => (
                  <tr key={c.id} className="border-b border-[rgba(20,18,16,0.06)] last:border-0">
                    <td className="py-2.5 pr-4">
                      <div className="font-medium text-[#141210]">{c.fullName}</div>
                      {!c.email && <div className="text-[12px] text-[#8a8278]">no email yet</div>}
                    </td>
                    <td className="py-2.5 pr-4 text-[#2a2521]">{c.outlet}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${STATUS_CHIP[c.status]}`}
                      >
                        {MEDIA_STATUSES.find((s) => s.id === c.status)?.label ?? c.status}
                      </span>
                      {c.lastContactedAt && (
                        <span className="ml-2 text-[11.5px] text-[#8a8278]">
                          {dateFmt.format(new Date(c.lastContactedAt))}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      {c.email && (
                        <SecondaryButton type="submit" name="contactId" value={c.id}>
                          <Send className="h-3 w-3" strokeWidth={2.25} />
                          Send
                        </SecondaryButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </form>
  );
}
