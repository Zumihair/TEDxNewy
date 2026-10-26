"use client";

import { useEffect, useRef } from "react";
import { primaryBtn } from "./SqModal";
import { prefersReducedMotion } from "../TileModal";

const COLOURS = ["#e62b1e", "#ff9b8f", "#ffffff", "#ffd2cc", "#b91404"];
const COUNT = 160;

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  colour: string;
};

/**
 * Shown the moment a player crosses the prize draw line: a full-screen
 * confetti burst, "You're in the draw" centred, and a Keep playing button
 * at the bottom. The confetti is a plain canvas (no library) that fires
 * from the top and falls under gravity, then stops redrawing once every
 * piece has left the screen. With reduced motion it is skipped entirely.
 */
export default function DrawCelebration({ onClose }: { onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx || prefersReducedMotion()) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    el.width = W * dpr;
    el.height = H * dpr;
    ctx.scale(dpr, dpr);

    const pieces: Piece[] = Array.from({ length: COUNT }, (_, i) => {
      // Two cannons in the top corners, aimed at the middle, plus a shower.
      const side = i % 3;
      const fromLeft = side === 0;
      const fromRight = side === 1;
      return {
        x: fromLeft ? 0 : fromRight ? W : Math.random() * W,
        y: side === 2 ? -20 - Math.random() * H * 0.5 : H * 0.15,
        vx: fromLeft
          ? 4 + Math.random() * 7
          : fromRight
            ? -4 - Math.random() * 7
            : (Math.random() - 0.5) * 3,
        vy: side === 2 ? 1 + Math.random() * 3 : -4 - Math.random() * 8,
        w: 6 + Math.random() * 6,
        h: 9 + Math.random() * 8,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.35,
        colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
      };
    });

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of pieces) {
        p.vy += 0.16;
        p.vx *= 0.992;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y < H + 30) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.colour;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="fixed inset-x-0 top-0 z-[90] flex flex-col items-center justify-between bg-[#120604]/95 px-6"
      style={{
        height: "100dvh",
        paddingTop: "max(1.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="You're in the draw"
    >
      <canvas
        ref={canvas}
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <span aria-hidden />
      <h2 className="relative text-center font-sans text-[44px] font-medium leading-[1.05] tracking-[-0.035em] text-white">
        You&rsquo;re in the draw
      </h2>
      <button
        type="button"
        onClick={onClose}
        autoFocus
        className={`${primaryBtn} relative max-w-[460px]`}
      >
        Keep playing
      </button>
    </div>
  );
}
