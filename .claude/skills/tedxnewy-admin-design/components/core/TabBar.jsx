import React from "react";

/**
 * The house tab bar: an underline row, red underline + ink text when active.
 * Used for drafts / scheduled / sent-style views. Plain links to a `?tab=`
 * query param in the real admin, so it needs no client JS.
 */
export function TabBar({ tabs, active, hrefFor, onSelect }) {
  const [hover, setHover] = React.useState(null);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", borderBottom: "1px solid var(--line-strong)" }}>
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <a
            key={t.key}
            href={hrefFor ? hrefFor(t.key) : "#"}
            onClick={(e) => {
              if (onSelect) {
                e.preventDefault();
                onSelect(t.key);
              }
            }}
            onMouseEnter={() => setHover(t.key)}
            onMouseLeave={() => setHover(null)}
            style={{
              marginBottom: "-1px",
              borderBottom: "2px solid " + (isActive ? "var(--red)" : "transparent"),
              padding: "10px 16px",
              fontSize: "var(--text-control)",
              fontWeight: "var(--weight-medium)",
              textDecoration: "none",
              color: isActive || hover === t.key ? "var(--ink)" : "var(--ink-3)",
              transition: "color var(--dur-base)",
            }}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span style={{ marginLeft: "8px", color: "var(--ink-4)", fontVariantNumeric: "tabular-nums" }}>{t.count}</span>
            )}
          </a>
        );
      })}
    </div>
  );
}
