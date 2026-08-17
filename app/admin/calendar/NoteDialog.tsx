"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import DateTimePicker from "../DateTimePicker";
import { saveNote } from "./actions";
import type { NoteItem } from "./types";

/**
 * Add / edit a calendar note.
 *
 * **`role="dialog"` is load-bearing, not decoration.** The board's chip
 * popover stands down from all of its dismiss paths (outside mousedown,
 * Escape, scroll, resize) while a `[role="dialog"]` is on screen. This
 * dialog portals to the body, so without that attribute it would sit
 * outside the popover's subtree, the popover would read the first click in
 * here as "outside", close itself, and unmount this dialog mid-edit. Same
 * arrangement the two preview modals rely on.
 *
 * z-[60] puts it above the popover (z-45) and above PreviewModal (z-50),
 * but below PostPreview (z-70), which it never appears alongside.
 */
export default function NoteDialog({
  note,
  day,
  onClose,
}: {
  /** Existing note to edit, or null to create. */
  note: NoteItem | null;
  /** Day to pre-fill when creating. */
  day: string;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dayValue, setDayValue] = useState(note?.day ?? day);
  const [pending, start] = useTransition();
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    titleRef.current?.focus();
  }, [mounted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const res = await saveNote(formData);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={note ? "Edit note" : "Add note"}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={cardRef}
        className="relative w-full max-w-[460px] rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-5 shadow-[var(--shadow-lg)]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div
              className="font-mono text-[9.5px] font-semibold uppercase text-[#e02214]"
              style={{ letterSpacing: "0.22em" }}
            >
              Calendar note
            </div>
            <h2 className="mt-1.5 font-sans text-[17px] font-medium tracking-[-0.01em] text-[#141210]">
              {note ? "Edit note" : "Add a note"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.06)] hover:text-[#141210]"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          {note && <input type="hidden" name="id" value={note.id} />}

          <div>
            <span className="mb-1 block text-[12px] font-medium text-[#6b6459]">
              Date
            </span>
            {/* Controlled, with `name` rendering a hidden input so this form
                keeps submitting through plain FormData. */}
            <DateTimePicker
              mode="date"
              name="day"
              value={dayValue}
              onChange={setDayValue}
              required
              placeholder="Pick a day"
              className="!px-3 !py-2 !text-[13.5px]"
            />
          </div>

          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-[#6b6459]">
              Title
            </span>
            <input
              ref={titleRef}
              type="text"
              name="title"
              defaultValue={note?.title ?? ""}
              required
              maxLength={120}
              placeholder="What is this day for?"
              className="w-full rounded-[var(--radius-sm)] border border-[rgba(20,18,16,0.14)] bg-white px-3 py-2 text-[13.5px] text-[#141210] focus:border-[#e02214] focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-[#6b6459]">
              Description{" "}
              <span className="font-normal text-[#9a9186]">(optional)</span>
            </span>
            <textarea
              name="body"
              defaultValue={note?.body ?? ""}
              rows={4}
              placeholder="Anything worth remembering when this day comes around."
              className="w-full resize-y rounded-[var(--radius-sm)] border border-[rgba(20,18,16,0.14)] bg-white px-3 py-2 text-[13.5px] leading-[1.5] text-[#141210] focus:border-[#e02214] focus:outline-none"
            />
          </label>

          {error && (
            <p className="rounded-[var(--radius-sm)] bg-[#fde8e6] px-3 py-2 text-[12.5px] text-[#b91404]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-[13px] font-medium text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.06)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-[#e02214] px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#b91404] disabled:opacity-60"
            >
              {pending ? "Saving..." : note ? "Save note" : "Add note"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
