import React from "react";

const SECTION_INK = {
  yellow: "var(--sec-yellow-ink)",
  coast: "var(--sec-coast-ink)",
  red: "var(--sec-red-ink)",
  green: "var(--sec-green-ink)",
  grey: "var(--sec-grey-ink)",
};

/**
 * The header at the top of every admin page. It colours itself from its
 * section — accent bar, eyebrow and back-link hover — so a page matches its
 * sidebar item and dashboard tile. In the codebase the section is read from
 * the route; here it is an explicit prop.
 */
export function PageHeader({ section = "grey", eyebrow, title, description, backHref, actions }) {
  const ink = SECTION_INK[section] || SECTION_INK.grey;
  const [hover, setHover] = React.useState(false);
  return (
    <header style={{ display: "grid", gap: "20px" }}>
      {backHref && (
        <a
          href={backHref}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            justifySelf: "start",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            fontWeight: "var(--weight-semibold)",
            textTransform: "uppercase",
            textDecoration: "none",
            color: hover ? ink : "var(--ink-3)",
            transition: "color var(--dur-base)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
          Back
        </a>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "20px" }}>
        <div style={{ minWidth: 0 }}>
          {eyebrow && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span aria-hidden style={{ height: "14px", width: "4px", borderRadius: "var(--radius-pill)", background: ink }} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-label)",
                  fontWeight: "var(--weight-semibold)",
                  textTransform: "uppercase",
                  letterSpacing: "var(--tracking-label)",
                  color: ink,
                }}
              >
                {eyebrow}
              </span>
            </div>
          )}
          <h1
            style={{
              margin: eyebrow ? "12px 0 0" : 0,
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-page-title)",
              fontWeight: "var(--weight-medium)",
              lineHeight: "var(--leading-title)",
              letterSpacing: "var(--tracking-title)",
              color: "var(--ink)",
              textWrap: "balance",
              fontVariationSettings: "var(--display-variation)",
            }}
          >
            {title}
          </h1>
          {description && (
            <p style={{ margin: "12px 0 0", fontSize: "var(--text-body)", lineHeight: "var(--leading-body)", color: "var(--ink-3)" }}>{description}</p>
          )}
        </div>
        {actions && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>{actions}</div>}
      </div>
    </header>
  );
}

/** Small sub-heading with a section-coloured dot. Groups content inside a page. */
export function SectionLabel({ section = "grey", children }) {
  const ink = SECTION_INK[section] || SECTION_INK.grey;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span aria-hidden style={{ height: "6px", width: "6px", borderRadius: "var(--radius-pill)", background: ink }} />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-label)",
          fontWeight: "var(--weight-semibold)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-label)",
          color: "var(--ink-3)",
        }}
      >
        {children}
      </span>
    </div>
  );
}
