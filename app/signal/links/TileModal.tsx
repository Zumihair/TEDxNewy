"use client";

/**
 * The one reusable modal shell every /signal/links tile opens into (Will's
 * direction: tiles open in-page content, not navigation). Near-fullscreen
 * on every breakpoint, a slim uniform margin and rounded corners rather
 * than a bottom sheet: Program's agenda and the Event Week Guide gallery
 * both need real vertical room, and Will asked for the same sizing on every
 * tile's modal for consistency, not just those two. Styled for this page's
 * dark Signal palette rather than the light `SpeakerModal` card style used
 * elsewhere on the site — that one still opens on TOP of this one when a
 * speaker is tapped inside the Speakers modal, which is fine: it's `fixed`
 * and a higher z-index (100 vs this shell's 60), so it doesn't need to know
 * it's nested.
 *
 * Performance notes (this shell was rebuilt once already for reported
 * open/close jank — see the callers' preload effect for the other half of
 * that fix):
 * - No `backdrop-blur` on the scrim. Backdrop-filter is one of the most
 *   expensive things a mobile GPU can be asked to recompute every frame,
 *   and animating opacity on an element that also carries a blur forces
 *   exactly that for the whole duration of the transition. A plain,
 *   slightly darker solid scrim reads the same and costs nothing to
 *   animate.
 * - The panel animates `opacity` + `y` only, not `scale`. Scaling a
 *   flex-laid-out subtree with text and rounded borders forces the browser
 *   to re-rasterise text at intermediate sizes every frame (visible as a
 *   soft "swimming" blur), which reads as jank distinct from the motion
 *   itself. Dropping scale removes that cost; a fade + slide alone is
 *   already the same acknowledged panel-entrance pattern SpeakerModal uses.
 * - `will-change: transform, opacity` on the panel promotes it to its own
 *   compositor layer BEFORE the animation starts rather than mid-transition.
 * - Body scroll lock runs in `useLayoutEffect`, not `useEffect`: the former
 *   commits before the browser paints, the latter after. Toggling
 *   `overflow` after paint means the reflow it can trigger (a scrollbar
 *   disappearing) lands mid-animation instead of before it starts.
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
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    pushModalOpen();
    return () => {
      document.body.style.overflow = prev;
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
          {/* Plain solid scrim, no blur (see file note above). */}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
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

            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
