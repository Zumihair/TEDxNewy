import React from "react";

const CHIP = {
  yellow: ["var(--sec-yellow-chip-bg)", "var(--sec-yellow-chip-fg)", "var(--sec-yellow-border)", "var(--sec-yellow-border-hover)"],
  coast: ["var(--sec-coast-chip-bg)", "var(--sec-coast-chip-fg)", "var(--sec-coast-border)", "var(--sec-coast-border-hover)"],
  red: ["var(--sec-red-chip-bg)", "var(--sec-red-chip-fg)", "var(--sec-red-border)", "var(--sec-red-border-hover)"],
  green: ["var(--sec-green-chip-bg)", "var(--sec-green-chip-fg)", "var(--sec-green-border)", "var(--sec-green-border-hover)"],
  grey: ["var(--sec-grey-chip-bg)", "var(--sec-grey-chip-fg)", "var(--sec-grey-border)", "var(--sec-grey-border-hover)"],
};

/**
 * A dashboard tile: 84px, 2px border in its family's hue, a coloured icon
 * chip, and either a live count or an open arrow (for a tool with no count).
 * `feature` renders the one primary action as a full-red tile.
 */
export function DashboardTile({ section = "grey", icon, title, count, tool, feature, href = "#", onClick }) {
  const [hover, setHover] = React.useState(false);
  const [bg, fg, border, borderHover] = CHIP[section] || CHIP.grey;
  const common = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "var(--tile-h)",
    boxSizing: "border-box",
    borderRadius: "var(--radius-md)",
    padding: "12px",
    textDecoration: "none",
    boxShadow: hover ? "var(--shadow-md)" : "var(--shadow-sm)",
    transform: hover ? "translateY(-2px)" : "none",
    transition: "all var(--dur-slow) var(--ease-out-quint)",
  };
  if (feature) {
    return (
      <a href={href} onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ ...common, background: "linear-gradient(to bottom right, var(--red), var(--red-mid))", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <span style={{ display: "inline-flex", height: "32px", width: "32px", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-pill)", background: "rgba(255,255,255,0.15)" }}>{icon}</span>
          <Arrow color="rgba(255,255,255,0.85)" />
        </div>
        <div style={{ fontSize: "14px", fontWeight: "var(--weight-semibold)", lineHeight: 1.2, letterSpacing: "var(--tracking-snug)" }}>{title}</div>
      </a>
    );
  }
  return (
    <a
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...common, border: `2px solid ${hover ? borderHover : border}`, background: "var(--surface-card)" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span aria-hidden style={{ display: "inline-flex", height: "32px", width: "32px", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-pill)", background: bg, color: fg }}>
          {icon}
        </span>
        {tool ? (
          <Arrow color={hover ? "var(--ink)" : "var(--ink-3)"} />
        ) : (
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(1.3rem, 2vw, 1.6rem)",
              fontWeight: "var(--weight-medium)",
              lineHeight: 1,
              letterSpacing: "var(--tracking-tight)",
              color: "var(--ink)",
              fontVariationSettings: "var(--display-variation)",
            }}
          >
            {count}
          </span>
        )}
      </div>
      <div style={{ fontSize: "13.5px", fontWeight: "var(--weight-medium)", lineHeight: 1.2, letterSpacing: "var(--tracking-snug)", color: "var(--ink)" }}>{title}</div>
    </a>
  );
}

function Arrow({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 7h10v10" /><path d="M7 17 17 7" />
    </svg>
  );
}

/**
 * A pulse-band stat: the numbers that matter today. Big display number,
 * optional progress bar, red on hover. Sits four across above the tiles.
 */
export function PulseTile({ label, value, sub, pct, accent, href = "#" }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--radius-md)",
        border: "1px solid " + (hover ? "rgba(224,34,20,0.45)" : "var(--line-strong)"),
        background: "var(--surface-card)",
        padding: "16px",
        textDecoration: "none",
        boxShadow: hover ? "var(--shadow-accent-hover)" : "var(--shadow-hairline)",
        transform: hover ? "translateY(-2px)" : "none",
        transition: "all var(--dur-slow) var(--ease-out-quint)",
        display: "block",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-badge)",
          fontWeight: "var(--weight-semibold)",
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: hover ? "var(--red-mid)" : "var(--ink-4)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          transition: "color var(--dur-base)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: "10px",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-stat-xl)",
          fontWeight: "var(--weight-medium)",
          lineHeight: 1,
          letterSpacing: "var(--tracking-display)",
          fontVariantNumeric: "tabular-nums",
          fontVariationSettings: "var(--display-variation)",
          color: accent ? "var(--red)" : "var(--ink)",
        }}
      >
        {value}
      </div>
      {typeof pct === "number" && (
        <div style={{ marginTop: "10px", height: "6px", overflow: "hidden", borderRadius: "var(--radius-pill)", background: "rgba(20,18,16,0.08)" }}>
          <div style={{ height: "100%", borderRadius: "var(--radius-pill)", background: "var(--red)", width: `${Math.max(2, pct)}%` }} />
        </div>
      )}
      {sub && <div style={{ marginTop: "8px", fontSize: "var(--text-micro)", color: "var(--ink-4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
    </a>
  );
}
