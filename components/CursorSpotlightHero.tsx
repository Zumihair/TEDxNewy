"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/**
 * TEDxNewy hero with cursor-tracking spotlight.
 * The red radial spotlight subtly follows the cursor,
 * giving the dark room a sense of intimate light.
 */
export default function CursorSpotlightHero() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPos({
        x: Math.max(20, Math.min(80, x)),
        y: Math.max(20, Math.min(80, y)),
      });
    };
    const onEnter = () => setActive(true);
    const onLeave = () => {
      setActive(false);
      setPos({ x: 50, y: 50 });
    };
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
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "50%",
          top: "50%",
          width: "min(115vw, 1700px)",
          height: "min(115vw, 1700px)",
          transform: `translate(calc(-50% + ${(pos.x - 50) * 0.6}%), calc(-50% + ${(pos.y - 50) * 0.6}%))`,
          transition: active
            ? "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)"
            : "transform 1.6s cubic-bezier(0.22, 1, 0.36, 1)",
          background:
            "radial-gradient(circle at 50% 50%, #ff3626 0%, #e11905 15%, #b91404 34%, rgba(138,13,5,0.7) 54%, rgba(42,6,4,0) 76%)",
        }}
      />
      {/* Secondary softer glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          width: "420px",
          height: "420px",
          transform: "translate(-50%, -50%)",
          transition: active
            ? "left 0.45s cubic-bezier(0.22, 1, 0.36, 1), top 0.45s cubic-bezier(0.22, 1, 0.36, 1)"
            : "left 1.2s cubic-bezier(0.22, 1, 0.36, 1), top 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,170,150,0.18) 0%, rgba(255,120,100,0.08) 40%, rgba(0,0,0,0) 70%)",
          mixBlendMode: "screen",
        }}
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
          thought-provoking — from Novocastrian stages to a global audience.
        </p>
      </div>

      {/* Bottom ticker row — Season 2026 anchor */}
      <div className="hero-entrance hero-delay-5 absolute inset-x-0 bottom-0 border-t border-white/15 bg-black/15 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-5 text-[11.5px] font-medium uppercase tracking-[0.14em] text-white/80 md:px-10">
          <div className="flex items-center gap-3">
            <span className="relative flex h-1.5 w-1.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full rounded-full ping-soft opacity-75 bg-white" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            Season 2026 · For schools · EOIs open
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <span>Youth Futures Lab</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>Wed 5 August · NUspace · EOIs close 15 June</span>
          </div>
          <Link
            href="/youth-futures-lab"
            className="flex items-center gap-1.5 font-semibold text-white hover:text-[#ff9b8f]"
          >
            Schools Application
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}
