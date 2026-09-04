"use client";

import { useEffect } from "react";

/**
 * The ticket tiers are a swipe carousel below `md` and a grid at `md` and up
 * (see the `<ul data-ticket-carousel>` on the Signal page). Left alone the
 * carousel opens on the first card, Concession, which is sold out. This nudges
 * it to Standard on load, but only while it's actually a horizontal carousel:
 * at `md` and up the list is a grid with nothing to scroll, so the guard
 * (`scrollWidth > clientWidth`) skips it and desktop is untouched.
 *
 * It renders nothing; it only reads the DOM its siblings produced.
 */
export default function TicketCarouselAutoScroll() {
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>("[data-ticket-carousel]");
      if (!el) return;
      // Grid layout (md+) or content that fits: nothing to scroll.
      if (el.scrollWidth <= el.clientWidth + 4) return;
      const target = el.querySelector<HTMLElement>('[data-tier="standard"]');
      if (!target) return;
      // Align Standard to the start, allowing for the list's scroll padding
      // (scroll-pl-5 ≈ 20px). `auto` so it lands there without an animation.
      const left = Math.max(0, target.offsetLeft - el.offsetLeft - 20);
      el.scrollTo({ left, behavior: "auto" });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}
