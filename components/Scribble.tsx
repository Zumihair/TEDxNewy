"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A single hand-drawn-style doodle that "draws itself in" the first time it
 * scrolls into view (see the .scribble rules in globals.css). Purely
 * decorative: aria-hidden, no interactivity. Built for the Youth Futures Lab
 * page's light, ideation-themed background, but generic enough to reuse
 * anywhere a scattering of scroll-revealed doodles fits.
 *
 * Several underline variants exist on purpose: repeating one identical rule
 * under every heading on a page reads as a UI border rather than something
 * drawn by hand. Vary them (and `rotate`) between sections.
 */

type Variant =
  | "lightbulb"
  | "spark"
  | "squiggle"
  | "spiral"
  | "underline"
  | "underlineDouble"
  | "underlineSwoosh"
  | "underlineZigzag"
  | "arrow"
  | "star"
  | "circle"
  | "burst"
  | "check";

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
  underlineDouble: {
    viewBox: "0 0 140 20",
    d: ["M4 8c22-5 46-4 66-1s44 5 66 1", "M8 15c26-4 52-3 76 0s38 3 48 1"],
  },
  underlineSwoosh: {
    viewBox: "0 0 140 24",
    d: ["M4 18c18 4 44 2 68-3s46-9 64-3c-14-6-40-2-62 3S22 22 4 18z"],
  },
  underlineZigzag: {
    viewBox: "0 0 140 20",
    d: ["M4 14l16-8 16 8 16-8 16 8 16-8 16 8 16-8 16 8"],
  },
  arrow: {
    viewBox: "0 0 64 64",
    d: ["M8 44c10-20 26-30 46-32", "M44 6l10 6-8 9"],
  },
  star: {
    viewBox: "0 0 64 64",
    d: ["M32 8l7 16 18 2-13 12 4 18-16-9-16 9 4-18L7 26l18-2z"],
  },
  circle: {
    viewBox: "0 0 64 64",
    d: [
      "M46 14C36 6 20 9 14 20s0 28 14 32 28-4 30-16-6-22-16-24-18 4-19 13 6 15 13 15 11-6 10-11",
    ],
  },
  burst: {
    viewBox: "0 0 64 64",
    d: [
      "M32 6v14",
      "M32 44v14",
      "M6 32h14",
      "M44 32h14",
      "M14 14l10 10",
      "M40 40l10 10",
      "M50 14L40 24",
      "M24 40L14 50",
    ],
  },
  check: {
    viewBox: "0 0 64 64",
    d: ["M10 34l14 14L54 14"],
  },
};

export default function Scribble({
  variant,
  className = "",
  color = "#b91404",
  delayMs = 0,
  rotate = 0,
  strokeWidth = 2.5,
  driftSeconds = 7,
}: {
  variant: Variant;
  className?: string;
  color?: string;
  delayMs?: number;
  /** Tilt, in degrees, so repeated variants don't sit at identical angles. */
  rotate?: number;
  strokeWidth?: number;
  /** Period of the idle drift. Vary it so doodles don't bob in lockstep. */
  driftSeconds?: number;
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
      { threshold: 0.2 },
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
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      /* SVG clips to its viewport by default, which lops the outer half off
         any stroke sitting on the viewBox edge. These paths are drawn to the
         edges on purpose, so let the stroke spill. */
      overflow="visible"
      className={`scribble ${visible ? "scribble-visible" : ""} ${className}`}
      /* The tilt rides on a custom property rather than `transform` because
         the idle-drift keyframes animate transform themselves, and a CSS
         animation outranks an inline style: setting transform here would be
         overridden the moment the drift starts, snapping every doodle back
         to 0deg. The keyframes fold this variable back in instead. */
      style={
        {
          transitionDelay: `${delayMs}ms`,
          animationDelay: `${delayMs}ms`,
          animationDuration: `${driftSeconds}s`,
          "--sc-rot": `${rotate}deg`,
        } as React.CSSProperties
      }
    >
      {d.map((path, i) => (
        <path key={i} d={path} pathLength={1} />
      ))}
    </svg>
  );
}
