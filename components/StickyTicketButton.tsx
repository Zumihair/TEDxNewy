"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";

/**
 * Floating "Get tickets" pill, shown once the visitor scrolls past the hero
 * (which already has its own ticket button) and hidden again near the
 * bottom of the page (the final CTA section already has one too, no need
 * to stack a second on top of it). A quick bounce every 4s (see .cta-jump
 * in globals.css) draws the eye without being a constant distraction.
 *
 * **From `md:` up it sits centred along the bottom edge**, not in the
 * corner, and it grows once the visitor is deeper than `DEEP_POINT` through
 * the page: bigger type, more padding, and `note` appears beside the label.
 * The reasoning is that someone who has read most of a long sales page is
 * closer to deciding than someone who has just scrolled past the hero, so
 * the CTA earns more room the further down it follows them.
 *
 * Mobile deliberately keeps the bottom-right corner. A centred pill on a
 * phone covers the middle of whatever is being read, and the corner is
 * already where the site puts floating controls.
 *
 * **The centring lives on the wrapper, and it has to.** `.cta-jump` animates
 * `transform` on the anchor, and a CSS animation outranks a utility class,
 * so `-translate-x-1/2` on the anchor itself would be overwritten the moment
 * the bounce ran and the button would sit half a width off centre. Same trap
 * as the Scribble tilt (see components/Scribble.tsx). Keep the horizontal
 * positioning and the animation on separate elements.
 */

/** Fraction of the scrollable height past which the CTA steps up. */
const DEEP_POINT = 0.45;

export default function StickyTicketButton({
  href,
  note,
}: {
  href: string;
  /** Short supporting line, shown beside the label on desktop once deep. */
  note?: string;
}) {
  const [show, setShow] = useState(false);
  const [deep, setDeep] = useState(false);

  useEffect(() => {
    function onScroll() {
      const scrollY = window.scrollY;
      const viewport = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const pastHero = scrollY > viewport * 0.9;
      const nearBottom = scrollY + viewport > docHeight - 700;
      setShow(pastHero && !nearBottom);

      const scrollable = Math.max(1, docHeight - viewport);
      setDeep(scrollY / scrollable > DEEP_POINT);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={`fixed bottom-5 right-5 z-40 transition-all duration-300 md:right-auto md:left-1/2 md:-translate-x-1/2 ${
        show
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <a
        href={href}
        tabIndex={show ? 0 : -1}
        // Transition named properties, never `all`: `all` would include
        // `transform`, which the bounce keyframes own.
        className={`cta-jump inline-flex items-center rounded-full bg-[#e02214] font-sans font-medium text-white transition-[padding,font-size,gap,background-color,box-shadow] duration-300 hover:bg-[#b91404] ${
          deep
            ? "gap-3 px-8 py-4 text-[16px] shadow-[0_22px_55px_-12px_rgba(224,34,20,0.85)]"
            : "gap-2 px-6 py-3.5 text-[14.5px] shadow-[0_16px_40px_-12px_rgba(224,34,20,0.7)]"
        }`}
      >
        Get tickets
        {note && deep && (
          <>
            <span
              aria-hidden
              className="hidden h-4 w-px bg-white/40 md:block"
            />
            <span className="hidden text-[13.5px] font-normal text-white/90 md:block">
              {note}
            </span>
          </>
        )}
        <ArrowUpRight className="h-4 w-4 shrink-0" strokeWidth={2} />
      </a>
    </div>
  );
}
