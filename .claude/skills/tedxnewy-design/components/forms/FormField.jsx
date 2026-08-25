import React from "react";

/** Labelled input / textarea / select. White field, 16px radius, hairline border, red focus ring. */
export function FormField({ label, name, required, hint, type = "text", placeholder, textarea, rows = 5, select, options = [], defaultValue, style }) {
  const [focus, setFocus] = React.useState(false);
  const field = {
    marginTop: 10,
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "var(--radius-input)",
    background: "#fff",
    padding: "16px 20px",
    fontFamily: "var(--font-sans)",
    fontSize: 15,
    fontWeight: 500,
    color: "#1a1513",
    border: "1px solid rgba(97,74,68,0.13)",
    outline: "none",
    boxShadow: focus ? "0 0 0 3px rgba(230,43,30,0.2)" : "none",
    transition: "box-shadow var(--dur-hover) var(--ease-out-quint)",
  };
  const handlers = { onFocus: () => setFocus(true), onBlur: () => setFocus(false) };
  return (
    <label style={{ display: "block", ...style }}>
      <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1a1513" }}>
          {label}
          {required && <span style={{ marginLeft: 4, color: "var(--ted-red)" }}>*</span>}
        </span>
        {hint && <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "#8a7e74" }}>{hint}</span>}
      </span>
      {textarea ? (
        <textarea name={name} required={required} rows={rows} placeholder={placeholder} style={field} {...handlers} />
      ) : select ? (
        <select name={name} required={required} defaultValue={defaultValue ?? ""} style={field} {...handlers}>
          <option value="" disabled>Select…</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input name={name} type={type} required={required} placeholder={placeholder} style={field} {...handlers} />
      )}
    </label>
  );
}
