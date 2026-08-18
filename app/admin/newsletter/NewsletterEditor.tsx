"use client";

import { useState, useTransition } from "react";
import {
  CalendarClock,
  CalendarX,
  Copy,
  FilePlus2,
  Lock,
  Save,
  Send,
} from "lucide-react";
import { validateBlocks, type NewsletterBlock } from "@/lib/newsletter-blocks";
import BlockCanvas from "../_blocks/BlockCanvas";
import PreviewModal from "../_blocks/PreviewModal";
import { useConfirm } from "../ConfirmDialog";
import DateTimePicker from "../DateTimePicker";
import { useUnsavedGuard } from "../useUnsavedGuard";
import { asStage, draftStages, type DraftStage } from "../stages";
import {
  Card,
  Field,
  Flash,
  PrimaryButton,
  SecondaryButton,
  SectionLabel,
  inputCls,
} from "../ui";
import {
  duplicateNewsletter,
  previewNewsletter,
  saveNewsletter,
  saveTemplate,
  scheduleNewsletter,
  sendTestNewsletter,
  setNewsletterStage,
  unscheduleNewsletter,
} from "./actions";

type Status = "draft" | "scheduled" | "sending" | "sent";

export type NewsletterRow = {
  id: string;
  title: string | null;
  subject: string | null;
  preheader: string | null;
  from_address: string | null;
  audience: string | null;
  blocks: unknown;
  status: Status;
  /** Editorial stage: early / polish / ready. See app/admin/stages.ts. */
  stage: string | null;
  scheduled_at: string | null;
};

export type EditorTemplate = {
  id: string;
  name: string;
  subject: string | null;
  preheader: string | null;
  blocks: unknown;
};

/**
 * Convert a UTC ISO string to the value a datetime-local input expects, in the
 * browser's local time. The admin is in Newcastle, so local time is
 * Australia/Sydney.
 */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const offMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offMs).toISOString().slice(0, 16);
}

export default function NewsletterEditor({
  newsletter,
  templates: templatesProp,
  subscriberCount,
  audienceLabel = "All subscribers",
}: {
  newsletter: NewsletterRow;
  templates: EditorTemplate[];
  subscriberCount: number;
  audienceLabel?: string;
}) {
  const [pending, startTransition] = useTransition();
  const { confirm, prompt, dialogs } = useConfirm();

  // Local copy of the templates so a newly saved one shows in the Load dropdown
  // without a full page refresh.
  const [templates, setTemplates] = useState<EditorTemplate[]>(templatesProp);

  const [status, setStatus] = useState<Status>(newsletter.status);
  const [stage, setStage] = useState<DraftStage>(asStage(newsletter.stage));
  const [title, setTitle] = useState(newsletter.title ?? "");
  const [subject, setSubject] = useState(newsletter.subject ?? "");
  const [preheader, setPreheader] = useState(newsletter.preheader ?? "");
  // Fixed for the life of the campaign: there is only one verified sender and
  // one audience, so neither is editable here any more. Still sent with every
  // save so the stored value stays intact.
  const fromAddress = newsletter.from_address ?? "";
  const [scheduledLocal, setScheduledLocal] = useState(
    isoToLocalInput(newsletter.scheduled_at),
  );
  const [blocks, setBlocks] = useState<NewsletterBlock[]>(() =>
    validateBlocks(newsletter.blocks),
  );
  const [templateId, setTemplateId] = useState("");

  const [flash, setFlash] = useState<{
    tone: "ok" | "info" | "error";
    text: string;
  } | null>(null);

  const readOnly = status === "sending" || status === "sent";

  // --- Unsaved-changes guard ------------------------------------------------
  // A snapshot of everything editable. Dirty when the live values drift from
  // the last saved baseline; cleared on a successful save or schedule. The
  // listeners themselves live in the shared hook, which /admin/socials uses
  // too.
  const serialize = () =>
    JSON.stringify({ title, subject, preheader, scheduledLocal, blocks });
  const [baseline, setBaseline] = useState(serialize);
  const markSaved = () => setBaseline(serialize());
  const dirty = !readOnly && serialize() !== baseline;
  useUnsavedGuard({ dirty, confirm });

  const saveData = () => ({
    title,
    subject,
    preheader,
    from_address: fromAddress,
    blocks,
  });

  const onSave = () => {
    setFlash(null);
    startTransition(async () => {
      const res = await saveNewsletter(newsletter.id, saveData());
      if (res.ok) markSaved();
      setFlash(
        res.ok
          ? { tone: "ok", text: "Draft saved." }
          : { tone: "error", text: res.error },
      );
    });
  };

  const onSaveTemplate = async () => {
    const name = await prompt({
      title: "Save as template",
      label: "Template name",
      placeholder: "e.g. Monthly update",
      confirmLabel: "Save",
      tone: "neutral",
    });
    if (name === null) return;
    setFlash(null);
    startTransition(async () => {
      const res = await saveTemplate(name, { subject, preheader, blocks });
      if (res.ok) {
        setTemplates((prev) => [...prev, res.template]);
        setFlash({ tone: "ok", text: "Template saved." });
      } else {
        setFlash({ tone: "error", text: res.error });
      }
    });
  };

  const onLoadTemplate = async (id: string) => {
    setTemplateId(id);
    if (!id) return;
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    const ok = await confirm({
      title: "Load template?",
      body: `Load "${t.name}"? This replaces the current subject, preheader and blocks.`,
      confirmLabel: "Load",
      tone: "neutral",
    });
    if (!ok) {
      setTemplateId("");
      return;
    }
    setSubject(t.subject ?? "");
    setPreheader(t.preheader ?? "");
    setBlocks(validateBlocks(t.blocks));
    setTemplateId("");
    setFlash({ tone: "info", text: `Loaded "${t.name}".` });
  };

  const onSendTest = () => {
    setFlash(null);
    startTransition(async () => {
      const res = await sendTestNewsletter({
        subject,
        preheader,
        blocks,
        from_address: fromAddress,
      });
      setFlash(
        res.ok
          ? { tone: "ok", text: "Test sent to you." }
          : { tone: "error", text: res.error },
      );
    });
  };

  const onSchedule = () => {
    if (!scheduledLocal) {
      setFlash({ tone: "error", text: "Pick a date and time first." });
      return;
    }
    // The browser reads the local value as its own timezone (Sydney), so
    // toISOString() gives the correct UTC instant to store.
    const iso = new Date(scheduledLocal).toISOString();
    setFlash(null);
    startTransition(async () => {
      const save = await saveNewsletter(newsletter.id, saveData());
      if (!save.ok) {
        setFlash({ tone: "error", text: save.error });
        return;
      }
      const res = await scheduleNewsletter(newsletter.id, iso);
      if (res.ok) {
        markSaved();
        setStatus("scheduled");
        setFlash({ tone: "ok", text: "Scheduled." });
      } else {
        setFlash({ tone: "error", text: res.error });
      }
    });
  };

  const onUnschedule = () => {
    setFlash(null);
    startTransition(async () => {
      const res = await unscheduleNewsletter(newsletter.id);
      if (res.ok) {
        markSaved();
        setStatus("draft");
        setFlash({ tone: "info", text: "Moved back to draft." });
      } else {
        setFlash({ tone: "error", text: res.error });
      }
    });
  };

  const onStage = (next: DraftStage) => {
    setStage(next);
    startTransition(async () => {
      await setNewsletterStage(newsletter.id, next);
    });
  };

  const getPreviewHtml = () =>
    previewNewsletter({
      subject,
      preheader,
      blocks,
      scheduled_at: scheduledLocal
        ? new Date(scheduledLocal).toISOString()
        : null,
    });

  return (
    // Bottom padding leaves room for the sticky action bar so it never covers
    // the last block.
    <div className="space-y-6 pb-28">
      {dialogs}
      {flash && <Flash tone={flash.tone}>{flash.text}</Flash>}

      {readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-[rgba(20,18,16,0.03)] px-4 py-3">
          <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[#141210]">
            <Lock className="h-4 w-4 shrink-0 text-[#6b6459]" strokeWidth={2.25} />
            {status === "sending"
              ? "Sending right now. Editing is locked."
              : "Sent. This campaign is locked."}
          </span>
          {status === "sent" && (
            <form action={duplicateNewsletter}>
              <input type="hidden" name="id" value={newsletter.id} />
              <SecondaryButton type="submit">
                <Copy className="h-4 w-4" strokeWidth={2.25} />
                Duplicate to draft
              </SecondaryButton>
            </form>
          )}
        </div>
      )}

      {/* Settings */}
      <Card className="p-5">
        <SectionLabel>Settings</SectionLabel>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field
            label="Internal title"
            htmlFor="title"
            hint="Only you see this. It names the draft in your list."
          >
            <input
              id="title"
              className={inputCls}
              value={title}
              disabled={readOnly}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Subject" htmlFor="subject">
            <input
              id="subject"
              className={inputCls}
              value={subject}
              disabled={readOnly}
              onChange={(e) => setSubject(e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field
              label="Preview text"
              htmlFor="preheader"
              hint="Shows next to the subject in the inbox."
            >
              <input
                id="preheader"
                className={inputCls}
                value={preheader}
                disabled={readOnly}
                onChange={(e) => setPreheader(e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Stage: the one judgement call left on a draft. Once scheduled the
            content is finalised, so the picker gives way once a date is set,
            same as sending/sent. Sending as and the audience are both fixed,
            so neither is a field any more. */}
        {status === "draft" && (
          <div className="mt-6 border-t border-[rgba(20,18,16,0.08)] pt-5">
            <Field
              label="Stage"
              hint={draftStages("newsletter").find((s) => s.id === stage)?.blurb}
            >
              <div className="flex flex-wrap gap-2">
                {draftStages("newsletter").map((s) => {
                  const on = s.id === stage;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={pending}
                      onClick={() => onStage(s.id)}
                      title={s.blurb}
                      aria-pressed={on}
                      className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors disabled:opacity-70 ${
                        on
                          ? "bg-[#e02214] text-white"
                          : "bg-[rgba(20,18,16,0.06)] text-[#141210] hover:bg-[rgba(20,18,16,0.10)]"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        )}
        {status === "scheduled" && (
          <div className="mt-6 flex items-center gap-2 border-t border-[rgba(20,18,16,0.08)] pt-5 text-[13px] text-[#6b6459]">
            <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Scheduled. Unschedule below to edit its stage again.
          </div>
        )}

        {/* Schedule + the tools that sit alongside it */}
        {!readOnly && (
          <div className="mt-5 flex flex-wrap items-end gap-2.5 border-t border-[rgba(20,18,16,0.08)] pt-5">
            <div className="w-[268px] shrink-0">
              <Field label="Schedule" htmlFor="schedule">
                <DateTimePicker
                  id="schedule"
                  value={scheduledLocal}
                  onChange={setScheduledLocal}
                  placeholder="Not scheduled"
                  className="!px-3 !py-2.5 !text-[13.5px]"
                />
              </Field>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 pb-0.5">
              <PrimaryButton type="button" disabled={pending} onClick={onSendTest}>
                <Send className="h-4 w-4" strokeWidth={2.25} />
                Send test to me
              </PrimaryButton>
              <SecondaryButton
                type="button"
                disabled={pending}
                onClick={onSaveTemplate}
              >
                <FilePlus2 className="h-4 w-4" strokeWidth={2.25} />
                Save as template
              </SecondaryButton>
              {templates.length > 0 && (
                <select
                  aria-label="Load a template"
                  className={`${inputCls} w-auto px-3 py-2.5 text-[13.5px]`}
                  value={templateId}
                  disabled={pending}
                  onChange={(e) => onLoadTemplate(e.target.value)}
                >
                  <option value="">Load template…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <p className="w-full text-[12px] text-[#6b6459]">
              Australia/Sydney. Scheduling is the only way to send: pick a time,
              hit Schedule, and the cron sends it. Goes to {audienceLabel.toLowerCase()}{" "}
              ({subscriberCount}) from {fromAddress}.
            </p>
          </div>
        )}
      </Card>

      {/* Full-width builder */}
      <Card className="space-y-4 p-5">
        <SectionLabel>Content</SectionLabel>
        <BlockCanvas
          blocks={blocks}
          onChange={readOnly ? () => {} : setBlocks}
        />
      </Card>

      {/* Sticky action bar. Preview opens a pop-up so the builder stays full
          width. */}
      <div className="sticky bottom-0 z-20 -mx-1">
        <div className="flex flex-wrap items-center gap-2.5 rounded-t-[var(--radius-md)] border border-b-0 border-[rgba(20,18,16,0.12)] bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-16px_rgba(20,18,16,0.45)] backdrop-blur">
          <PreviewModal getHtml={getPreviewHtml} disabled={pending} />
          {!readOnly && (
            <>
              <PrimaryButton type="button" disabled={pending} onClick={onSave}>
                <Save className="h-4 w-4" strokeWidth={2.25} />
                Save draft
              </PrimaryButton>
              {status === "scheduled" ? (
                <SecondaryButton
                  type="button"
                  disabled={pending}
                  onClick={onUnschedule}
                >
                  <CalendarX className="h-4 w-4" strokeWidth={2.25} />
                  Unschedule
                </SecondaryButton>
              ) : (
                <PrimaryButton
                  type="button"
                  disabled={pending || !scheduledLocal}
                  onClick={onSchedule}
                >
                  <CalendarClock className="h-4 w-4" strokeWidth={2.25} />
                  Schedule
                </PrimaryButton>
              )}
              <span className="ml-auto text-[12.5px] text-[#6b6459]">
                Goes to {subscriberCount} subscriber
                {subscriberCount === 1 ? "" : "s"}.
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
