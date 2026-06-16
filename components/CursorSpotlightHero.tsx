"use client";

import { useEffect, useRef, useState } from "react";

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
          height: "min(75vh, 115vw, 1700px)",
          transform: `translate(calc(-50% + ${(pos.x - 50) * 0.3}%), calc(-50% + ${(pos.y - 50) * 0.3}%))`,
          transition: active
            ? "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)"
            : "transform 1.6s cubic-bezier(0.22, 1, 0.36, 1)",
          background:
            "radial-gradient(circle closest-side at 50% 50%, #ff3626 0%, #e11905 18%, #b91404 38%, rgba(138,13,5,0.6) 62%, rgba(42,6,4,0) 100%)",
        }}
      />
      {/* Secondary softer glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: `calc(50% + ${(pos.x - 50) * 0.3}%)`,
          top: `calc(50% + ${(pos.y - 50) * 0.3}%)`,
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
          thought-provoking, from Novocastrian stages to a global audience.
        </p>
      </div>
    </section>
  );
}
