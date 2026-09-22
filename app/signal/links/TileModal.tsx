"use client";

/**
 * The one reusable modal shell every /signal/links tile opens into (Will's
 * direction: tiles open in-page content, not navigation). Near-fullscreen
 * on every breakpoint, a slim uniform margin and rounded corners rather
 * than a bottom sheet: Program's agenda and the Event Week Guide gallery
 * both need real vertical room, and Will asked for the same sizing on every
 * tile's modal for consistency, not just those two. Styled for this page's
 * dark Signal palette rather than the light `SpeakerModal` card style used
 * elsewhere on the site.
 *
 * Performance / mobile-scroll notes (two passes now — desktop was smooth
 * both times, mobile reported "glitchy" after the first, which is why this
 * pass is specifically about touch/scroll behaviour, not animation
 * timing):
 * - No `backdrop-blur` on the scrim (expensive to recompute every frame on
 *   a mobile GPU while it's animating).
 * - The panel animates `opacity` + `y` only, not `scale` (avoids
 *   re-rasterising text mid-transition).
 * - `will-change: transform, opacity` promotes the panel to its own
 *   compositor layer before the animation starts.
 * - **Body scroll lock uses the `position: fixed` technique, not a plain
 *   `overflow: hidden` toggle.** `overflow: hidden` on `<body>` is well
 *   documented to NOT reliably stop background scrolling on iOS Safari —
 *   a touch dragging the page behind a modal can still scroll or
 *   rubber-band it. Pinning the body at its current scroll position with
 *   `position: fixed; top: -<scrollY>px` and restoring `scrollTo` on close
 *   is the standard, documented fix (the same technique used by libraries
 *   like `body-scroll-lock`). `overscroll-behavior: none` on the root
 *   element is a second, belt-and-braces layer for Android Chrome, which
 *   generally respects `overflow: hidden` correctly but can still chain an
 *   overscroll bounce into the page underneath without it.
 *   **This lock targets `document.body`, which is NOT actually where
 *   `/signal/links` scrolls.** That page moved its own scrolling onto an
 *   inner `overflow-y-auto` div (see `LinksExperience.tsx`'s file-level
 *   comment on the tile-open flicker this caused: locking `<body>` locked
 *   nothing real, so the true background layer stayed free to move while a
 *   modal opened). `LinksExperience` now also toggles that div's own
 *   `overflow` directly via React state — THAT is the fix for this page.
 *   This body-level lock stays here as defence-in-depth for whatever this
 *   shell is reused on next, but don't assume it alone is sufficient on a
 *   page with its own custom scroll container; check what element actually
 *   scrolls first.
 * - The scrim button carries `touch-action: none`, so a stray drag on the
 *   backdrop can't be interpreted as a scroll/pan gesture at all.
 * - The scrollable content pane gets `overscroll-behavior: contain` (stops
 *   scroll chaining into the locked body once it hits its own top/bottom)
 *   and `-webkit-overflow-scrolling: touch` (iOS momentum scrolling; without
 *   it iOS can fall back to a non-momentum, stuttery scroll).
 *
 * Honesty note: this environment's headless browser is Chromium-based
 * (Edge), which does not reproduce WebKit's specific scroll-locking quirks
 * even under mobile/touch emulation. The iOS-specific fixes above are the
 * standard, well-documented pattern for a known WebKit bug, not something
 * verified against real iOS Safari here. What WAS verified under real
 * touch-emulated Chromium (matching real Android Chrome behaviour): no
 * console scroll-jank warnings, no passive-listener errors, and a captured
 * trace shows no long tasks during a touch-driven open/scroll/close cycle.
 */

import { useLayoutEffect, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { pushModalOpen, popModalOpen } from "@/lib/modal-open";

const EASE = [0.22, 1, 0.36, 1] as const;
const DURATION = 0.28;

export default function TileModal({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;

    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overscrollBehavior: html.style.overscrollBehavior,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    html.style.overscrollBehavior = "none";

    pushModalOpen();

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      html.style.overscrollBehavior = prev.overscrollBehavior;
      window.scrollTo(0, scrollY);
      popModalOpen();
    };
  }, [open]);

  // Focus the close button once the panel has actually settled, not on the
  // same tick the animation starts: focusing mid-transform can force a
  // scroll-into-view/layout pass on some mobile browsers right as the panel
  // is moving, which is its own small source of jank.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => closeRef.current?.focus(), DURATION * 1000);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION, ease: EASE }}
        >
          {/* Plain solid scrim, no blur. touch-action: none stops a drag
              here being read as a scroll/pan gesture at all. */}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{ touchAction: "none" }}
            className="absolute inset-0 cursor-default bg-[#050201]/88"
          />

          <motion.div
            className="relative flex h-full w-full max-w-[560px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#150807] shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
            style={{ willChange: "transform, opacity" }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: DURATION, ease: EASE }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 pb-4 pt-6">
              <div className="min-w-0">
                <h2
                  className="font-sans tracking-[-0.02em] text-white"
                  style={{
                    fontSize: "clamp(1.3rem, 4vw, 1.6rem)",
                    fontWeight: 500,
                    lineHeight: 1.1,
                    fontVariationSettings: '"opsz" 144',
                  }}
                >
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-1 text-[13px] text-white/55">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                ref={closeRef}
                onClick={onClose}
                aria-label="Close"
                className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <X className="h-4.5 w-4.5" strokeWidth={2} />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto overscroll-contain px-6 py-6"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
