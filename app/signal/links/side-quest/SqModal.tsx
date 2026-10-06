"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { prefersReducedMotion } from "../TileModal";

/**
 * A small bottom sheet (centred card from `sm:` up) for the Side Quest
 * screens: the QR puzzle and photo capture sit over the quest list in one of
 * these, so the player never loses their place.
 *
 * Deliberately light. It does not reuse `TileModal`, which animates from a
 * tapped tile and holds a fixed height. This one grows with its content,
 * locks page scroll while open, closes on Escape or a backdrop tap, and fades
 * with `.rm-fade` so reduced-motion players get a plain cross-fade.
 */
export default function SqModal({
  title,
  onClose,
  children,
  dismissible = true,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** False while an upload is in flight, so a stray tap cannot abandon it. */
  dismissible?: boolean;
}) {
  const [shown, setShown] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = typeof window !== "undefined" && prefersReducedMotion();

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!dismissible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismissible, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={`rm-fade absolute inset-0 bg-black/70 transition-opacity duration-150 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
        onClick={dismissible ? onClose : undefined}
        aria-hidden
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`rm-fade relative max-h-[92dvh] w-full max-w-[460px] overflow-y-auto rounded-t-3xl border border-white/12 bg-[#1a0a07] p-6 pb-8 shadow-[0_-12px_48px_rgba(0,0,0,0.5)] outline-none transition-all duration-300 ease-out sm:rounded-3xl sm:pb-6 ${
          shown
            ? "translate-y-0 opacity-100"
            : reduced
              ? "opacity-0"
              : "translate-y-6 opacity-0"
        }`}
        style={{ overscrollBehavior: "contain" }}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2
            id={titleId}
            className="font-sans text-[22px] font-medium leading-tight tracking-[-0.02em] text-white"
          >
            {title}
          </h2>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

/** Shared button styles so every Side Quest screen taps the same way. */
export const primaryBtn =
  "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#e62b1e] px-6 font-sans text-[15.5px] font-medium text-white transition-all hover:bg-[#b91404] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50";

export const ghostBtn =
  "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-white/20 px-6 font-sans text-[15px] font-medium text-white/85 transition-colors hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50";
