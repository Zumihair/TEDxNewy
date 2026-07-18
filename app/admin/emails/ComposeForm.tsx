"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { BookmarkPlus, Loader2, Send, Trash2, Users, X } from "lucide-react";
import { plainToEditorHtml, type ComposeTemplate } from "@/lib/email-templates";
import { type NewsletterBlock } from "@/lib/newsletter-blocks";
import BlockCanvas from "../_blocks/BlockCanvas";
import PreviewModal from "../_blocks/PreviewModal";
import { useConfirm } from "../ConfirmDialog";
import { Field, inputCls } from "../ui";
import { PendingButton } from "../PendingButtons";
import {
  deleteComposeTemplate,
  fetchAudienceEmails,
  previewCompose,
  saveComposeTemplate,
  sendComposedEmail,
} from "./actions";
import type { AudienceSummary } from "./audiences";
import type { SavedTemplate } from "./templates";

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
  savedTemplates = [],
  audiences = [],
  initialTo = "",
  initialTemplateId,
}: {
  templates: ComposeTemplate[];
  savedTemplates?: SavedTemplate[];
  audiences?: AudienceSummary[];
  initialTo?: string;
  initialTemplateId?: string;
}) {
  const initialTemplate =
    templates.find((t) => t.id === initialTemplateId) ?? null;

  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState("");
  const [bccMode, setBccMode] = useState(false);
  const [templateId, setTemplateId] = useState(initialTemplate?.id ?? "");
  const [subject, setSubject] = useState(initialTemplate?.subject ?? "");
  const [blocks, setBlocks] = useState<NewsletterBlock[]>(() =>
    initialTemplate ? templateToBlocks(initialTemplate) : [],
  );

  // The admin's own saved templates, held in state so a save/delete updates the
  // dropdown without a page reload.
  const [saved, setSaved] = useState<SavedTemplate[]>(savedTemplates);
  const [templateMsg, setTemplateMsg] = useState<string | null>(null);

  const { confirm, prompt, dialogs } = useConfirm();

  const selectedSaved = saved.find((t) => t.id === templateId) ?? null;

  // Which audience chip is currently fetching its emails (for a per-chip
  // spinner). The list is pulled on demand so opening Compose stays cheap.
  const [loadingAudienceId, setLoadingAudienceId] = useState<string | null>(
    null,
  );
  const [, startTransition] = useTransition();

  const applyTemplate = async (id: string) => {
    const savedT = saved.find((x) => x.id === id);
    const codeT = templates.find((x) => x.id === id);
    if (!savedT && !codeT) {
      // "Start from scratch" — leave the current content as it is.
      setTemplateId("");
      return;
    }
    // Confirm before replacing anything the admin has already put in.
    if (blocks.length > 0 || subject.trim().length > 0) {
      const label = savedT?.label ?? codeT?.label ?? "";
      const ok = await confirm({
        title: "Replace the current message?",
        body: `Load "${label}"? This replaces the current subject and message.`,
        confirmLabel: "Replace",
        tone: "neutral",
      });
      // On cancel, leave everything (the select reverts to its old value since
      // it is controlled by templateId, which we have not changed).
      if (!ok) return;
    }
    setTemplateMsg(null);
    setTemplateId(id);
    if (savedT) {
      // Saved templates already carry the exact blocks the composer uses.
      setSubject(savedT.subject);
      setBlocks(savedT.blocks);
    } else if (codeT) {
      setSubject(codeT.subject);
      setBlocks(templateToBlocks(codeT));
    }
  };

  // Save the current subject + message as a reusable template.
  const onSaveTemplate = async () => {
    if (blocks.length === 0) {
      setTemplateMsg("Add a message before saving a template.");
      return;
    }
    const name = await prompt({
      title: "Save as template",
      body: "Save this subject and message to reuse from the template list later.",
      label: "Template name",
      placeholder: "e.g. Talk Night reminder",
      defaultValue: subject.trim(),
      confirmLabel: "Save template",
    });
    if (!name) return;
    const res = await saveComposeTemplate({ label: name, subject, blocks });
    if (res.ok && res.template) {
      const t = res.template;
      setSaved((cur) => [t, ...cur.filter((x) => x.id !== t.id)]);
      setTemplateId(t.id);
      setTemplateMsg(`Saved "${t.label}".`);
    } else {
      setTemplateMsg(res.error ?? "Couldn't save the template.");
    }
  };

  // Delete the currently selected saved template.
  const onDeleteTemplate = async () => {
    if (!selectedSaved) return;
    const t = selectedSaved;
    const ok = await confirm({
      title: `Delete "${t.label}"?`,
      body: "This removes the saved template. Your current message stays in the editor.",
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    const res = await deleteComposeTemplate(t.id);
    if (res.ok) {
      setSaved((cur) => cur.filter((x) => x.id !== t.id));
      setTemplateId("");
      setTemplateMsg(`Deleted "${t.label}".`);
    } else {
      setTemplateMsg("Couldn't delete the template.");
    }
  };

  // Same split the send action uses, so the count here matches what sends.
  const parseEmails = (raw: string) =>
    raw
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

  const recipientCount = useMemo(() => new Set(parseEmails(to)).size, [to]);

  // Confirm before the send actually fires. The form runs a server action, so
  // to keep the PendingButton's pending state we don't send from the dialog:
  // we cancel the first submit, ask, and on OK re-submit with a bypass flag so
  // the second pass runs the action normally.
  const bypassConfirm = useRef(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (bypassConfirm.current) {
      bypassConfirm.current = false;
      return; // second pass: let the real submit through to the server action
    }
    e.preventDefault();
    const form = e.currentTarget;
    const n = new Set(parseEmails(to)).size;
    if (n === 0 || !canSend) return; // required fields handle the empty cases
    const ok = await confirm({
      title: `Send to ${n} ${n === 1 ? "person" : "people"}?`,
      body: (
        <>
          This sends <strong>{subject.trim() || "(no subject)"}</strong> to{" "}
          {n} {n === 1 ? "recipient" : "recipients"}
          {cc.trim() ? ", plus the Cc" : ""}.{" "}
          {bccMode
            ? "It goes out as one email with everyone hidden in Bcc."
            : "Each gets their own separate email."}{" "}
          This can&rsquo;t be undone.
        </>
      ),
      confirmLabel: `Send to ${n}`,
      tone: "neutral",
    });
    if (ok) {
      bypassConfirm.current = true;
      form.requestSubmit();
    }
  };

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
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-6 md:p-7"
    >
      {dialogs}

      {/* Blocks are serialised into a hidden input so the server action, which
          runs as a <form action>, receives them alongside To/Cc/Subject. */}
      <input type="hidden" name="blocks" value={JSON.stringify(blocks)} />

      {(templates.length > 0 || saved.length > 0) && (
        <Field
          label="Template"
          htmlFor="template"
          hint="Optional. Drops in a ready-written message you can then edit. Save your own with the button below."
        >
          <select
            id="template"
            value={templateId}
            onChange={(e) => applyTemplate(e.target.value)}
            className={inputCls}
          >
            <option value="">Start from scratch</option>
            {saved.length > 0 && (
              <optgroup label="Your saved templates">
                {saved.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
            )}
            {templates.length > 0 && (
              <optgroup label="Built-in">
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          {(selectedSaved || templateMsg) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-3">
              {selectedSaved && (
                <button
                  type="button"
                  onClick={onDeleteTemplate}
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-[#6b6459] transition-colors hover:text-[#e02214]"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Delete this template
                </button>
              )}
              {templateMsg && (
                <span className="text-[12px] text-[#6b6459]">{templateMsg}</span>
              )}
            </div>
          )}
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

      <label className="flex items-start gap-2.5 rounded-[var(--radius-sm)] border border-[rgba(20,18,16,0.10)] bg-[#f9f5ec] px-4 py-3 text-[13.5px] leading-[1.5] text-[#2a2521]">
        <input
          type="checkbox"
          name="bccMode"
          checked={bccMode}
          onChange={(e) => setBccMode(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-[rgba(20,18,16,0.3)] text-[#e02214] focus:ring-[#e02214]/30"
        />
        <span>
          <span className="font-medium text-[#141210]">
            Send as one email (Bcc)
          </span>
          . For large groups: everyone is hidden in Bcc, the Cc above is copied
          just once, and it goes out as a single message instead of one each.
          No personalisation, everyone gets the same words.
        </span>
      </label>

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
        <button
          type="button"
          onClick={onSaveTemplate}
          disabled={blocks.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-[rgba(20,18,16,0.06)] px-5 py-2.5 text-[13.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <BookmarkPlus className="h-4 w-4" strokeWidth={2.25} />
          Save as template
        </button>
      </div>
    </form>
  );
}
