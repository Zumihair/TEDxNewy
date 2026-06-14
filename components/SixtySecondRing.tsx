"use client";

import { useEffect, useState } from "react";

/**
 * A thematic looping 60-second ring: the stroke drains as the count falls
 * from 60 to 0, then resets. Purely decorative motif for the Talk Night
 * page, sized by the `size` prop.
 */
export default function SixtySecondRing({ size = 220 }: { size?: number }) {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => (s <= 1 ? 60 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = seconds / 60;

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e02214"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-sans tabular text-white"
          style={{
            fontSize: size * 0.34,
            lineHeight: 1,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          {seconds}
        </span>
        <span
          className="mt-1 font-mono text-[10px] font-semibold uppercase text-white/55"
          style={{ letterSpacing: "0.26em" }}
        >
          seconds
        </span>
      </div>
    </div>
  );
}
