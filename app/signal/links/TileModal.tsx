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
 * **Sequencing, and why it changed 2026-09-23.** It used to run the scrim to
 * full opacity FIRST and on its own, then bring the panel in over an already
 * solid background, so no frame ever had two translucent layers over live
 * content. That also destroyed the effect this modal exists to show.
 * Measured on the live page: the scrim was at 0.97 by 100ms and 1.00 by
 * 125ms, while the panel did not begin scaling until about 100ms and was
 * still only at 0.88 once the scrim had gone fully opaque. The tile the panel
 * is supposed to grow out of was behind a solid black layer before the panel
 * had moved at all, so what anyone actually saw was a panel appearing on a
 * blank background. There was nothing left to grow out of.
 *
 * The scrim now fades ACROSS the panel's growth instead of ahead of it: when
 * the panel starts expanding the scrim is still near transparent and the tile
 * grid is plainly visible underneath, and the scrim is opaque by the time the
 * panel is big enough to cover it anyway.
 *
 * **This does not reintroduce the flicker.** The flicker's causes are the
 * four listed above, all structural, and all still fixed: no body-level
 * scroll lock, no visualViewport read, no frozen height, children mounted a
 * frame early. Scrim-first ordering was belt and braces added on top, not the
 * fix. What it bought was avoiding one extra alpha-composited layer over live
 * content briefly, and that is cheap here precisely because the backdrop is
 * `isolation: isolate` plus `translateZ(0)`: the blend stays inside that
 * layer, so a translucent scrim above it composites against a cached texture
 * rather than dragging the grain back through paint. Opacity and transform
 * only, no layout, no repaint, and the overlap lasts about 170ms.
 *
 * **Growing out of the tile (`origin`).** The panel scales up from the point
 * on screen the tile was tapped, and shrinks back into it on close, so the
 * modal reads as that tile opening rather than a separate thing appearing
 * over it. It is done with `transform-origin` plus a UNIFORM `scale`, which
 * keeps it compositor-only and, unlike scaling the panel's rect onto the
 * tile's rect (sx and sy of roughly 0.46 and 0.17 here), does not squash the
 * header text into something unreadable on the way in.
 *
 * The origin has to be written to the node imperatively, one frame after
 * mount, because it is measured against the panel's own box and the panel has
 * no box until it has mounted. That costs one `getBoundingClientRect` on a
 * layout that has just been computed anyway, and no extra React render (a
 * second render pass before paint is one of the things that used to make this
 * flicker). The panel is at `opacity: 0` for every frame before the origin
 * lands, so there is nothing on screen to jump.
 */

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { pushModalOpen, popModalOpen } from "@/lib/modal-open";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_FADE = "ease-out";

// The scrim now runs long and starts immediately, so the tile stays visible
// through the first part of the panel's growth (see the file note).
const SCRIM_MS = 260;
const SCRIM_DELAY_OUT = 70;

// Transform and opacity are given DIFFERENT durations on purpose. The panel
// should be solid early (so it reads as an object being flung out of the
// tile, not as a cross-fade) while it is still visibly growing.
const PANEL_GROW_MS = 380;
const PANEL_SHRINK_MS = 300;
const PANEL_FADE_IN_MS = 170;
const PANEL_FADE_OUT_MS = 200;
const PANEL_FADE_OUT_DELAY = 70;

const UNMOUNT_MS =
  Math.max(
    PANEL_SHRINK_MS,
    PANEL_FADE_OUT_DELAY + PANEL_FADE_OUT_MS,
    SCRIM_DELAY_OUT + SCRIM_MS,
  ) + 40;

// How small the panel starts (and ends) at the tile's point. Was 0.72, which
// measured correctly and still read as nothing much happening: a
// near-fullscreen panel going from 72% to 100% is a small change, and it was
// hidden behind an already-opaque scrim anyway. 0.34 is close to the tile's
// own share of the panel, so the panel genuinely appears to come out of it.
// The text inside is briefly small rather than distorted, because the scale
// is uniform.
const PANEL_SCALE_FROM = 0.34;

/** Where on screen the tile that opened this modal sits, in viewport px. */
export type ModalOrigin = { x: number; y: number };

/**
 * Panel height per fit setting, and the matching body classes.
 *
 * The body pairs with the panel and the two have to agree. A full-height
 * panel gives its body `flex-1`, which is what leaves space for a child's
 * `h-full`. A fitted panel gives it `flex-initial` (natural height, still
 * shrinkable) plus `min-h-0`, so that once the panel reaches `max-h-full`
 * the body can shrink below its content and scroll instead of being clipped
 * by the panel's `overflow-hidden`. `flex-none` would NOT do: it forbids
 * shrinking, so a long page would overflow the cap and be cut off.
 */
const PANEL_FIT = {
  always: "max-h-full",
  md: "h-full md:h-auto md:max-h-full",
  never: "h-full",
} as const;

const BODY_FIT = {
  always: "min-h-0 flex-initial",
  md: "flex-1 md:min-h-0 md:flex-initial",
  never: "flex-1",
} as const;

/**
 * True when the visitor has asked for reduced motion. Read at render time,
 * which is safe here ONLY because this component renders `null` until an
 * effect has run (`present`), so it never server-renders and cannot produce a
 * hydration mismatch.
 *
 * The scale is dropped entirely when this is true, rather than being pushed
 * through the preference. globals.css's `.rm-fade` then restores a plain
 * cross-fade in place of it, so Reduce Motion gets a considered reveal rather
 * than the jump cut the blanket override would otherwise give it.
 */
export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function TileModal({
  open,
  onClose,
  title,
  subtitle,
  fit,
  wide,
  origin,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /**
   * Size the panel to its own content instead of filling the screen, still
   * capped at the same near-fullscreen maximum. A full-height panel with a
   * short page in it leaves a large empty area under the content that reads
   * as a rendering fault rather than as breathing room.
   *
   * Three settings, because the right answer differs by breakpoint. Measured
   * per modal rather than guessed: the same content that needs every pixel
   * of a 390x844 phone has hundreds of pixels spare in a 940px-wide panel on
   * a laptop.
   *
   * - `"always"`: fits at every width (Sponsors, About, Signal Activity).
   * - `"md"`: full height on a phone, fits from `md` up (Program, Speakers,
   *   the Event Week Guide). This is the setting that lets a modal keep the
   *   height it genuinely needs on a phone.
   * - omitted: always full height.
   *
   * **Two things disqualify a modal from being fitted, both established by
   * measuring the real page rather than by reasoning about it:**
   *
   * 1. **Its content changes size while it is open.** A fitted panel follows
   *    its content, so the whole dialog resizes under the reader. The Event
   *    Week Guide (nine pages you swipe through) ran 571, then 860 for seven
   *    pages, then 495 at 1440x900. The Speakers modal (a grid and a bio in
   *    one panel) ran 721 for the grid and 860 for every bio. Both are full
   *    height instead.
   * 2. **A child needs `h-full`.** A fitted panel has no leftover space, so
   *    that height would resolve against a box the child is itself sizing.
   *
   * Those two rules pointing the same way is not a coincidence: a grid that
   * stretches to fill the panel is also a grid that can never change the
   * panel's height.
   */
  fit?: "always" | "md";
  /**
   * Opt OUT of the wider desktop panel and stay 560px at every width. For a
   * modal whose content genuinely has nothing to do with extra width, where
   * a wide panel would just stretch a short line of text across a laptop.
   */
  wide?: false;
  /**
   * Centre of the tile that opened this modal, in viewport pixels. The panel
   * grows out of that point and shrinks back into it. Omitted, it grows from
   * its own centre.
   */
  origin?: ModalOrigin | null;
  children: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Mirrored into a ref so the open effect can read the latest origin without
  // listing it as a dependency. All six modals share one `origin` prop from
  // the page, so depending on it would re-run this effect in the five CLOSED
  // modals every time a different tile is opened.
  const originRef = useRef(origin);
  originRef.current = origin;
  // `present` = in the DOM (stays true through the close transition).
  // `shown` = the visible end state. Mount happens on `present`, the
  // transition only starts once `shown` flips a frame later.
  const [present, setPresent] = useState(false);
  const [shown, setShown] = useState(false);
  // Safe to read during render: see `prefersReducedMotion`. Nothing below
  // this line runs on the server, because `present` gates the whole return.
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (!open) {
      setShown(false);
      const t = setTimeout(() => setPresent(false), UNMOUNT_MS);
      return () => clearTimeout(t);
    }

    setPresent(true);
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      // One layout read, on the frame after mount, written straight to the
      // node: no state, so no extra render before paint. React never touches
      // `transformOrigin` (it is in no style object it manages), so this
      // survives the `shown` re-render and the whole close transition.
      const node = panelRef.current;
      const from = originRef.current;
      if (node && from) {
        // `getBoundingClientRect` reports the VISUAL box, and this panel is
        // already scaled down at this point, so its rect is both smaller and
        // inset from where the panel actually lays out. Measured off that
        // rect the origin lands well short of the tile (verified: 213px
        // where the tile centre was 262px into the panel).
        //
        // The transform-origin is still the default 50% 50% on this frame,
        // so the visual box is centred on the LAYOUT centre: that centre is
        // usable as-is, and `offsetWidth`/`offsetHeight` give the layout
        // size, which no transform touches. The two together rebuild the
        // untransformed box without hardcoding the scale.
        const r = node.getBoundingClientRect();
        const w = node.offsetWidth;
        const h = node.offsetHeight;
        const left = r.left + r.width / 2 - w / 2;
        const top = r.top + r.height / 2 - h / 2;
        // The origin is allowed OUTSIDE the panel, which matters from `md` up
        // where the hub is a wide card grid: a card in the right-hand column
        // sits well past the edge of a 560px panel, and pinning the origin to
        // that edge would make every card on that side appear to come from
        // the same place. transform-origin takes values beyond the box
        // happily. Bounded to one panel dimension either side purely so a
        // stale or wrong rect cannot produce something absurd.
        //
        // No effect on a phone: the panel is near-fullscreen there, so a tile
        // centre is always inside it and this resolves to exactly the number
        // the old 0-to-w clamp gave.
        const bound = (v: number, size: number) =>
          Math.max(-size, Math.min(size * 2, v));
        const ox = bound(from.x - left, w);
        const oy = bound(from.y - top, h);
        node.style.transformOrigin = `${ox}px ${oy}px`;
      }
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
    const t = setTimeout(() => closeRef.current?.focus(), PANEL_GROW_MS);
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
        className={`rm-fade fixed inset-0 z-[60] cursor-default bg-[#0b0402] transition-opacity ease-out ${
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
          ref={panelRef}
          style={{
            // Order matches transitionProperty: opacity first, transform
            // second. Two durations, because the panel should go solid well
            // before it has finished growing.
            transitionProperty: "opacity, transform",
            transitionDuration: shown
              ? `${PANEL_FADE_IN_MS}ms, ${PANEL_GROW_MS}ms`
              : `${PANEL_FADE_OUT_MS}ms, ${PANEL_SHRINK_MS}ms`,
            transitionTimingFunction: `${EASE_FADE}, ${EASE}`,
            transitionDelay: shown
              ? "0ms, 0ms"
              : `${PANEL_FADE_OUT_DELAY}ms, 0ms`,
            willChange: "opacity, transform",
            // Inline rather than Tailwind's scale utilities: those write the
            // separate `scale` property, which is not in the transition list
            // above and would snap instead of animating. One transform,
            // uniform, about the tile's point (set imperatively above).
            //
            // Reduce Motion drops the scale on BOTH states, so the panel is
            // never at a size it did not lay out at and there is no abrupt
            // resize on close either. globals.css's `.rm-fade` turns what is
            // left into a plain cross-fade.
            transform: reduced
              ? "translateZ(0)"
              : shown
                ? "translateZ(0) scale(1)"
                : `translateZ(0) scale(${PANEL_SCALE_FROM})`,
            opacity: shown ? 1 : 0,
          }}
          className={`rm-fade pointer-events-auto relative flex w-full flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#150807] shadow-[0_30px_100px_rgba(0,0,0,0.6)] ${
            // Phone-shaped at phone widths, genuinely wider from md up. A
            // 560px panel centred on a laptop is the same tall narrow column
            // the hub screen had, one level down, and the contents below lay
            // themselves out differently once there is width to use.
            wide === false ? "max-w-[560px]" : "max-w-[560px] md:max-w-[760px] lg:max-w-[940px]"
          } ${PANEL_FIT[fit ?? "never"]}`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 pb-4 pt-6 md:px-8">
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

          {/* See PANEL_FIT / BODY_FIT for why these two have to agree. */}
          <div
            className={`overflow-y-auto overscroll-contain px-6 py-6 md:px-8 ${BODY_FIT[fit ?? "never"]}`}
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
