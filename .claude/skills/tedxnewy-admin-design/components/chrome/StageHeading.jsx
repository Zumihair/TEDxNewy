import React from "react";

const STAGE_CHIP = {
  early: { background: "var(--wash)", color: "var(--ink-3)" },
  polish: { background: "var(--warn-bg)", color: "var(--warn-fg)" },
  ready: { background: "var(--ok-bg)", color: "var(--ok-fg)" },
};

const STAGE_LABEL = { early: "Early draft", polish: "Needs polish", ready: "Ready to schedule" };

/**
 * Group heading for a stage-grouped draft list. Stage is the MANUALLY chosen
 * "how finished is this", separate from the derived status Badge — a grouping
 * heading, never a second status pill. Order: ready, polish, early.
 */
export function StageHeading({ stage = "early", count, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
          letterSpacing: "0.18em",
          ...STAGE_CHIP[stage],
        }}
      >
        {label ?? STAGE_LABEL[stage]}
      </span>
      {typeof count === "number" && (
        <span style={{ fontSize: "var(--text-meta)", color: "var(--ink-3)", fontVariantNumeric: "tabular-nums" }}>{count}</span>
      )}
      <span aria-hidden style={{ height: "1px", flex: 1, background: "var(--line)" }} />
    </div>
  );
}
