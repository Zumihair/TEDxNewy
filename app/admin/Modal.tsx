"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * The house modal shell: a button trigger plus an overlay dialog, portalled
 * to document.body (so no ancestor can trap the fixed overlay), closing on
 * Escape or an overlay click, with the body scroll locked while open.
 *
 * This is the "buttons open a modal, not an inline section" pattern — used
 * wherever an admin page adds a new record (a document, a partner, and so
 * on) instead of a bespoke `<details>` panel per page. See the README's
 * "Admin UI conventions" section.
 */
const MAX_W: Record<NonNullable<ModalSize>, string> = {
  default: "max-w-[520px]",
  wide: "max-w-[760px]",
  xl: "max-w-[960px]",
};

type ModalSize = "default" | "wide" | "xl";

export function Modal({
  trigger,
  title,
  children,
  wide,
  size,
}: {
  /** The button that opens the modal. Rendered as-is, click wired for you. */
  trigger: ReactNode;
  title: string;
  children: ReactNode;
  /** Shorthand for size="wide", kept for existing call sites. */
  wide?: boolean;
  /** "default" (520px) unless `wide` is set; "xl" (960px) for data-dense
   *  content like a chart or a map that needs real room. */
  size?: ModalSize;
}) {
  const resolvedSize: ModalSize = size ?? (wide ? "wide" : "default");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open &&
        mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 sm:p-6 md:p-8"
          >
            {/* max-h + flex-col so the header (and its close button) stays
                pinned on a short mobile viewport instead of scrolling away
                with tall content — only the body scrolls. */}
            <div
              onClick={(e) => e.stopPropagation()}
              className={
                "flex max-h-[92vh] w-full flex-col overflow-hidden rounded-[var(--radius-md)] bg-white shadow-2xl " +
                MAX_W[resolvedSize]
              }
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[rgba(20,18,16,0.08)] px-5 py-4">
                <span className="font-sans text-[16px] font-medium tracking-[-0.01em] text-[#141210]">
                  {title}
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.06)] hover:text-[#141210]"
                >
                  <X className="h-4 w-4" strokeWidth={2.25} />
                </button>
              </div>
              <div className="overflow-y-auto p-5">{children}</div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
