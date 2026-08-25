import React from "react";

/**
 * The admin's list/table pattern: a Card holding hairline-divided rows.
 * The ROW is the click target (a clickable row, not a separate "open"
 * button); actions on the right are icon buttons. Compact by default —
 * this admin favours dense lists over card grids.
 */
export function DataList({ children, style }) {
  return (
    <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--line)", background: "var(--surface-card)", boxShadow: "var(--shadow-sm)", overflow: "hidden", ...style }}>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>{children}</ul>
    </div>
  );
}

export function DataRow({ title, meta, actions, href = "#", onClick, hoverColor = "var(--section-ink)", first }) {
  const [hover, setHover] = React.useState(false);
  return (
    <li
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        gap: "16px",
        padding: "var(--row-py) var(--row-px)",
        borderTop: first ? "none" : "1px solid var(--line)",
        background: hover ? "rgba(20,18,16,0.015)" : "transparent",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <a
          href={href}
          onClick={onClick}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-row-title)",
            fontWeight: "var(--weight-medium)",
            letterSpacing: "-0.005em",
            textDecoration: "none",
            color: hover ? hoverColor : "var(--ink)",
            transition: "color var(--dur-base)",
          }}
        >
          {title}
        </a>
        {meta && (
          <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: "12px", rowGap: "4px", fontSize: "var(--text-meta)", color: "var(--ink-3)" }}>{meta}</div>
        )}
      </div>
      {actions && <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>{actions}</div>}
    </li>
  );
}

/** A mono, tabular meta value inside a row (order numbers, ids, counts). */
export function RowMeta({ children }) {
  return <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-label)", color: "var(--ink-4)", fontVariantNumeric: "tabular-nums" }}>{children}</span>;
}
