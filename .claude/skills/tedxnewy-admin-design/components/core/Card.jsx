import React from "react";

/** White card on cream: hairline ink border, 12px radius, warm hairline shadow. */
export function Card({ children, padded = false, className = "", style }) {
  return (
    <div
      className={className}
      style={{
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--line)",
        background: "var(--surface-card)",
        boxShadow: "var(--shadow-sm)",
        padding: padded ? "var(--card-p)" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
