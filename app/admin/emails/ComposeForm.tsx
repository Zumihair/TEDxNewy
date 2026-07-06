"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Eye, Loader2, Send, Users, X } from "lucide-react";
import {
  composeEmail,
  plainToEditorHtml,
  type ComposeTemplate,
} from "@/lib/email-templates";
import { Field, SecondaryButton, inputCls } from "../ui";
import { PendingButton } from "../PendingButtons";
import RichTextEditor from "./RichTextEditor";
import { fetchAudienceEmails, sendComposedEmail } from "./actions";
import type { AudienceSummary } from "./audiences";

/**
 * The admin Compose box. Recipients can be pasted or arrive pre-filled (e.g.
 * the Talk Night "Email accepted" button passes ?to=…). A template dropdown
 * drops a ready-written subject + body in, all still editable before sending.
 *
 * Sending is unchanged — `sendComposedEmail` gives each recipient their own
 * individual email, so people in the To field never see one another.
 */
export default function ComposeForm({
  templates,
  audiences = [],
  initialTo = "",
  initialTemplateId,
}: {
  templates: ComposeTemplate[];
  audiences?: AudienceSummary[];
  initialTo?: string;
  initialTemplateId?: string;
}) {
  const initialTemplate =
    templates.find((t) => t.id === initialTemplateId) ?? null;

  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState("");
  const [templateId, setTemplateId] = useState(initialTemplate?.id ?? "");
  const [subject, setSubject] = useState(initialTemplate?.subject ?? "");
  const [eyebrow, setEyebrow] = useState(initialTemplate?.eyebrow ?? "");
  const [heading, setHeading] = useState(initialTemplate?.heading ?? "");
  const [bodyHtml, setBodyHtml] = useState(
    initialTemplate ? plainToEditorHtml(initialTemplate.body) : "",
  );
  // Bumping this remounts the editor so a chosen template reseeds its content.
  const [editorKey, setEditorKey] = useState(0);

  // Which audience chip is currently fetching its emails (for a per-chip
  // spinner). The list is pulled on demand so opening Compose stays cheap.
  const [loadingAudienceId, setLoadingAudienceId] = useState<string | null>(
    null,
  );
  const [, startTransition] = useTransition();

  // Preview modal — renders the real branded email from the current fields,
  // using the same composeEmail() builder the send action uses, so what you
  // see is exactly what recipients get.
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(
    null,
  );

  const openPreview = () => {
    const built = composeEmail({
      subject: subject.trim() || "(no subject)",
      heading,
      eyebrow,
      bodyHtml: bodyHtml.trim() || "<p>(your message will appear here)</p>",
    });
    setPreview({ subject: built.subject, html: built.html ?? "" });
  };

  // Close the modal on Escape while it's open.
  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview]);

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (!t) return; // "Start from scratch" — leave fields as they are
    setSubject(t.subject);
    setEyebrow(t.eyebrow ?? "");
    setHeading(t.heading ?? "");
    setBodyHtml(plainToEditorHtml(t.body));
    setEditorKey((k) => k + 1);
  };

  // Same split the send action uses, so the count here matches what sends.
  const parseEmails = (raw: string) =>
    raw
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

  const recipientCount = useMemo(
    () => new Set(parseEmails(to)).size,
    [to],
  );

  // Fetch an audience's addresses on demand and merge them into the To field,
  // deduped, keeping any the admin already typed. The field stays fully
  // editable afterwards.
  const addAudience = (audience: AudienceSummary) => {
    setLoadingAudienceId(audience.id);
    startTransition(async () => {
      try {
        const emails = await fetchAudienceEmails(audience.id);
        setTo((current) => {
          const merged = new Set(parseEmails(current));
          for (const e of emails) merged.add(e);
          return [...merged].join(", ");
        });
      } finally {
        setLoadingAudienceId(null);
      }
    });
  };

  return (
    <form
      action={sendComposedEmail}
      className="grid gap-5 rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-6 md:p-7"
    >
      {templates.length > 0 && (
        <Field
          label="Template"
          htmlFor="template"
          hint="Optional. Drops in a ready-written message you can then edit."
        >
          <select
            id="template"
            value={templateId}
            onChange={(e) => applyTemplate(e.target.value)}
            className={inputCls}
          >
            <option value="">Start from scratch</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      {audiences.length > 0 && (
        <Field
          label="Audiences"
          hint="Click to add a saved list to the To field. You can still edit it before sending."
        >
          <div className="flex flex-wrap items-center gap-2">
            {audiences.map((a) => {
              const loading = loadingAudienceId === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => addAudience(a)}
                  disabled={loading}
                  title={a.hint}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(20,18,16,0.12)] bg-[rgba(20,18,16,0.03)] px-3 py-1.5 text-[12.5px] font-medium text-[#141210] transition-colors hover:border-[rgba(20,18,16,0.22)] hover:bg-[rgba(20,18,16,0.07)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin text-[#6b6459]"
                      strokeWidth={2.25}
                    />
                  ) : (
                    <Users
                      className="h-3.5 w-3.5 text-[#6b6459]"
                      strokeWidth={2.25}
                    />
                  )}
                  {a.label}
                  <span className="font-mono text-[10.5px] text-[#6b6459]">
                    {a.count}
                  </span>
                </button>
              );
            })}
            {to.trim() && (
              <button
                type="button"
                onClick={() => setTo("")}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-[#6b6459] transition-colors hover:text-[#e02214]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                Clear
              </button>
            )}
          </div>
        </Field>
      )}

      <Field
        label="To"
        htmlFor="to"
        hint="One or more emails, comma or space separated. Each person gets their own separate email — they can't see one another."
      >
        <input
          id="to"
          name="to"
          type="text"
          required
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="someone@example.com"
          className={inputCls}
        />
        {recipientCount > 0 && (
          <p className="mt-1.5 text-[12px] text-[#6b6459]">
            {recipientCount} recipient{recipientCount === 1 ? "" : "s"}, each
            gets their own separate email.
          </p>
        )}
      </Field>

      <Field
        label="Cc"
        htmlFor="cc"
        hint="Optional. Cc yourself or a colleague to receive one copy of this message."
      >
        <input
          id="cc"
          name="cc"
          type="text"
          value={cc}
          onChange={(e) => setCc(e.target.value)}
          placeholder="you@tedxnewy.com.au"
          className={inputCls}
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Subject" htmlFor="subject">
          <input
            id="subject"
            name="subject"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="A note from TEDxNewy"
            className={inputCls}
          />
        </Field>
        <Field
          label="Eyebrow"
          htmlFor="eyebrow"
          hint="Small label above the heading (optional)."
        >
          <input
            id="eyebrow"
            name="eyebrow"
            type="text"
            value={eyebrow}
            onChange={(e) => setEyebrow(e.target.value)}
            placeholder="A note from TEDxNewy"
            className={inputCls}
          />
        </Field>
      </div>

      <Field
        label="Heading"
        htmlFor="heading"
        hint="Large headline in the email (optional — defaults to the subject)."
      >
        <input
          id="heading"
          name="heading"
          type="text"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder="Thanks for being part of it"
          className={inputCls}
        />
      </Field>

      <Field
        label="Message"
        hint="Select text to format it. Pasted text comes in plain, without its original styling."
      >
        <RichTextEditor
          key={editorKey}
          name="bodyHtml"
          initialHtml={bodyHtml}
          onChange={setBodyHtml}
          placeholder="Write your message here. Select text and use the toolbar to format it."
        />
      </Field>

      <div className="flex flex-wrap items-center gap-2.5">
        <PendingButton icon={<Send className="h-4 w-4" strokeWidth={2.25} />}>
          Send email
        </PendingButton>
        <SecondaryButton type="button" onClick={openPreview}>
          <Eye className="h-4 w-4" strokeWidth={2.25} />
          Preview
        </SecondaryButton>
      </div>

      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Email preview"
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 md:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="my-auto w-full max-w-[640px] overflow-hidden rounded-[var(--radius-md)] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[rgba(20,18,16,0.10)] px-5 py-3.5">
              <div className="min-w-0">
                <div
                  className="font-mono text-[9.5px] font-semibold uppercase text-[#6b6459]"
                  style={{ letterSpacing: "0.2em" }}
                >
                  Subject
                </div>
                <div className="truncate text-[13px] font-medium text-[#141210]">
                  {preview.subject}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                aria-label="Close preview"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.06)] hover:text-[#141210]"
              >
                <X className="h-4 w-4" strokeWidth={2.25} />
              </button>
            </div>
            <iframe
              title="Email preview"
              srcDoc={preview.html}
              className="block h-[70vh] w-full border-0 bg-white"
            />
          </div>
        </div>
      )}
    </form>
  );
}
