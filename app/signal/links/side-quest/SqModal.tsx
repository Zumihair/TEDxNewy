"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { prefersReducedMotion } from "../TileModal";

/**
 * A centred dialog for the Side Quest screens: the QR puzzle and photo
 * capture sit over the quest list in one of these, so the player never loses
 * their place.
 *
 * Built to cover the WHOLE screen on a phone at any scroll position:
 *  - It is portalled to `document.body`, so no ancestor transform, filter,
 *    overflow or stacking context can clip or shrink the scrim.
 *  - The layer is `position: fixed` with `inset: 0` AND an explicit
 *    `100dvh` height, so Safari's collapsing toolbar cannot leave a strip
 *    uncovered (plain `vh` is the tall viewport, `dvh` follows the toolbar).
 *  - Page scroll is locked by pinning the body (`position: fixed` at the
 *    current offset) and restored on close. `overflow: hidden` alone does not
 *    stop touch scrolling on iOS Safari, which is how a page can keep moving
 *    under a scrim.
 *  - It sits above the sticky score bar (z-70 against the bar's z-40), so
 *    the whole screen dims evenly, bar included.
 * Fades with `.rm-fade`, so reduced-motion players get a plain cross-fade.
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
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = typeof window !== "undefined" && prefersReducedMotion();

  useEffect(() => {
    setMounted(true);
    const id = requestAnimationFrame(() => setShown(true));
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      cancelAnimationFrame(id);
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
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

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center px-4"
      style={{
        height: "100dvh",
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={`rm-fade absolute inset-0 bg-black/75 transition-opacity duration-150 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
        style={{ touchAction: "none" }}
        onClick={dismissible ? onClose : undefined}
        aria-hidden
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`rm-fade relative w-full max-w-[460px] overflow-y-auto rounded-3xl border border-white/12 bg-[#1a0a07] p-6 shadow-[0_12px_48px_rgba(0,0,0,0.5)] outline-none transition-all duration-300 ease-out ${
          shown
            ? "translate-y-0 opacity-100"
            : reduced
              ? "opacity-0"
              : "translate-y-4 opacity-0"
        }`}
        style={{
          maxHeight: "100%",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        }}
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
    </div>,
    document.body,
  );
}

/** Shared button styles so every Side Quest screen taps the same way. */
export const primaryBtn =
  "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#e62b1e] px-6 font-sans text-[15.5px] font-medium text-white transition-all hover:bg-[#b91404] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50";

export const ghostBtn =
  "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-white/20 px-6 font-sans text-[15px] font-medium text-white/85 transition-colors hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50";
