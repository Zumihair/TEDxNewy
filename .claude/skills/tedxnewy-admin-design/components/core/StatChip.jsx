import React from "react";

/**
 * Small value + label tile. The house way to show a metric: never a run-on
 * sentence of numbers. Sits in a grid of 3.
 */
export function StatChip({ value, label }) {
  return (
    <div style={{ borderRadius: "var(--radius-statchip)", background: "var(--surface-chip)", padding: "8px 10px" }}>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-stat-sm)",
          fontWeight: "var(--weight-medium)",
          lineHeight: 1,
          letterSpacing: "var(--tracking-tight)",
          color: "var(--ink)",
          fontVariantNumeric: "tabular-nums",
          fontVariationSettings: "var(--display-variation)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: "4px",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-statchip-label)",
          fontWeight: "var(--weight-semibold)",
          textTransform: "uppercase",
          lineHeight: 1.2,
          letterSpacing: "var(--tracking-statchip)",
          color: "var(--ink-4)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

/** A grid of StatChips — three across, the admin's default metric block. */
export function StatChipGrid({ columns = 3, children }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`, gap: "6px" }}>{children}</div>;
}
