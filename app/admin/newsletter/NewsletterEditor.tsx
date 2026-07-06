"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CalendarX,
  FilePlus2,
  Save,
  Send,
  SendHorizonal,
  Trash2,
} from "lucide-react";
import { validateBlocks, type NewsletterBlock } from "@/lib/newsletter-blocks";
import BlockCanvas from "../_blocks/BlockCanvas";
import PreviewModal from "../_blocks/PreviewModal";
import { useConfirm } from "../ConfirmDialog";
import {
  Card,
  DangerButton,
  Field,
  Flash,
  PrimaryButton,
  SecondaryButton,
  SectionLabel,
  inputCls,
} from "../ui";
import {
  deleteNewsletter,
  previewNewsletter,
  saveNewsletter,
  saveTemplate,
  scheduleNewsletter,
  sendNewsletterNow,
  sendTestNewsletter,
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
  fromOptions,
}: {
  newsletter: NewsletterRow;
  templates: EditorTemplate[];
  subscriberCount: number;
  audienceLabel?: string;
  fromOptions: string[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { confirm, prompt, dialogs } = useConfirm();

  // Local copy of the templates so a newly saved one shows in the Load dropdown
  // without a full page refresh.
  const [templates, setTemplates] = useState<EditorTemplate[]>(templatesProp);

  const [status, setStatus] = useState<Status>(newsletter.status);
  const [title, setTitle] = useState(newsletter.title ?? "");
  const [subject, setSubject] = useState(newsletter.subject ?? "");
  const [preheader, setPreheader] = useState(newsletter.preheader ?? "");
  const [fromAddress, setFromAddress] = useState(
    newsletter.from_address ?? fromOptions[0] ?? "",
  );
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
  // the last saved baseline; cleared on a successful save / schedule / send.
  const serialize = () =>
    JSON.stringify({
      title,
      subject,
      preheader,
      fromAddress,
      scheduledLocal,
      blocks,
    });
  const baselineRef = useRef<string | null>(null);
  if (baselineRef.current === null) baselineRef.current = serialize();
  const markSaved = () => {
    baselineRef.current = serialize();
  };
  const dirty = !readOnly && serialize() !== baselineRef.current;
  // Mirror into a ref so the event listeners always read the latest value.
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  // Native browser warning on tab close / reload while there are edits.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // In-app navigation: intercept anchor clicks in the capture phase so we can
  // confirm before the router (or a Link) takes over. Only same-origin, plain
  // left-clicks to another page are caught.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!dirtyRef.current || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const targetAttr = anchor.getAttribute("target");
      if (targetAttr && targetAttr !== "_self") return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      void confirm({
        title: "Leave without saving?",
        body: "You have unsaved changes. Leave without saving?",
        confirmLabel: "Leave",
        tone: "danger",
      }).then((ok) => {
        if (ok) {
          dirtyRef.current = false;
          router.push(url.pathname + url.search + url.hash);
        }
      });
    };
    document.addEventListener("click", onDocClick, true);
    return () => document.removeEventListener("click", onDocClick, true);
  }, [confirm, router]);

  // Options for the send-as dropdown; make sure the current value is present
  // even if it is not in the configured list.
  const fromChoices = useMemo(() => {
    const set = new Set(fromOptions);
    if (fromAddress) set.add(fromAddress);
    return [...set];
  }, [fromOptions, fromAddress]);

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

  const onSendNow = async () => {
    const ok = await confirm({
      title: "Send now?",
      body: `Send this newsletter now to ${subscriberCount} subscriber${
        subscriberCount === 1 ? "" : "s"
      }? This cannot be undone.`,
      confirmLabel: "Send now",
      tone: "danger",
    });
    if (!ok) return;
    // Nothing left to warn about once the send is confirmed.
    markSaved();
    setFlash(null);
    startTransition(async () => {
      const save = await saveNewsletter(newsletter.id, saveData());
      if (!save.ok) {
        setFlash({ tone: "error", text: save.error });
        return;
      }
      const res = await sendNewsletterNow(newsletter.id);
      // On success this redirects; only a failure returns here.
      if (res && !res.ok) {
        setFlash({ tone: "error", text: res.error });
      }
    });
  };

  const onDelete = async () => {
    const ok = await confirm({
      title: "Delete this draft?",
      body: "This cannot be undone.",
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    // The draft is going away; don't warn about unsaved edits on the way out.
    markSaved();
    startTransition(async () => {
      await deleteNewsletter(newsletter.id);
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
        <Flash tone="info">
          {status === "sending"
            ? "This newsletter is sending right now. Editing is locked."
            : "This newsletter has been sent. It is read only."}
        </Flash>
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
              label="Preheader"
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
          <Field label="Send as" htmlFor="from">
            <select
              id="from"
              className={inputCls}
              value={fromAddress}
              disabled={readOnly}
              onChange={(e) => setFromAddress(e.target.value)}
            >
              {fromChoices.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Audience">
            <div className={`${inputCls} flex items-center bg-[rgba(20,18,16,0.03)] text-[#6b6459]`}>
              {audienceLabel} ({subscriberCount})
            </div>
          </Field>
          <div className="sm:col-span-2">
            <Field
              label="Schedule"
              htmlFor="schedule"
              hint="Australia/Sydney. Leave empty to send manually."
            >
              <input
                id="schedule"
                type="datetime-local"
                className={inputCls}
                value={scheduledLocal}
                disabled={readOnly}
                onChange={(e) => setScheduledLocal(e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Content tools */}
        {!readOnly && (
          <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-[rgba(20,18,16,0.08)] pt-4">
            <SecondaryButton
              type="button"
              disabled={pending}
              onClick={onSendTest}
            >
              <Send className="h-4 w-4" strokeWidth={2.25} />
              Send test to me
            </SecondaryButton>
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
                className={`${inputCls} w-auto`}
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
            {status === "draft" && (
              <div className="ml-auto" onClick={onDelete}>
                <DangerButton type="button" disabled={pending}>
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Delete draft
                </DangerButton>
              </div>
            )}
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
              <span onClick={onSave} className="contents">
                <PrimaryButton type="button" disabled={pending}>
                  <Save className="h-4 w-4" strokeWidth={2.25} />
                  Save draft
                </PrimaryButton>
              </span>
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
                <SecondaryButton
                  type="button"
                  disabled={pending || !scheduledLocal}
                  onClick={onSchedule}
                >
                  <CalendarClock className="h-4 w-4" strokeWidth={2.25} />
                  Schedule
                </SecondaryButton>
              )}
              <span onClick={onSendNow} className="contents">
                <PrimaryButton type="button" disabled={pending}>
                  <SendHorizonal className="h-4 w-4" strokeWidth={2.25} />
                  Send now
                </PrimaryButton>
              </span>
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
