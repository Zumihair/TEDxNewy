"use client";

import { useEffect, useState } from "react";

/**
 * Counts down to the event. `target` is an ISO string with an explicit
 * offset (Sydney is AEST/+10 in July, no daylight saving). Renders nothing
 * until mounted to avoid a server/client hydration mismatch on the time.
 */
type Parts = { days: number; hours: number; minutes: number; seconds: number };

function diffParts(targetMs: number, nowMs: number): Parts {
  const total = Math.max(0, targetMs - nowMs);
  const s = Math.floor(total / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export default function CountdownClock({
  target = "2026-07-16T18:00:00+10:00",
}: {
  target?: string;
}) {
  const [parts, setParts] = useState<Parts | null>(null);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    const targetMs = new Date(target).getTime();
    const tick = () => {
      const now = Date.now();
      setPassed(now >= targetMs);
      setParts(diffParts(targetMs, now));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const cells: Array<{ label: string; value: number }> = [
    { label: "Days", value: parts?.days ?? 0 },
    { label: "Hours", value: parts?.hours ?? 0 },
    { label: "Minutes", value: parts?.minutes ?? 0 },
    { label: "Seconds", value: parts?.seconds ?? 0 },
  ];

  return (
    <div>
      <div
        className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
        style={{ letterSpacing: "0.28em" }}
      >
        {passed ? "The night has arrived" : "Counting down to the night"}
      </div>
      <div className="mt-5 grid grid-cols-4 gap-3 sm:gap-4">
        {cells.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-white/12 bg-white/[0.04] px-2 py-5 text-center"
          >
            <div
              className="font-sans tabular text-white"
              style={{
                fontSize: "clamp(1.9rem, 6vw, 3.25rem)",
                lineHeight: 1,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              {/* Invisible placeholder keeps width stable before mount. */}
              <span style={{ visibility: parts ? "visible" : "hidden" }}>
                {String(c.value).padStart(2, "0")}
              </span>
            </div>
            <div
              className="mt-2 font-mono text-[9.5px] font-semibold uppercase text-white/55"
              style={{ letterSpacing: "0.2em" }}
            >
              {c.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
