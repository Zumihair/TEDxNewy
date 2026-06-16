"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

/**
 * Live "stopwatch" counting down to the 60-Second Talk Night
 * (Wednesday 16 July 2026, 6:00pm, Newcastle West).
 *
 * Renders "--" until mounted so the server HTML and the first client paint
 * match (the live numbers depend on the current time, which differs between
 * server render and hydration). Once mounted it ticks every second.
 */

const EVENT = new Date("2026-07-16T18:00:00+10:00").getTime();

function remaining() {
  const total = Math.max(0, Math.floor((EVENT - Date.now()) / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export default function TalkNightCountdown() {
  const [t, setT] = useState<ReturnType<typeof remaining> | null>(null);

  useEffect(() => {
    setT(remaining());
    const id = setInterval(() => setT(remaining()), 1000);
    return () => clearInterval(id);
  }, []);

  const units: { label: string; value: number | null }[] = [
    { label: "Days", value: t?.days ?? null },
    { label: "Hours", value: t?.hours ?? null },
    { label: "Minutes", value: t?.minutes ?? null },
    { label: "Seconds", value: t?.seconds ?? null },
  ];

  return (
    <div className="mt-10">
      <div
        className="flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
        style={{ letterSpacing: "0.24em" }}
      >
        <Timer className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
        Counting down to the night
      </div>
      <div className="mt-5 grid max-w-[520px] grid-cols-4 gap-2.5 sm:gap-4">
        {units.map((u) => (
          <div
            key={u.label}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-4 text-center sm:px-3 sm:py-5"
          >
            <div
              className="font-sans tabular text-white"
              style={{
                fontSize: "clamp(1.9rem, 6vw, 3rem)",
                lineHeight: 1,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 96',
              }}
            >
              {u.value == null ? "--" : String(u.value).padStart(2, "0")}
            </div>
            <div
              className="mt-2 font-mono text-[9.5px] font-semibold uppercase text-white/65 sm:text-[10px]"
              style={{ letterSpacing: "0.18em" }}
            >
              {u.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
