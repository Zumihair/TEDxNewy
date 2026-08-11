"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Testimonial = { quote: string; name: string };

const INTERVAL_MS = 5000;
const FADE_MS = 400;

/**
 * A single spotlighted quote that auto-advances through the list on a fixed
 * 5s timer (no hover-pause — it keeps moving), cross-fading between them.
 * Prev/next arrows step manually and reset the timer so a manual click
 * doesn't get immediately undone by the next tick. aria-live announces each
 * change for screen readers; dot indicators show position.
 */
export default function TestimonialCarousel({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const goTo = useCallback(
    (next: number) => {
      setVisible(false);
      setTimeout(() => {
        setIndex(((next % testimonials.length) + testimonials.length) % testimonials.length);
        setVisible(true);
      }, FADE_MS);
    },
    [testimonials.length],
  );

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const tick = setInterval(() => {
      goTo(index + 1);
    }, INTERVAL_MS);
    return () => clearInterval(tick);
    // Re-armed every time the index changes (including manual nav), so a
    // manual step always gets a fresh 5s before the next auto-advance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, testimonials.length]);

  const current = testimonials[index];

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Previous quote"
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-[#ff9b8f] hover:text-[#ff9b8f] sm:flex"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
        </button>

        <div className="text-center">
          <div
            aria-live="polite"
            className="transition-opacity ease-out"
            style={{
              opacity: visible ? 1 : 0,
              transitionDuration: `${FADE_MS}ms`,
              minHeight: "9em",
            }}
          >
            <blockquote
              className="font-sans tracking-[-0.01em] text-white balance"
              style={{
                fontSize: "clamp(1.4rem, 3.2vw, 2rem)",
                lineHeight: 1.35,
                fontVariationSettings: '"opsz" 96',
              }}
            >
              &ldquo;{current.quote}&rdquo;
            </blockquote>
            <div
              className="mt-6 font-mono text-[11px] font-semibold uppercase text-[#ff9b8f]"
              style={{ letterSpacing: "0.16em" }}
            >
              {current.name}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Next quote"
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-[#ff9b8f] hover:text-[#ff9b8f] sm:flex"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>

      {/* Mobile arrows — flanking the quote crowds a narrow screen, so they
          move below, next to the dots, instead of disappearing outright. */}
      <div className="mt-10 flex items-center justify-center gap-6 sm:hidden">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Previous quote"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
        </button>
        <div className="flex items-center gap-2">
          {testimonials.map((t, i) => (
            <span
              key={t.name}
              aria-hidden
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === index ? "24px" : "6px",
                background: i === index ? "#ff9b8f" : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Next quote"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>

      <div className="mt-10 hidden items-center justify-center gap-2 sm:flex">
        {testimonials.map((t, i) => (
          <span
            key={t.name}
            aria-hidden
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === index ? "24px" : "6px",
              background: i === index ? "#ff9b8f" : "rgba(255,255,255,0.25)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
