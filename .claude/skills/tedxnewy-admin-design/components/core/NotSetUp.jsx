import React from "react";

/**
 * "The database update hasn't been applied yet" state. A dashed sunken panel,
 * shown by admin pages whose tables don't exist yet so they never crash.
 */
export function NotSetUp({ title = "Not set up yet", children }) {
  return (
    <div
      style={{
        borderRadius: "var(--radius-md)",
        border: "1px dashed var(--line-dashed)",
        background: "var(--surface-sunken)",
        padding: "56px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontFamily: "var(--font-sans)", fontSize: "17px", fontWeight: "var(--weight-medium)", color: "var(--ink)" }}>{title}</div>
      <p style={{ margin: "8px auto 0", maxWidth: "52ch", fontSize: "13.5px", lineHeight: "var(--leading-body)", color: "var(--ink-3)" }}>
        {children ?? "This feature needs a database update before it can be used. Ask Will to run the database update, then reload this page."}
      </p>
    </div>
  );
}

/** Nothing-here-yet state for a list. Same dashed panel, one line of copy. */
export function EmptyState({ children = "No records yet." }) {
  return (
    <div
      style={{
        borderRadius: "var(--radius-md)",
        border: "1px dashed var(--line-input)",
        background: "var(--surface-sunken)",
        padding: "64px 24px",
        textAlign: "center",
      }}
    >
      <p style={{ margin: 0, fontSize: "15px", color: "var(--ink-2)" }}>{children}</p>
    </div>
  );
}
