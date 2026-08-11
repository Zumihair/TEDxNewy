"use client";

import { useEffect, useState } from "react";

type Testimonial = { quote: string; name: string };

const INTERVAL_MS = 5000;
const FADE_MS = 400;

/**
 * A single spotlighted quote that auto-advances through the list on a
 * timer, cross-fading between them. Pauses on hover/focus so a reader
 * partway through a longer quote isn't cut off; aria-live announces each
 * change for screen readers. Dot indicators show position (not clickable —
 * this is a passive spotlight, not a manual carousel).
 */
export default function TestimonialCarousel({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || testimonials.length <= 1) return;
    const tick = setInterval(() => {
      setVisible(false);
      const swap = setTimeout(() => {
        setIndex((i) => (i + 1) % testimonials.length);
        setVisible(true);
      }, FADE_MS);
      return () => clearTimeout(swap);
    }, INTERVAL_MS);
    return () => clearInterval(tick);
  }, [paused, testimonials.length]);

  const current = testimonials[index];

  return (
    <div
      className="mx-auto max-w-[760px] text-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
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

      <div className="mt-10 flex items-center justify-center gap-2">
        {testimonials.map((t, i) => (
          <span
            key={t.name}
            aria-hidden
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === index ? "24px" : "6px",
              background:
                i === index ? "#ff9b8f" : "rgba(255,255,255,0.25)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
