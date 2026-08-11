"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A single hand-drawn-style doodle that "draws itself in" the first time it
 * scrolls into view (see the .scribble rules in globals.css). Purely
 * decorative: aria-hidden, no interactivity. Built for the Youth Futures Lab
 * page's light, ideation/child-themed background, but generic enough to
 * reuse anywhere a scattering of scroll-revealed doodles fits.
 */

type Variant = "lightbulb" | "spark" | "squiggle" | "spiral" | "underline";

const PATHS: Record<Variant, { viewBox: string; d: string[] }> = {
  lightbulb: {
    viewBox: "0 0 64 64",
    d: [
      "M32 6c-11 0-19 8-19 18 0 7 4 11 7 15 2 3 3 5 3 8h18c0-3 1-5 3-8 3-4 7-8 7-15 0-10-8-18-19-18z",
      "M26 47h12",
      "M28 53h8",
    ],
  },
  spark: {
    viewBox: "0 0 64 64",
    d: ["M32 6l4 20 20 4-20 4-4 20-4-20-20-4 20-4z"],
  },
  squiggle: {
    viewBox: "0 0 120 40",
    d: ["M4 30c8-22 16 22 24 0s16-22 24 0 16 22 24 0 16-22 24 0 16 22 20 0"],
  },
  spiral: {
    viewBox: "0 0 64 64",
    d: [
      "M32 32c-1-5 3-8 7-6.5s4 7-1 9-11-1.5-11-9 7.5-15 17-11 12 13.5 5.5 21-19 7.5-25-2-2.5-19 9-27",
    ],
  },
  underline: {
    viewBox: "0 0 140 20",
    d: ["M4 12c20-10 40-10 60 0s40 10 60 0"],
  },
};

export default function Scribble({
  variant,
  className = "",
  color = "#b91404",
  delayMs = 0,
}: {
  variant: Variant;
  className?: string;
  color?: string;
  delayMs?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const { viewBox, d } = PATHS[variant];

  return (
    <svg
      ref={ref}
      aria-hidden
      viewBox={viewBox}
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`scribble ${visible ? "scribble-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {d.map((path, i) => (
        <path key={i} d={path} pathLength={1} />
      ))}
    </svg>
  );
}
