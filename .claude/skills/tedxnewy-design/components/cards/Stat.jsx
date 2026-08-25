import React from "react";

/** A single honest number: huge figure, label, optional small caps sub-line. */
export function Stat({ value, suffix, suffixColor = "var(--red-section)", label, sub, tone = "light" }) {
  const isLight = tone === "light";
  return (
    <div>
      <div style={{ fontSize: "var(--fs-stat)", lineHeight: 0.9, fontWeight: 500, letterSpacing: "-0.04em", color: isLight ? "#fff" : "var(--ink)", fontVariationSettings: '"opsz" 144' }}>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
        {suffix && <span style={{ color: suffixColor }}>{suffix}</span>}
      </div>
      <div style={{ marginTop: 20, fontSize: 14.5, fontWeight: 500, lineHeight: 1.3, color: isLight ? "#fff" : "var(--ink)" }}>{label}</div>
      {sub && (
        <div style={{ marginTop: 6, fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.2em", color: isLight ? "rgba(255,255,255,0.75)" : "var(--ink-3)" }}>{sub}</div>
      )}
    </div>
  );
}
