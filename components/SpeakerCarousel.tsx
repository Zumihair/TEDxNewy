"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SpeakerCard from "@/components/SpeakerCard";
import type { Speaker } from "@/lib/data";

/**
 * Horizontal, swipeable speaker lineup for flagship event pages (see the
 * isFlagship branch in app/events/[slug]/page.tsx). Touch/trackpad swipe
 * works on every breakpoint; desktop additionally gets prev/next arrow
 * buttons and a visible (not hidden) scrollbar, since a mouse has no swipe
 * gesture of its own.
 */
export default function SpeakerCarousel({ speakers }: { speakers: Speaker[] }) {
  const trackRef = useRef<HTMLUListElement>(null);

  function scrollByCard(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("li");
    const step = (card?.clientWidth ?? 240) + 24; // card width + gap
    track.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 px-5 md:px-6">
        <div
          className="text-[10.5px] font-semibold uppercase text-[#b91404]"
          style={{ letterSpacing: "0.24em" }}
        >
          The lineup
        </div>
        {/* Arrow controls — desktop only; touch devices swipe instead. */}
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="Scroll speakers left"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(20,18,16,0.15)] text-[#141210] transition-colors hover:border-[#b91404] hover:bg-[#b91404] hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Scroll speakers right"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(20,18,16,0.15)] text-[#141210] transition-colors hover:border-[#b91404] hover:bg-[#b91404] hover:text-white"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
      </div>
      <h2
        className="mt-4 px-5 font-sans tracking-[-0.025em] text-[#141210] balance md:px-6"
        style={{
          fontSize: "clamp(1.65rem, 3vw, 2.25rem)",
          lineHeight: 1.1,
          fontWeight: 500,
          fontVariationSettings: '"opsz" 144',
        }}
      >
        Speakers
      </h2>
      <ul
        ref={trackRef}
        className="carousel-scrollbar mt-10 flex snap-x snap-mandatory scroll-pl-5 gap-5 overflow-x-auto px-5 pb-4 md:gap-6 md:scroll-pl-6 md:px-6"
      >
        {speakers.map((s) => (
          <li
            key={s.slug}
            className="w-[46vw] shrink-0 snap-start sm:w-[30vw] md:w-[240px]"
          >
            <SpeakerCard speaker={s} />
          </li>
        ))}
      </ul>
    </div>
  );
}
