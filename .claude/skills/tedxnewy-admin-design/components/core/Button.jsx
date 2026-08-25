import React from "react";

const base = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  border: "none",
  borderRadius: "var(--radius-pill)",
  fontFamily: "var(--font-sans)",
  fontWeight: "var(--weight-medium)",
  transition: "all var(--dur-slow) var(--ease-out-quint)",
};

const VARIANTS = {
  primary: {
    background: "var(--red)",
    color: "#fff",
    padding: "10px 20px",
    fontSize: "var(--text-control)",
  },
  secondary: {
    background: "var(--wash)",
    color: "var(--ink)",
    padding: "10px 20px",
    fontSize: "var(--text-control)",
  },
  danger: {
    background: "var(--danger-bg)",
    color: "var(--error-fg)",
    padding: "6px 12px",
    fontSize: "var(--text-row-meta)",
    gap: "6px",
  },
  ghost: {
    background: "transparent",
    color: "var(--ink)",
    padding: "6px 12px",
    fontSize: "var(--text-meta)",
    gap: "6px",
  },
  dark: {
    background: "var(--ink)",
    color: "#fff",
    padding: "10px 20px",
    fontSize: "var(--text-control)",
  },
  row: {
    background: "var(--wash)",
    color: "var(--ink)",
    padding: "6px 12px",
    fontSize: "var(--text-meta)",
    gap: "6px",
  },
};

const HOVER = {
  primary: { background: "var(--red-mid)", transform: "translateY(-2px)" },
  secondary: { background: "var(--wash-hover)" },
  danger: { background: "var(--danger-bg-hover)" },
  ghost: { background: "var(--wash)" },
  dark: { background: "#000" },
  row: { background: "var(--wash-hover)" },
};

/**
 * The admin's pill button. `row` and `ghost` are the compact variants used
 * inside table rows; primary/secondary/dark are the page-level actions.
 * A pending button swaps its icon for a spinner and disables itself.
 */
export function Button({
  variant = "secondary",
  children,
  icon,
  type = "button",
  disabled,
  pending,
  fullWidth,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const off = disabled || pending;
  return (
    <button
      type={type}
      disabled={off}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...base,
        ...VARIANTS[variant],
        ...(hover && !off ? HOVER[variant] : null),
        width: fullWidth ? "100%" : undefined,
        opacity: off ? 0.7 : 1,
        cursor: off ? "not-allowed" : "pointer",
        ...style,
      }}
      {...rest}
    >
      {pending ? <Spinner /> : icon}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" style={{ animation: "ds-spin 1s linear infinite" }} aria-hidden>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      <style>{"@keyframes ds-spin{to{transform:rotate(360deg)}}"}</style>
    </svg>
  );
}

/**
 * Icon-only round button — the house pattern for common row actions
 * (reorder, delete, download). 32px tap target, hover fills a soft circle;
 * tone="danger" turns that circle red.
 */
export function IconButton({ children, ariaLabel, title, tone = "neutral", disabled, pending, onClick, type = "button" }) {
  const [hover, setHover] = React.useState(false);
  const off = disabled || pending;
  const hoverBg = tone === "danger" ? "rgba(224,34,20,0.10)" : "rgba(20,18,16,0.08)";
  const hoverFg = tone === "danger" ? "var(--error-fg)" : "var(--ink)";
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      title={title || ariaLabel}
      disabled={off}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: "32px",
        width: "32px",
        border: "none",
        borderRadius: "var(--radius-pill)",
        background: hover && !off ? hoverBg : "transparent",
        color: hover && !off ? hoverFg : "var(--ink-3)",
        transition: "background-color var(--dur-base), color var(--dur-base)",
        opacity: off ? 0.3 : 1,
        cursor: off ? "not-allowed" : "pointer",
      }}
    >
      {pending ? <Spinner /> : children}
    </button>
  );
}
