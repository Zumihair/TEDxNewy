import React from "react";

const TONES = {
  ok: { borderColor: "var(--ok-flash-border)", background: "var(--ok-flash-bg)", color: "var(--ok-flash-fg)" },
  info: { borderColor: "var(--info-flash-border)", background: "var(--info-flash-bg)", color: "var(--info-flash-fg)" },
  error: { borderColor: "var(--error-border)", background: "var(--error-bg)", color: "var(--error-fg)" },
};

/** Inline banner for a standing notice above the page content. An action RESULT
 *  is a Toast; this is for a condition that has to stay on screen. */
export function Flash({ tone = "ok", children }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      style={{
        borderRadius: "var(--radius-md)",
        borderWidth: "1px",
        borderStyle: "solid",
        padding: "12px 16px",
        fontSize: "13.5px",
        lineHeight: "var(--leading-body)",
        ...TONES[tone],
      }}
    >
      {children}
    </div>
  );
}
