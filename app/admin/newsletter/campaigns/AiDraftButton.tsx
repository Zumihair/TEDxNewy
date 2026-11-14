"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, ClipboardCopy, FileUp, Loader2, Sparkles, X } from "lucide-react";
import {
  buildAiPrompt,
  parseAiDraft,
  type AiDraftContext,
} from "@/lib/newsletter-ai-draft";
import {
  NEWSLETTER_SEGMENT_LABELS,
  type NewsletterSegment,
} from "@/lib/newsletter-segment-types";
import { createNewsletterFromAiDraft, getAiDraftContext } from "../actions";

/**
 * "AI draft" next to "New newsletter". Two steps in one modal:
 *
 * 1. Say in a few words what the email is about. "Copy prompt" builds a
 *    prompt with that brief, the block format, house rules, real site links
 *    and blank image placeholders, and puts it on the clipboard
 *    to paste into any chat model.
 * 2. Paste the model's answer back (or upload it as a .json file) and
 *    "Create draft" saves it as an ordinary draft and opens the editor.
 *
 * No model is called from the site, so there is no API key and no cost here.
 * The panel's height follows `visualViewport` live (never frozen), so the
 * paste box stays reachable above a phone keyboard.
 */

const AUDIENCES = Object.keys(NEWSLETTER_SEGMENT_LABELS) as NewsletterSegment[];

const TEXTAREA =
  "w-full resize-y rounded-[var(--radius-sm)] border border-[rgba(0,0,0,0.14)] bg-white px-3 py-2 text-[13.5px] leading-[1.5] text-[#000000] focus:border-[#e62b1e] focus:outline-none";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older Safari, or a non-secure context: fall back to a hidden textarea.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function AiDraftButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tx-btn tx-btn--secondary tx-btn--sm tx-btn--auto adm-write"
      >
        <Sparkles className="h-4 w-4" strokeWidth={2.25} />
        AI draft
      </button>
      {open && <AiDraftDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function AiDraftDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const [about, setAbout] = useState("");
  const [audience, setAudience] = useState<NewsletterSegment>("subscribers");
  const [ctx, setCtx] = useState<AiDraftContext | null>(null);
  const [ctxError, setCtxError] = useState(false);
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const [showPrompt, setShowPrompt] = useState(false);

  const [answer, setAnswer] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  // Load event links once, as soon as the dialog opens.
  useEffect(() => {
    let live = true;
    getAiDraftContext()
      .then((c) => live && setCtx(c))
      .catch(() => live && setCtxError(true));
    return () => {
      live = false;
    };
  }, []);

  // Escape closes; the page behind does not scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Keep the panel inside the visible area when a phone keyboard opens.
  // Written straight to the element on each resize (no state, nothing frozen).
  useEffect(() => {
    const vv = window.visualViewport;
    const el = panelRef.current;
    if (!vv || !el) return;
    const apply = () => {
      el.style.maxHeight = `${Math.round(vv.height * 0.94)}px`;
    };
    apply();
    vv.addEventListener("resize", apply);
    return () => vv.removeEventListener("resize", apply);
  }, [mounted]);

  const prompt = useMemo(
    () =>
      ctx
        ? buildAiPrompt({ about, audience }, ctx)
        : buildAiPrompt({ about, audience }, { site: "https://tedxnewy.com.au", events: [] }),
    [about, audience, ctx],
  );

  const check = useMemo(() => (answer.trim() ? parseAiDraft(answer) : null), [answer]);

  const onCopy = async () => {
    const ok = await copyText(prompt);
    setCopied(ok ? "done" : "failed");
    if (!ok) setShowPrompt(true);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 500_000) {
      setSaveError("That file is too big to be a newsletter.");
      return;
    }
    setFileName(file.name);
    setSaveError(null);
    setAnswer(await file.text());
  };

  const onCreate = async () => {
    if (!check?.ok) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await createNewsletterFromAiDraft(answer);
      if (!res.ok) {
        setSaveError(res.error);
        setSaving(false);
        return;
      }
      router.push(`/admin/newsletter/${res.id}`);
    } catch {
      setSaveError("Could not create the draft. Try again.");
      setSaving(false);
    }
  };

  if (!mounted) return null;

  const blockCount = check?.ok ? check.draft.blocks.length : 0;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI draft"
      onClick={onClose}
      className="adm-portal voice-product fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 sm:p-6 md:p-8"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[var(--radius-md)] bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[rgba(0,0,0,0.08)] px-5 py-4">
          <span className="font-sans text-[16px] font-medium tracking-[-0.01em] text-[#000000]">
            AI draft
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(0,0,0,0.06)] hover:text-[#000000]"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        <div className="space-y-7 overflow-y-auto overscroll-contain p-5">
          {/* Step 1 */}
          <section className="space-y-3">
            <Step n={1} title="Describe the email and copy the prompt" />
            <label className="block space-y-1.5">
              <span className="text-[13px] font-medium text-[#000000]">
                What&apos;s it about?
              </span>
              <textarea
                value={about}
                onChange={(e) => {
                  setAbout(e.target.value);
                  setCopied("idle");
                }}
                rows={4}
                placeholder="A few words or a few lines. For example: thank everyone who came to Signal, share photos, ask for feedback, tease 2027 dates."
                className={TEXTAREA}
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <label className="block space-y-1.5">
                <span className="text-[13px] font-medium text-[#000000]">Audience</span>
                <select
                  value={audience}
                  onChange={(e) => {
                    setAudience(e.target.value as NewsletterSegment);
                    setCopied("idle");
                  }}
                  className="block w-full rounded-[var(--radius-sm)] border border-[rgba(0,0,0,0.14)] bg-white px-3 py-2 text-[13.5px] text-[#000000] focus:border-[#e62b1e] focus:outline-none sm:w-auto"
                >
                  {AUDIENCES.map((a) => (
                    <option key={a} value={a}>
                      {NEWSLETTER_SEGMENT_LABELS[a]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-[12.5px] leading-[1.5] text-[#6b6459]">
              Images come back as blank placeholder blocks, each described so you know what to pick from the gallery.
              {ctxError && " Event links couldn't load, so the prompt has the main site links only."}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onCopy}
                disabled={!ctx && !ctxError}
                className="tx-btn tx-btn--accent tx-btn--sm"
              >
                {!ctx && !ctxError ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
                ) : copied === "done" ? (
                  <Check className="h-4 w-4" strokeWidth={2.25} />
                ) : (
                  <ClipboardCopy className="h-4 w-4" strokeWidth={2.25} />
                )}
                {copied === "done" ? "Copied" : "Copy prompt"}
              </button>
              <button
                type="button"
                onClick={() => setShowPrompt((s) => !s)}
                className="text-[13px] font-medium text-[#b91404] hover:underline"
              >
                {showPrompt ? "Hide prompt" : "Show prompt"}
              </button>
            </div>
            {copied === "done" && (
              <p className="text-[12.5px] text-[#6b6459]">
                Paste it into Claude, ChatGPT, Copilot or any other AI chat, then bring the answer back below.
              </p>
            )}
            {copied === "failed" && (
              <p className="text-[12.5px] text-[#b91404]">
                Couldn&apos;t copy automatically. Select the prompt below and copy it yourself.
              </p>
            )}
            {showPrompt && (
              <textarea
                readOnly
                value={prompt}
                rows={10}
                onFocus={(e) => e.currentTarget.select()}
                className={TEXTAREA + " font-mono text-[12px]"}
              />
            )}
          </section>

          {/* Step 2 */}
          <section className="space-y-3 border-t border-[rgba(0,0,0,0.08)] pt-6">
            <Step n={2} title="Bring the answer back" />
            <textarea
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                setFileName(null);
                setSaveError(null);
              }}
              rows={6}
              placeholder="Paste the AI's whole answer here (the JSON code block)."
              className={TEXTAREA + " font-mono text-[12px]"}
            />
            <div className="flex flex-wrap items-center gap-3">
              <label className="tx-btn tx-btn--secondary tx-btn--sm cursor-pointer">
                <FileUp className="h-4 w-4" strokeWidth={2.25} />
                Upload file
                <input
                  type="file"
                  accept=".json,.txt,application/json,text/plain"
                  className="sr-only"
                  onChange={(e) => {
                    void onFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              {fileName && <span className="text-[12.5px] text-[#6b6459]">{fileName}</span>}
            </div>

            {check && !check.ok && (
              <p className="text-[12.5px] leading-[1.5] text-[#b91404]">{check.error}</p>
            )}
            {check?.ok && (
              <div className="rounded-[var(--radius-sm)] bg-[#f4efe6] px-3.5 py-3 text-[13px] leading-[1.5] text-[#000000]">
                <p className="font-medium">{check.draft.subject || check.draft.title}</p>
                <p className="text-[#6b6459]">
                  {blockCount} block{blockCount === 1 ? "" : "s"}
                  {check.draft.placeholders > 0 &&
                    `, ${check.draft.placeholders} photo placeholder${check.draft.placeholders === 1 ? "" : "s"} to fill`}
                  {" · "}
                  {NEWSLETTER_SEGMENT_LABELS[check.draft.audience]}
                </p>
              </div>
            )}
            {saveError && <p className="text-[12.5px] text-[#b91404]">{saveError}</p>}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onCreate}
                disabled={!check?.ok || saving}
                className="tx-btn tx-btn--accent tx-btn--sm"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />}
                Create draft
              </button>
              <span className="text-[12.5px] text-[#6b6459]">
                Opens in the editor as a draft. Nothing sends.
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#000000] text-[12px] font-medium text-white">
        {n}
      </span>
      <span className="text-[14.5px] font-medium tracking-[-0.01em] text-[#000000]">{title}</span>
    </div>
  );
}
