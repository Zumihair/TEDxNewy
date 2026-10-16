"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CalendarClock,
  CalendarX,
  Copy,
  FilePlus2,
  Lock,
  Save,
  Send,
} from "lucide-react";
import {
  validateBlocks,
  type NewsletterBlock,
  type PreviewScheme,
} from "@/lib/newsletter-blocks";
import BlockCanvas from "../_blocks/BlockCanvas";
import PreviewPane from "../_blocks/PreviewPane";
import { Segmented } from "@/components/ds";
import PreviewModal from "../_blocks/PreviewModal";
import { useConfirm } from "../ConfirmDialog";
import DateTimePicker from "../DateTimePicker";
import { useUnsavedGuard } from "../useUnsavedGuard";
import { asStage, draftStages, type DraftStage } from "../stages";
import {
  asNewsletterSegment,
  NEWSLETTER_SEGMENT_LABELS,
  type NewsletterSegment,
} from "@/lib/newsletter-segment-types";
import {
  Card,
  Field,
  PrimaryButton,
  SecondaryButton,
  inputCls,
} from "../ui";
import {
  duplicateNewsletter,
  previewNewsletter,
  previewSegmentCount,
  saveNewsletter,
  saveTemplate,
  scheduleNewsletter,
  sendTestNewsletter,
  setNewsletterStage,
  unscheduleNewsletter,
} from "./actions";
import { useToast } from "../Toaster";

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
  staticPreviewHtml,
}: {
  newsletter: NewsletterRow;
  templates: EditorTemplate[];
  subscriberCount: number;
  audienceLabel?: string;
  /** The no-login preview route supplies a fixed email here instead of rendering one on the server. */
  staticPreviewHtml?: string;
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
  // Fixed for the life of the campaign: there is only one verified sender,
  // so it isn't editable here. The audience/segment IS editable (added
  // 2026-09-06) — see the "Send to" field below.
  const fromAddress = newsletter.from_address ?? "";
  const [audience, setAudience] = useState<NewsletterSegment>(
    asNewsletterSegment(newsletter.audience),
  );
  // Live count for the chosen segment. null while "subscribers" is selected
  // (the caller's subscriberCount/audienceLabel already covers that case) or
  // while a fetch is in flight.
  const [segmentCount, setSegmentCount] = useState<number | null>(null);
  const [segmentCountLoading, setSegmentCountLoading] = useState(false);

  useEffect(() => {
    if (audience === "subscribers") {
      setSegmentCount(null);
      return;
    }
    let cancelled = false;
    setSegmentCountLoading(true);
    previewSegmentCount(audience).then((n) => {
      if (!cancelled) {
        setSegmentCount(n);
        setSegmentCountLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [audience]);
  const [scheduledLocal, setScheduledLocal] = useState(
    isoToLocalInput(newsletter.scheduled_at),
  );
  const [blocks, setBlocks] = useState<NewsletterBlock[]>(() =>
    validateBlocks(newsletter.blocks),
  );
  const [templateId, setTemplateId] = useState("");

  const toast = useToast();

  const readOnly = status === "sending" || status === "sent";

  // --- Unsaved-changes guard ------------------------------------------------
  // A snapshot of everything editable. Dirty when the live values drift from
  // the last saved baseline; cleared on a successful save or schedule. The
  // listeners themselves live in the shared hook, which /admin/socials uses
  // too.
  const serialize = () =>
    JSON.stringify({ title, subject, preheader, audience, scheduledLocal, blocks });
  const [baseline, setBaseline] = useState(serialize);
  const markSaved = () => setBaseline(serialize());
  const dirty = !readOnly && serialize() !== baseline;
  useUnsavedGuard({ dirty, confirm });

  const saveData = () => ({
    title,
    subject,
    preheader,
    from_address: fromAddress,
    audience,
    blocks,
  });

  const onSave = () => {
    startTransition(async () => {
      const res = await saveNewsletter(newsletter.id, saveData());
      if (res.ok) {
        markSaved();
        toast.success("Draft saved.");
      } else {
        toast.error(res.error);
      }
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
    startTransition(async () => {
      const res = await saveTemplate(name, { subject, preheader, blocks });
      if (res.ok) {
        setTemplates((prev) => [...prev, res.template]);
        toast.success("Template saved.");
      } else {
        toast.error(res.error);
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
    toast.success(`Loaded "${t.name}".`);
  };

  const onSendTest = () => {
    startTransition(async () => {
      const res = await sendTestNewsletter({
        subject,
        preheader,
        blocks,
        from_address: fromAddress,
      });
      if (res.ok) toast.success("Test sent to you.");
      else toast.error(res.error);
    });
  };

  const onSchedule = () => {
    if (!scheduledLocal) {
      toast.warning("Pick a date and time first.");
      return;
    }
    // The browser reads the local value as its own timezone (Sydney), so
    // toISOString() gives the correct UTC instant to store.
    const iso = new Date(scheduledLocal).toISOString();
    startTransition(async () => {
      const save = await saveNewsletter(newsletter.id, saveData());
      if (!save.ok) {
        toast.error(save.error);
        return;
      }
      const res = await scheduleNewsletter(newsletter.id, iso);
      if (res.ok) {
        markSaved();
        setStatus("scheduled");
        toast.success("Scheduled.");
      } else {
        toast.error(res.error);
      }
    });
  };

  const onUnschedule = () => {
    startTransition(async () => {
      const res = await unscheduleNewsletter(newsletter.id);
      if (res.ok) {
        markSaved();
        setStatus("draft");
        toast.success("Moved back to draft.");
      } else {
        toast.error(res.error);
      }
    });
  };

  const onStage = (next: DraftStage) => {
    setStage(next);
    startTransition(async () => {
      await setNewsletterStage(newsletter.id, next);
    });
  };

  // What the settings note and sticky bar quote as "goes to": the whole
  // audience's own label/count when "subscribers" is picked (computed
  // server-side from the real Mailchimp audience), otherwise the chosen
  // segment's label and its live-fetched count.
  const displayLabel =
    audience === "subscribers" ? audienceLabel : NEWSLETTER_SEGMENT_LABELS[audience];
  const displayCount = audience === "subscribers" ? subscriberCount : segmentCount;

  const getPreviewHtml = (scheme: PreviewScheme) =>
    staticPreviewHtml !== undefined
      ? Promise.resolve(staticPreviewHtml)
      : previewNewsletter(
      {
        subject,
        preheader,
        blocks,
        scheduled_at: scheduledLocal
          ? new Date(scheduledLocal).toISOString()
          : null,
      },
      scheme,
    );

  const snapshot = JSON.stringify({ subject, preheader, blocks, scheduledLocal });

  return (
    <div className="adm-editor">
      {dialogs}

      {readOnly && (
        <div className="adm-lockbar">
          <span className="adm-lockbar__text">
            <Lock className="h-4 w-4 shrink-0" strokeWidth={2.25} />
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

      <div className="adm-editor__grid">
        <div className="adm-editor__main">
          <section className="adm-panel">
            <h2 className="adm-section__title">Details</h2>
            <div className="adm-fields">
              <div className="adm-span2">
                <Field label="Subject" htmlFor="subject">
                  <input
                    id="subject"
                    className={inputCls}
                    value={subject}
                    disabled={readOnly}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </Field>
              </div>
              <div className="adm-span2">
                <Field label="Preview text" htmlFor="preheader" hint="Shows next to the subject in the inbox.">
                  <input
                    id="preheader"
                    className={inputCls}
                    value={preheader}
                    disabled={readOnly}
                    onChange={(e) => setPreheader(e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Internal title" htmlFor="title" hint="Only you see this.">
                <input
                  id="title"
                  className={inputCls}
                  value={title}
                  disabled={readOnly}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Field>
              <Field
                label="Send to"
                htmlFor="audience"
                hint={
                  audience === "subscribers"
                    ? undefined
                    : segmentCountLoading
                      ? "Counting…"
                      : segmentCount == null
                        ? "Could not count this segment."
                        : `About ${segmentCount} match today. Only people who are also subscribed on Mailchimp receive it.`
                }
              >
                <select
                  id="audience"
                  className={inputCls}
                  value={audience}
                  disabled={readOnly}
                  onChange={(e) => setAudience(asNewsletterSegment(e.target.value))}
                >
                  {Object.entries(NEWSLETTER_SEGMENT_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              {!readOnly && (
                <Field label="Schedule" htmlFor="schedule" hint="Australia/Sydney. Scheduling is the only way to send.">
                  <DateTimePicker
                    id="schedule"
                    value={scheduledLocal}
                    onChange={setScheduledLocal}
                    placeholder="Not scheduled"
                  />
                </Field>
              )}

              {status === "draft" && (
                <div className="adm-span2">
                <Field label="Stage" hint={draftStages("newsletter").find((x) => x.id === stage)?.blurb}>
                  <Segmented
                    options={draftStages("newsletter").map((x) => ({ value: x.id, label: x.label }))}
                    value={stage}
                    onChange={(v) => onStage(v as DraftStage)}
                    size="sm"
                  />
                </Field>
                </div>
              )}
              {status === "scheduled" && (
                <p className="adm-card__text adm-span2">
                  <Lock className="mr-1.5 inline h-3.5 w-3.5" strokeWidth={2.25} />
                  Scheduled. Unschedule to edit it again.
                </p>
              )}
            </div>
          </section>

          <section className="adm-panel">
            <div className="adm-card__top">
              <h2 className="adm-section__title">Content</h2>
              {!readOnly && (
                <div className="adm-toolrow">
                  {templates.length > 0 && (
                    <select
                      aria-label="Load a template"
                      className={`${inputCls} adm-toolrow__select`}
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
                  <SecondaryButton type="button" disabled={pending} onClick={onSaveTemplate}>
                    <FilePlus2 className="h-4 w-4" strokeWidth={2.25} />
                    Save as template
                  </SecondaryButton>
                </div>
              )}
            </div>
            <BlockCanvas blocks={blocks} onChange={readOnly ? () => {} : setBlocks} />
          </section>
        </div>

        {/* Live preview beside the editor on wide screens, so what you see is what sends. */}
        <aside className="adm-editor__side">
          <PreviewPane getHtml={getPreviewHtml} watch={snapshot} tall />
        </aside>
      </div>

      {/* Sticky action bar. Below xl the preview opens as a pop-up instead. */}
      <div className="adm-actionbar">
        <div className="adm-actionbar__inner">
          <span className="adm-actionbar__preview">
            <PreviewModal getHtml={getPreviewHtml} disabled={pending} />
          </span>
          {!readOnly && (
            <>
              <SecondaryButton type="button" disabled={pending} onClick={onSendTest}>
                <Send className="h-4 w-4" strokeWidth={2.25} />
                Send test to me
              </SecondaryButton>
              <SecondaryButton type="button" disabled={pending} onClick={onSave}>
                <Save className="h-4 w-4" strokeWidth={2.25} />
                Save draft
              </SecondaryButton>
              {status === "scheduled" ? (
                <SecondaryButton type="button" disabled={pending} onClick={onUnschedule}>
                  <CalendarX className="h-4 w-4" strokeWidth={2.25} />
                  Unschedule
                </SecondaryButton>
              ) : (
                <PrimaryButton type="button" disabled={pending || !scheduledLocal} onClick={onSchedule}>
                  <CalendarClock className="h-4 w-4" strokeWidth={2.25} />
                  Schedule
                </PrimaryButton>
              )}
              <span className="adm-actionbar__note">
                {displayLabel}
                {displayCount != null ? ` (${displayCount})` : ""}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
