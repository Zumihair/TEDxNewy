import React from "react";
import { Icon } from "../core/Icon.jsx";

/**
 * The house modal shell: a trigger button plus an overlay dialog. Portalled
 * to document.body in the codebase so no ancestor can trap the fixed overlay;
 * closes on Escape or an overlay click, with body scroll locked while open.
 *
 * This is the "buttons open a modal, not an inline section" pattern — the
 * standard for every add-a-record flow.
 */
const MAX_W = { default: "var(--modal-w)", wide: "var(--modal-w-wide)", xl: "var(--modal-w-xl)" };

export function Modal({ trigger, title, size = "default", defaultOpen = false, children }) {
  const [open, setOpen] = React.useState(defaultOpen);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: "var(--z-modal)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: "24px" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              maxHeight: "92vh",
              width: "100%",
              maxWidth: MAX_W[size],
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: "var(--radius-md)",
              background: "var(--surface-card)",
              boxShadow: "var(--shadow-modal)",
            }}
          >
            <div style={{ display: "flex", flexShrink: 0, alignItems: "center", justifyContent: "space-between", gap: "12px", borderBottom: "1px solid var(--line)", padding: "16px 20px" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-modal-title)", fontWeight: "var(--weight-medium)", letterSpacing: "var(--tracking-snug)", color: "var(--ink)" }}>{title}</span>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                style={{ display: "inline-flex", height: "32px", width: "32px", flexShrink: 0, alignItems: "center", justifyContent: "center", border: "none", borderRadius: "var(--radius-pill)", background: "transparent", color: "var(--ink-3)" }}
              >
                <Icon name="X" size={16} strokeWidth={2.25} />
              </button>
            </div>
            <div style={{ overflowY: "auto", padding: "20px" }}>{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
