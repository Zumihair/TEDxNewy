import React from "react";

/* Mirrors app/admin/Toaster.tsx. Three tones and no more: green it worked, red
   it did not, yellow it needs attention. Anything that is not the result of an
   action is a Flash, not a Toast. */
const TONES = {
  success: { background: "#eef9f1", borderColor: "rgba(34,197,94,0.35)", color: "#155724", icon: "#22c55e" },
  error: { background: "#fdeeed", borderColor: "rgba(224,34,20,0.35)", color: "#b91404", icon: "#e02214" },
  warning: { background: "#fdf6e7", borderColor: "rgba(245,158,11,0.40)", color: "#8a6d00", icon: "#f59e0b" },
};

/**
 * One toast card. In the real system these are stacked in a portalled
 * bottom-centre column at z-[100] (above every other admin layer), newest
 * nearest the bottom edge, capped at four. Success clears itself after 4.5s,
 * warning 6s, error 9s, and hover or focus holds any of them open.
 */
export function Toast({ tone = "success", children, onDismiss }) {
  const t = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        width: "100%",
        maxWidth: "440px",
        borderRadius: "var(--radius-md)",
        borderWidth: "1px",
        borderStyle: "solid",
        padding: "12px 16px",
        fontSize: "13.5px",
        lineHeight: "1.5",
        boxShadow: "0 10px 30px rgba(20,18,16,0.10)",
        background: t.background,
        borderColor: t.borderColor,
        color: t.color,
      }}
    >
      <span aria-hidden style={{ color: t.icon, flexShrink: 0, marginTop: "1px" }}>
        {tone === "success" ? "✓" : tone === "error" ? "✕" : "⚠"}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        style={{ flexShrink: 0, opacity: 0.55, background: "none", border: 0, color: "inherit", cursor: "pointer" }}
      >
        {"✕"}
      </button>
    </div>
  );
}
