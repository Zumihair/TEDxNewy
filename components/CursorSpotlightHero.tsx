"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/** Quick links surfaced in the hero ticker row. */
const TICKER_LINKS = [
  { href: "/60-second-talk-night", label: "60-Second Talk Night" },
  { href: "/youth-futures-lab", label: "Youth Futures Lab" },
];

/**
 * TEDxNewy hero with cursor-tracking spotlight.
 * The red radial spotlight subtly follows the cursor,
 * giving the dark room a sense of intimate light.
 */
export default function CursorSpotlightHero() {
  const ref = useRef<HTMLDivElement | null>(null);
  const primaryRef = useRef<HTMLDivElement | null>(null);
  const secondaryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Write the spotlight offsets straight to CSS custom properties so
    // pointer movement never triggers a React re-render.
    const apply = (dx: number, dy: number, active: boolean) => {
      const primary = primaryRef.current;
      const secondary = secondaryRef.current;
      if (primary) {
        primary.style.setProperty("--dx", `${dx}%`);
        primary.style.setProperty("--dy", `${dy}%`);
        primary.style.transition = active
          ? "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)"
          : "transform 1.6s cubic-bezier(0.22, 1, 0.36, 1)";
      }
      if (secondary) {
        secondary.style.setProperty("--dx", `${dx}%`);
        secondary.style.setProperty("--dy", `${dy}%`);
        secondary.style.transition = active
          ? "left 0.45s cubic-bezier(0.22, 1, 0.36, 1), top 0.45s cubic-bezier(0.22, 1, 0.36, 1)"
          : "left 1.2s cubic-bezier(0.22, 1, 0.36, 1), top 1.2s cubic-bezier(0.22, 1, 0.36, 1)";
      }
    };
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = Math.max(
        20,
        Math.min(80, ((e.clientX - rect.left) / rect.width) * 100),
      );
      const y = Math.max(
        20,
        Math.min(80, ((e.clientY - rect.top) / rect.height) * 100),
      );
      apply((x - 50) * 0.3, (y - 50) * 0.3, true);
    };
    const onEnter = () => apply(0, 0, true);
    const onLeave = () => apply(0, 0, false);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100vh] items-center justify-center overflow-hidden"
      style={{ background: "#2a0604" }}
    >
      {/* THE cursor-following spotlight */}
      <div
        ref={primaryRef}
        aria-hidden
        className="pointer-events-none absolute"
        style={
          {
            left: "50%",
            top: "50%",
            "--dx": "0%",
            "--dy": "0%",
            width: "min(115vw, 1700px)",
            height: "min(75vh, 115vw, 1700px)",
            transform:
              "translate(calc(-50% + var(--dx)), calc(-50% + var(--dy)))",
            transition: "transform 1.6s cubic-bezier(0.22, 1, 0.36, 1)",
            background:
              "radial-gradient(circle closest-side at 50% 50%, #ff3626 0%, #e11905 18%, #b91404 38%, rgba(138,13,5,0.6) 62%, rgba(42,6,4,0) 100%)",
          } as CSSProperties
        }
      />
      {/* Secondary softer glow */}
      <div
        ref={secondaryRef}
        aria-hidden
        className="pointer-events-none absolute"
        style={
          {
            left: "calc(50% + var(--dx))",
            top: "calc(50% + var(--dy))",
            "--dx": "0%",
            "--dy": "0%",
            width: "420px",
            height: "420px",
            transform: "translate(-50%, -50%)",
            transition:
              "left 1.2s cubic-bezier(0.22, 1, 0.36, 1), top 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,170,150,0.18) 0%, rgba(255,120,100,0.08) 40%, rgba(0,0,0,0) 70%)",
            mixBlendMode: "screen",
          } as CSSProperties
        }
      />

      {/* Grain overlay */}
      <div className="grain pointer-events-none absolute inset-0 opacity-50" />

      {/* Main hero content */}
      <div className="relative z-10 w-full max-w-[1440px] px-6 py-40 text-center md:px-10">
        <h1
          className="hero-entrance hero-delay-1 mx-auto font-sans font-normal tracking-[-0.035em] text-white balance"
          style={{
            fontSize: "clamp(3.5rem, 12vw, 11rem)",
            lineHeight: 0.96,
            letterSpacing: "-0.035em",
            fontWeight: 400,
          }}
        >
          Ideas that refuse to sit still.
        </h1>

        <p
          className="hero-entrance hero-delay-2 mx-auto mt-12 max-w-[48ch] font-sans font-normal text-white/90"
          style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.35rem)", lineHeight: 1.55 }}
        >
          TEDxNewy champions all that is remarkable, challenging and
          thought-provoking, from Novocastrian stages to a global audience.
        </p>
      </div>

      {/* Bottom ticker row — quick links into the season's events */}
      <div className="hero-entrance hero-delay-5 absolute inset-x-0 bottom-0 border-t border-white/15 bg-black/15 backdrop-blur-sm">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 divide-y divide-white/10 md:grid-cols-3 md:divide-y-0 md:divide-x">
          {TICKER_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group flex items-center justify-between gap-3 px-6 py-4 text-[11.5px] font-medium uppercase tracking-[0.14em] text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white md:justify-center md:px-8 md:py-5"
            >
              <span>{l.label}</span>
              <ArrowUpRight
                className="h-3.5 w-3.5 shrink-0 text-white/50 transition-colors group-hover:text-[#ff9b8f]"
                strokeWidth={2.5}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
