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
 * **Open/close flicker — third pass, actual mechanism this time.** The
 * previous fix (locking the real scroll container instead of `<body>`)
 * was real and worth keeping, but Will kept seeing a flicker anyway. The
 * remaining cause: the scrim and the panel used to be ONE motion.div's
 * opacity (the panel nested inside it), so for the whole ~280ms open
 * transition BOTH were simultaneously, multiplicatively translucent — the
 * panel's own opacity was effectively `parentOpacity * panelOpacity`,
 * which is LOWER than either alone and stretches the "hazy, background
 * still showing through" window across most of the animation, not just
 * its first frame. A static background showing through a long translucent
 * window still reads as a flicker even though nothing is moving.
 *
 * Fixed by decoupling the two, per the brief: the scrim now has its OWN
 * fast, independent opacity transition (`BACKDROP_DURATION`, ~100ms) with
 * no parent opacity multiplying it, and the panel's fade/slide only BEGINS
 * once the scrim has essentially finished (`PANEL_DELAY` = the scrim's own
 * duration) — so there's no window where you're looking through two
 * half-transparent layers at once. Closing reverses the order (panel fades
 * first while the scrim stays opaque, then the scrim drops last), for the
 * same reason: one clean step at the end beats a gradual co-fade.
 *
 * **Also checked, not just guessed at:** whether the scroll lock itself
 * was triggering a viewport-height change (mobile browser chrome hiding/
 * showing at the exact moment scroll gets locked, which is a real,
 * independent flicker cause distinct from the animation). Since `fixed`
 * positioning combined with `100dvh`/`inset-0` re-resolves live against
 * whatever the visual viewport is at paint time, any chrome-driven resize
 * happening in that same window could show up as this shell's own
 * fixed-height element jumping size, indistinguishable from "the animation
 * glitching". Mitigated by capturing `window.visualViewport?.height ??
 * window.innerHeight` the instant the modal opens and applying it as an
 * explicit pixel height for the modal's lifetime, rather than leaving it on
 * a live `dvh`/`inset-0` calculation that could change under it. Could NOT
 * be directly verified against a real iOS Safari dynamic toolbar in this
 * environment (Chromium headless doesn't reproduce that specific browser
 * chrome behaviour even under touch emulation) — this is a reasonable,
 * low-risk mitigation for a described mechanism, not a confirmed fix.
 *
 * **Also checked and ruled out:** content popping in late inside the panel
 * causing an internal layout shift. The panel is a fixed `h-full` box, not
 * sized to its content, and its content area scrolls internally
 * (`overflow-y-auto`) rather than resizing the panel; every image inside it
 * sits in its own aspect-ratio-reserved box (e.g. `aspect-square`), so an
 * image finishing its decode cannot change that box's size. There is no
 * client-side data fetch inside any modal either — all CMS content is
 * resolved server-side in `page.tsx` before this component ever renders.
 * Nothing here should be able to shift after the panel is visible.
 *
 * Performance / mobile-scroll notes (older passes, still true):
 * - No `backdrop-blur` on the scrim (expensive to recompute every frame on
 *   a mobile GPU while it's animating).
 * - The panel animates `opacity` + `y` only, not `scale` (avoids
 *   re-rasterising text mid-transition).
 * - `will-change: transform, opacity` promotes the panel to its own
 *   compositor layer before the animation starts.
 * - **Body scroll lock uses the `position: fixed` technique.** This
 *   targets `document.body`, which is NOT actually where `/signal/links`
 *   scrolls — that page moved its own scrolling onto an inner
 *   `overflow-y-auto` div (see `LinksExperience.tsx`'s file-level comment).
 *   `LinksExperience` toggles that div's own `overflow` directly via React
 *   state; THAT is the real scroll lock for this page. This body-level lock
 *   stays here as defence-in-depth for whatever this shell is reused on
 *   next, on a page that DOES scroll at the body level.
 * - The scrim button carries `touch-action: none`, so a stray drag on the
 *   backdrop can't be interpreted as a scroll/pan gesture at all.
 * - The scrollable content pane gets `overscroll-behavior: contain` and
 *   `-webkit-overflow-scrolling: touch` (iOS momentum scrolling).
 *
 * Honesty note: this environment's headless browser is Chromium-based
 * (Edge), which does not reproduce WebKit's specific scroll-locking or
 * dynamic-toolbar quirks even under mobile/touch emulation. What WAS
 * verified under real touch-emulated Chromium: frame-by-frame screenshots
 * of the actual open transition (not just a computed-style trace) show no
 * visible hazy overlap once the scrim/panel sequencing above was in place,
 * where the same test on the previous (co-faded) version did show one.
 */

import { useLayoutEffect, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { pushModalOpen, popModalOpen } from "@/lib/modal-open";

const EASE = [0.22, 1, 0.36, 1] as const;
// The scrim reaches full opacity almost instantly and independently; the
// panel only starts once it has, so the two are never both translucent at
// the same time (see file note).
const BACKDROP_DURATION = 0.1;
const PANEL_DELAY = 0.1;
const PANEL_DURATION = 0.22;

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
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setLockedHeight(null);
      return;
    }

    // Capture the viewport height BEFORE touching scroll/overflow, so this
    // modal's own size can't drift if locking scroll happens to coincide
    // with the mobile browser's chrome showing/hiding (see file note).
    setLockedHeight(window.visualViewport?.height ?? window.innerHeight);

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
    const t = setTimeout(
      () => closeRef.current?.focus(),
      (PANEL_DELAY + PANEL_DURATION) * 1000,
    );
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

  const heightStyle = lockedHeight ? `${lockedHeight}px` : "100dvh";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim: its own fast, independent opacity transition. Not a
              parent of the panel, so its opacity never multiplies into
              the panel's. */}
          <motion.button
            key="scrim"
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{ touchAction: "none", height: heightStyle }}
            className="fixed inset-x-0 top-0 z-[60] cursor-default bg-[#050201]/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: BACKDROP_DURATION, ease: "easeOut" } }}
            exit={{ opacity: 0, transition: { duration: BACKDROP_DURATION, ease: "easeIn", delay: PANEL_DURATION } }}
          />

          {/* Panel wrapper: purely layout (centring), no opacity of its
              own, so it can't multiply with the panel's fade either. Still
              a `motion` component (with a no-op animation) rather than a
              plain div, so AnimatePresence recognises it as a direct child
              it needs to keep around — and keep waiting on — until the
              PANEL's own exit animation nested inside it finishes; a plain
              div here would let React remove the whole subtree immediately
              on close, before the panel got to play its exit at all. */}
          <motion.div
            key="panel-wrap"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            style={{ height: heightStyle }}
            className="pointer-events-none fixed inset-x-0 top-0 z-[61] flex items-center justify-center p-3 sm:p-5"
            initial={false}
            animate={{}}
            exit={{}}
          >
            <motion.div
              key="panel"
              className="pointer-events-auto relative flex h-full w-full max-w-[560px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#150807] shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
              style={{ willChange: "transform, opacity" }}
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: PANEL_DELAY, duration: PANEL_DURATION, ease: EASE },
              }}
              exit={{
                opacity: 0,
                y: 12,
                transition: { duration: PANEL_DURATION, ease: EASE },
              }}
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
        </>
      )}
    </AnimatePresence>
  );
}
