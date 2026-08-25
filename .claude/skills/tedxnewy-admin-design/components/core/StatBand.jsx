import React from "react";

/**
 * The dark stat band: two to five big display numbers on near-black, each
 * with a full-sentence label. The admin's answer to "the numbers that matter
 * on this page", used at the top of Tickets and Partners.
 *
 * Distinct from PulseTile — a band is one dark block of context-setting
 * totals, not a row of clickable cards.
 */
export function StatBand({ children, columns = 4 }) {
  return (
    <section style={{ borderRadius: "var(--radius-md)", background: "var(--band-bg)", padding: "24px 32px", color: "var(--band-fg)" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`, columnGap: "24px", rowGap: "20px" }}>
        {children}
      </div>
    </section>
  );
}

/** One number in a StatBand. `tone="good"` tints it mint — for a total worth celebrating. */
export function BandStat({ value, label, tone }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "clamp(1.9rem, 3.4vw, 2.6rem)",
          fontWeight: "var(--weight-medium)",
          lineHeight: 1,
          letterSpacing: "-0.03em",
          fontVariantNumeric: "tabular-nums",
          fontVariationSettings: "var(--display-variation)",
          color: tone === "good" ? "var(--band-good)" : "var(--band-fg)",
        }}
      >
        {value}
      </div>
      <div style={{ marginTop: "8px", fontSize: "12.5px", lineHeight: 1.45, color: "var(--band-label)" }}>{label}</div>
    </div>
  );
}
