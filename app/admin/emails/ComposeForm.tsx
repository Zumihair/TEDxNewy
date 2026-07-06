"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Send, Users, X } from "lucide-react";
import { plainToEditorHtml, type ComposeTemplate } from "@/lib/email-templates";
import { type NewsletterBlock } from "@/lib/newsletter-blocks";
import BlockCanvas from "../_blocks/BlockCanvas";
import PreviewModal from "../_blocks/PreviewModal";
import { useConfirm } from "../ConfirmDialog";
import { Field, inputCls } from "../ui";
import { PendingButton } from "../PendingButtons";
import {
  fetchAudienceEmails,
  previewCompose,
  sendComposedEmail,
} from "./actions";
import type { AudienceSummary } from "./audiences";

/**
 * The admin Compose box. Recipients can be pasted or arrive pre-filled (e.g.
 * the Talk Night "Email accepted" button passes ?to=…). A template dropdown
 * drops a ready-written subject + message in, all still editable before
 * sending.
 *
 * The message is built with the same block builder as the newsletter, so one
 * editor drives both. Sending is unchanged: `sendComposedEmail` gives each
 * recipient their own individual email, so people in the To field never see
 * one another.
 */

/** A stable id for a new block (matches BlockCanvas's own fallback). */
function newBlockId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `b_${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/** Turn a Compose template into blocks: an optional header + a text block. */
function templateToBlocks(t: ComposeTemplate): NewsletterBlock[] {
  const blocks: NewsletterBlock[] = [];
  if (t.heading) {
    blocks.push({ id: newBlockId(), type: "header", text: t.heading, size: "lg" });
  }
  blocks.push({ id: newBlockId(), type: "text", html: plainToEditorHtml(t.body) });
  return blocks;
}

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
  const [blocks, setBlocks] = useState<NewsletterBlock[]>(() =>
    initialTemplate ? templateToBlocks(initialTemplate) : [],
  );

  const { confirm, dialogs } = useConfirm();

  // Which audience chip is currently fetching its emails (for a per-chip
  // spinner). The list is pulled on demand so opening Compose stays cheap.
  const [loadingAudienceId, setLoadingAudienceId] = useState<string | null>(
    null,
  );
  const [, startTransition] = useTransition();

  const applyTemplate = async (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) {
      // "Start from scratch" — leave the current content as it is.
      setTemplateId("");
      return;
    }
    // Confirm before replacing anything the admin has already put in.
    if (blocks.length > 0 || subject.trim().length > 0) {
      const ok = await confirm({
        title: "Replace the current message?",
        body: `Load "${t.label}"? This replaces the current subject and message.`,
        confirmLabel: "Replace",
        tone: "neutral",
      });
      // On cancel, leave everything (the select reverts to its old value since
      // it is controlled by templateId, which we have not changed).
      if (!ok) return;
    }
    setTemplateId(id);
    setSubject(t.subject);
    setBlocks(templateToBlocks(t));
  };

  // Same split the send action uses, so the count here matches what sends.
  const parseEmails = (raw: string) =>
    raw
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

  const recipientCount = useMemo(() => new Set(parseEmails(to)).size, [to]);

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

  const canSend = subject.trim().length > 0 && blocks.length > 0;

  return (
    <form
      action={sendComposedEmail}
      className="grid gap-5 rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-6 md:p-7"
    >
      {dialogs}

      {/* Blocks are serialised into a hidden input so the server action, which
          runs as a <form action>, receives them alongside To/Cc/Subject. */}
      <input type="hidden" name="blocks" value={JSON.stringify(blocks)} />

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
        label="Message"
        hint="Build the message from blocks: image, text, button and more. It is wrapped in the branded TEDxNewy shell."
      >
        <BlockCanvas blocks={blocks} onChange={setBlocks} />
      </Field>

      <div className="flex flex-wrap items-center gap-2.5">
        <PendingButton
          icon={<Send className="h-4 w-4" strokeWidth={2.25} />}
          disabled={!canSend}
        >
          Send email
        </PendingButton>
        <PreviewModal
          getHtml={() =>
            previewCompose({
              subject: subject.trim() || "(no subject)",
              blocks,
            })
          }
          disabled={!canSend}
        />
      </div>
    </form>
  );
}
