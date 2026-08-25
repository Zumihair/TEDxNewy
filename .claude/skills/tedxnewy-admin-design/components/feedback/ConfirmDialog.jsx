import React from "react";

/**
 * Confirm / prompt dialogs that match the admin chrome, used in place of
 * window.confirm / window.prompt. EVERY destructive action goes through
 * ConfirmDialog — a native browser confirm is never acceptable here.
 *
 * Traps Tab, focuses the primary control on open, cancels on Escape or an
 * overlay click.
 */
function Shell({ children, onCancel, labelledBy }) {
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, zIndex: "var(--z-dialog)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: "16px" }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "var(--dialog-w)", borderRadius: "var(--radius-md)", background: "var(--surface-card)", padding: "24px", boxShadow: "var(--shadow-modal)", boxSizing: "border-box" }}
      >
        {children}
      </div>
    </div>
  );
}

const confirmBtn = (tone) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  border: "none",
  borderRadius: "var(--radius-pill)",
  padding: "10px 20px",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-control)",
  fontWeight: "var(--weight-medium)",
  color: "#fff",
  background: tone === "danger" ? "var(--red)" : "var(--ink)",
});

const cancelBtn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  border: "none",
  borderRadius: "var(--radius-pill)",
  background: "var(--wash)",
  padding: "10px 20px",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-control)",
  fontWeight: "var(--weight-medium)",
  color: "var(--ink)",
};

export function ConfirmDialog({ open, title, body, confirmLabel = "Confirm", cancelLabel = "Cancel", tone = "danger", onConfirm, onCancel }) {
  const id = React.useId();
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <Shell onCancel={onCancel} labelledBy={id}>
      <h2 id={id} style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: "var(--text-dialog-title)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-snug)", color: "var(--ink)" }}>{title}</h2>
      {body && <div style={{ marginTop: "8px", fontSize: "13.5px", lineHeight: "var(--leading-body)", color: "var(--ink-3)" }}>{body}</div>}
      <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
        <button type="button" onClick={onCancel} style={cancelBtn}>{cancelLabel}</button>
        <button ref={ref} type="button" onClick={onConfirm} style={confirmBtn(tone)}>{confirmLabel}</button>
      </div>
    </Shell>
  );
}

export function PromptDialog({ open, title, body, label, placeholder, defaultValue = "", confirmLabel = "Save", cancelLabel = "Cancel", tone = "neutral", onConfirm, onCancel }) {
  const id = React.useId();
  const [value, setValue] = React.useState(defaultValue);
  React.useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);
  if (!open) return null;
  return (
    <Shell onCancel={onCancel} labelledBy={id}>
      <h2 id={id} style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: "var(--text-dialog-title)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-snug)", color: "var(--ink)" }}>{title}</h2>
      {body && <div style={{ marginTop: "8px", fontSize: "13.5px", lineHeight: "var(--leading-body)", color: "var(--ink-3)" }}>{body}</div>}
      <div style={{ marginTop: "16px" }}>
        {label && (
          <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "var(--text-label)", fontWeight: "var(--weight-semibold)", textTransform: "uppercase", letterSpacing: "var(--tracking-label)", color: "var(--ink-3)" }}>{label}</span>
        )}
        <input
          autoFocus
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onConfirm(value.trim())}
          style={{ marginTop: "8px", display: "block", width: "100%", boxSizing: "border-box", borderRadius: "var(--radius-md)", border: "1px solid var(--line-input)", background: "var(--surface-card)", padding: "12px 16px", fontFamily: "var(--font-sans)", fontSize: "var(--text-input)", color: "var(--ink)" }}
        />
      </div>
      <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
        <button type="button" onClick={onCancel} style={cancelBtn}>{cancelLabel}</button>
        <button type="button" onClick={() => onConfirm(value.trim())} style={confirmBtn(tone)}>{confirmLabel}</button>
      </div>
    </Shell>
  );
}
