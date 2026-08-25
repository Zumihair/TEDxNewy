import React from "react";
import { Icon } from "../core/Icon";

/** Single-open accordion. Answers stay in the DOM and grow from 0fr to 1fr. */
export function FaqAccordion({ faqs = [], tone = "dark" }) {
  const [open, setOpen] = React.useState(null);
  const light = tone === "dark"; // dark surface => light text
  const line = light ? "1px solid rgba(255,255,255,0.10)" : "1px solid var(--line-hairline)";
  return (
    <div>
      {faqs.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} style={{ padding: "20px 0", borderTop: i === 0 ? "none" : line }}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 16, textAlign: "left", background: "none", border: 0, padding: 0, fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 500, lineHeight: 1.35, color: light ? "#fff" : "var(--ink)" }}
            >
              {item.q}
              <span style={{ display: "inline-flex", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 300ms var(--ease-out-quint)", color: light ? "rgba(255,255,255,0.5)" : "var(--ink-3)" }}>
                <Icon name="chevron-down" size={16} />
              </span>
            </button>
            <div
              style={{ display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr", opacity: isOpen ? 1 : 0, transition: "grid-template-rows 320ms var(--ease-out-quint), opacity 260ms ease-out" }}
            >
              <div style={{ overflow: "hidden", minHeight: 0 }}>
                <p style={{ marginTop: 12, fontSize: 14.5, lineHeight: 1.65, color: light ? "rgba(255,255,255,0.7)" : "var(--ink-2)" }}>{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
