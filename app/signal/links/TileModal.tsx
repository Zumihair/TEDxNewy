"use client";

/**
 * The one reusable modal shell every /signal/links tile opens into.
 * Near-fullscreen on every breakpoint, slim uniform margin, rounded corners.
 *
 * **Why this is hand-rolled CSS rather than motion/react.**
 * Four separate things used to land on the single frame a tile was tapped,
 * which is why the open flickered on phones and looked fine on desktop (a
 * desktop GPU absorbs the cost; a phone drops the frame):
 *
 * 1. The scroll lock set `document.body { position: fixed }`. This page does
 *    not scroll at the body level — `LinksExperience` scrolls in its own
 *    inner div — so the lock did nothing useful, but taking `<body>` out of
 *    flow still forced a full-document reflow and repaint.
 * 2. That repaint is unusually expensive here: the page backdrop carries a
 *    `.grain` overlay, which is `mix-blend-mode` over a full-viewport image.
 *    Blend modes must read back and re-composite everything beneath them, so
 *    a full-viewport repaint of that layer is far costlier than a normal one.
 *    (`LinksExperience` now isolates and promotes that backdrop so it
 *    rasterises once and repaints elsewhere can't drag it back in.)
 * 3. Reading `visualViewport.height` and then immediately writing body styles
 *    forced a synchronous layout, and storing it in state caused a second
 *    render pass before paint. It also froze the modal's height for its whole
 *    lifetime, so if the mobile toolbar hid or showed while the modal was up,
 *    the scrim stopped covering the screen. Plain `fixed inset-0` handles
 *    this natively; nothing to capture, nothing to go stale.
 * 4. `children` mounted on the same frame the animation started. The Event
 *    Week Guide is nine pages of real markup — style, layout and paint for
 *    that subtree competed with the transition for the main thread.
 *
 * The fix for (4) is the shape of this component: mount the DOM first in its
 * hidden state, let the browser lay it out and paint it while it is still
 * invisible, and only flip to the visible state a frame later so the
 * transition itself is compositor-only (opacity and transform). That is the
 * same mount-then-animate approach that fixed the page's entry fade, and it
 * needs the two states to be plain CSS classes rather than an animation
 * library's enter/exit lifecycle.
 *
 * Sequencing: the scrim reaches full opacity first and on its own, then the
 * panel fades and lifts in on top of an already-solid background, so there is
 * never a frame where two translucent layers stack over live content. Closing
 * reverses it. The scrim is fully opaque at rest for the same reason.
 */

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { pushModalOpen, popModalOpen } from "@/lib/modal-open";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SCRIM_MS = 120;
const PANEL_MS = 220;
const PANEL_DELAY_IN = 90;
const SCRIM_DELAY_OUT = 150;
const UNMOUNT_MS = SCRIM_DELAY_OUT + SCRIM_MS + 30;

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
  // `present` = in the DOM (stays true through the close transition).
  // `shown` = the visible end state. Mount happens on `present`, the
  // transition only starts once `shown` flips a frame later.
  const [present, setPresent] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) {
      setShown(false);
      const t = setTimeout(() => setPresent(false), UNMOUNT_MS);
      return () => clearTimeout(t);
    }

    setPresent(true);
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // overscroll-behavior is not a layout property, so unlike the old
    // body-pinning lock this costs nothing to toggle.
    const html = document.documentElement;
    const prev = html.style.overscrollBehavior;
    html.style.overscrollBehavior = "none";
    pushModalOpen();
    return () => {
      html.style.overscrollBehavior = prev;
      popModalOpen();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(
      () => closeRef.current?.focus(),
      PANEL_DELAY_IN + PANEL_MS,
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

  if (!present) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          touchAction: "none",
          transitionDuration: `${SCRIM_MS}ms`,
          transitionDelay: shown ? "0ms" : `${SCRIM_DELAY_OUT}ms`,
        }}
        className={`fixed inset-0 z-[60] cursor-default bg-[#0b0402] transition-opacity ease-out ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="pointer-events-none fixed inset-0 z-[61] flex items-center justify-center p-3 sm:p-5"
      >
        <div
          style={{
            transitionProperty: "opacity, transform",
            transitionDuration: `${PANEL_MS}ms`,
            transitionTimingFunction: EASE,
            transitionDelay: shown ? `${PANEL_DELAY_IN}ms` : "0ms",
            willChange: "opacity, transform",
          }}
          className={`pointer-events-auto relative flex h-full w-full max-w-[560px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#150807] shadow-[0_30px_100px_rgba(0,0,0,0.6)] ${
            shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
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
        </div>
      </div>
    </>
  );
}
