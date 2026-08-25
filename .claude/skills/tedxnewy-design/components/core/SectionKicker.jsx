import React from "react";

/** Eyebrow above a section heading: a short rule, then wide-tracked uppercase. */
export function SectionKicker({ label, accent = "red", inverted = false, showRule = true, style }) {
  const accentColor =
    accent === "amber" ? "#d89645" : accent === "coast" ? "#1f4a5c" : accent === "white" ? "rgba(255,255,255,0.6)" : "var(--ted-red)";
  const color = inverted ? "rgba(255,255,255,0.85)" : accentColor;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, color, ...style }}>
      {showRule && (
        <span
          aria-hidden="true"
          style={{ display: "inline-block", height: 2, width: 40, borderRadius: 999, background: inverted ? "rgba(255,255,255,0.6)" : accentColor }}
        />
      )}
      <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "var(--tracking-kicker)" }}>{label}</span>
    </div>
  );
}
