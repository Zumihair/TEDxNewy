import React from "react";

const CELLS = ["Days", "Hours", "Minutes", "Seconds"];

/** Counts down to an event. Four bordered cells on a dark surface. */
export function CountdownClock({ target = "2026-10-24T18:00:00+11:00", label = "Counting down to the night" }) {
  const [parts, setParts] = React.useState(null);
  const [passed, setPassed] = React.useState(false);
  React.useEffect(() => {
    const t = new Date(target).getTime();
    const tick = () => {
      const total = Math.max(0, t - Date.now());
      const s = Math.floor(total / 1000);
      setPassed(Date.now() >= t);
      setParts([Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60]);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "var(--tracking-kicker-wide)", color: "var(--red-blush)" }}>
        {passed ? "The night has arrived" : label}
      </div>
      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {CELLS.map((c, i) => (
          <div key={c} style={{ borderRadius: "var(--radius-input)", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: "20px 8px", textAlign: "center" }}>
            <div style={{ fontSize: "clamp(1.9rem,6vw,3.25rem)", lineHeight: 1, fontWeight: 500, color: "#fff", fontVariantNumeric: "tabular-nums", fontVariationSettings: '"opsz" 144' }}>
              <span style={{ visibility: parts ? "visible" : "hidden" }}>{String(parts ? parts[i] : 0).padStart(2, "0")}</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 9.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.55)" }}>{c}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
