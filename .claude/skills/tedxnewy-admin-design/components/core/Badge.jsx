import React from "react";

const TONES = {
  neutral: { background: "var(--wash)", color: "var(--ink-3)" },
  red: { background: "var(--error-bg)", color: "var(--error-fg)" },
  live: { background: "var(--ok-bg)", color: "var(--ok-fg)" },
  soon: { background: "var(--wash)", color: "var(--ink-3)" },
  draft: { background: "var(--warn-bg)", color: "var(--warn-fg)" },
  scheduled: { background: "var(--info-bg)", color: "var(--info-fg)" },
};

/**
 * Tiny uppercase pill. The admin's one status signal: automatically-derived
 * lifecycle status (draft / scheduled / posted), never a hand-picked stage.
 */
export function Badge({ tone = "neutral", children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "var(--radius-pill)",
        padding: "2px 10px",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-badge)",
        fontWeight: "var(--weight-semibold)",
        textTransform: "uppercase",
        letterSpacing: "var(--tracking-badge)",
        ...TONES[tone],
      }}
    >
      {children}
    </span>
  );
}
