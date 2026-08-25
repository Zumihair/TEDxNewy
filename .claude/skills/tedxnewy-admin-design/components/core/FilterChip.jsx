import React from "react";

/**
 * A mono-caps filter pill. Active is ink-filled with cream text; inactive is
 * a hairline white pill that lifts 2px on hover. Where a filter maps to a
 * status that already has a chip colour, pass that colour pair as `passive`
 * so the inactive pill previews the status it filters to.
 */
export function FilterChip({ active, passive, count, title, href = "#", onClick, children }) {
  const [hover, setHover] = React.useState(false);
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    borderRadius: "var(--radius-pill)",
    padding: "6px 14px",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-label)",
    fontWeight: "var(--weight-semibold)",
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    textDecoration: "none",
    border: "1px solid transparent",
    transition: "all var(--dur-base)",
    transform: hover && !active ? "translateY(-2px)" : "none",
  };
  const skin = active
    ? { background: "var(--ink)", color: "var(--cream)" }
    : passive
      ? { background: passive.bg, color: passive.fg }
      : { background: "var(--surface-card)", borderColor: "rgba(20,18,16,0.12)", color: hover ? "var(--ink)" : "var(--ink-3)" };
  return (
    <a
      href={href}
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...skin, cursor: active ? "default" : "pointer" }}
    >
      {children}
      {typeof count === "number" && <span style={{ opacity: 0.75, fontVariantNumeric: "tabular-nums" }}>· {count}</span>}
    </a>
  );
}
