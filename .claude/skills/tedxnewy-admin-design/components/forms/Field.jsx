import React from "react";

/**
 * Label + control + hint/error. The label is the admin's mono caps style;
 * an error replaces the hint.
 */
export function Field({ label, hint, error, htmlFor, children }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        style={{
          display: "block",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-label)",
          fontWeight: "var(--weight-semibold)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-label)",
          color: "var(--ink-3)",
        }}
      >
        {label}
      </label>
      <div style={{ marginTop: "var(--field-gap)" }}>{children}</div>
      {hint && !error && <p style={{ margin: "6px 0 0", fontSize: "var(--text-meta)", color: "var(--ink-3)" }}>{hint}</p>}
      {error && <p style={{ margin: "6px 0 0", fontSize: "var(--text-row-meta)", fontWeight: "var(--weight-medium)", color: "var(--error-fg)" }}>{error}</p>}
    </div>
  );
}

const controlStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--line-input)",
  background: "var(--surface-card)",
  padding: "12px 16px",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-input)",
  color: "var(--ink)",
  outline: "none",
};

function useFocusRing() {
  const [focused, setFocused] = React.useState(false);
  return [
    focused
      ? { borderColor: "var(--focus-border)", boxShadow: "0 0 0 2px var(--focus-ring)" }
      : null,
    { onFocus: () => setFocused(true), onBlur: () => setFocused(false) },
  ];
}

export function Input({ style, ...rest }) {
  const [ring, handlers] = useFocusRing();
  return <input {...handlers} {...rest} style={{ ...controlStyle, ...ring, ...style }} />;
}

export function Textarea({ rows = 4, style, ...rest }) {
  const [ring, handlers] = useFocusRing();
  return <textarea rows={rows} {...handlers} {...rest} style={{ ...controlStyle, lineHeight: "var(--leading-body)", resize: "vertical", ...ring, ...style }} />;
}

export function Select({ options = [], style, children, ...rest }) {
  const [ring, handlers] = useFocusRing();
  return (
    <select {...handlers} {...rest} style={{ ...controlStyle, appearance: "none", paddingRight: "36px", ...ring, ...style }}>
      {children ?? options.map((o) => (typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  );
}

/**
 * Rare or advanced options fold behind this rather than being shown by
 * default — the house answer to a long form.
 */
export function AdvancedToggle({ label = "Advanced options", open: openProp, children }) {
  const [open, setOpen] = React.useState(!!openProp);
  return (
    <div style={{ borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          border: "none",
          background: "none",
          padding: 0,
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-label)",
          fontWeight: "var(--weight-semibold)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-label)",
          color: "var(--ink-3)",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform var(--dur-base)" }}>
          <path d="m9 18 6-6-6-6" />
        </svg>
        {label}
      </button>
      {open && <div style={{ marginTop: "12px", display: "grid", gap: "16px" }}>{children}</div>}
    </div>
  );
}
