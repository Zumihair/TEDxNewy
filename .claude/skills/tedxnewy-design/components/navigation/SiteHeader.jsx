import React from "react";
import { Icon } from "../core/Icon";
import { ParticipateCard } from "../cards/ParticipateCard";

/**
 * The site header. Transparent over a dark hero, lifting to an opaque cream bar
 * on scroll. Top-level items don't navigate: they reveal a full-width panel,
 * either a lede + divided link list, or a row of three photo cards.
 */
export function SiteHeader({ logo, logoLight, groups = [], cta = { label: "Get tickets", href: "/signal" }, darkHero = false, scrolled = false }) {
  const [menu, setMenu] = React.useState(null);
  const [drawer, setDrawer] = React.useState(false);
  const atTop = !scrolled;
  const lightContent = atTop && darkHero;
  const expanded = !!menu || drawer;
  const bar = atTop && !expanded
    ? { background: "transparent", borderBottom: "1px solid transparent", boxShadow: "none" }
    : lightContent && expanded
      ? { background: "rgba(42,6,4,0.96)", backdropFilter: "var(--blur-bar)", borderBottom: "1px solid rgba(255,255,255,0.10)", boxShadow: "none" }
      : { background: "rgba(247,243,235,0.97)", backdropFilter: "var(--blur-bar)", borderBottom: "1px solid var(--line-hairline)", boxShadow: "var(--shadow-nav)" };
  const active = groups.find((g) => g.key === menu) || null;
  const linkColor = lightContent ? "rgba(255,255,255,0.88)" : "var(--ink)";

  return (
    <nav
      onMouseLeave={() => setMenu(null)}
      style={{ position: "absolute", left: 0, right: 0, top: 0, zIndex: "var(--z-nav)", transition: "all var(--dur-hover) var(--ease-out-quint)", ...bar }}
    >
      <div style={{ margin: "0 auto", maxWidth: "var(--container-wide)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 40px" }}>
        <a href="/" aria-label="TEDxNewy home" style={{ display: "block", lineHeight: 0 }}>
          <img src={lightContent ? logoLight : logo} alt="TEDxNewy" style={{ height: 56, width: "auto" }} />
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {groups.map((g) => {
            const isOpen = menu === g.key;
            return (
              <div key={g.key} style={{ position: "relative" }} onMouseEnter={() => setMenu(g.key)}>
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  onClick={() => setMenu(isOpen ? null : g.key)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: 0, padding: 0, fontFamily: "var(--font-sans)", fontSize: 15, color: isOpen && lightContent ? "#fff" : linkColor, transition: "color var(--dur-hover) var(--ease-out-quint)" }}
                >
                  {g.label}
                  <span style={{ display: "inline-flex", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform var(--dur-hover) var(--ease-out-quint)" }}>
                    <Icon name="chevron-down" size={14} strokeWidth={2.25} />
                  </span>
                </button>
                {isOpen && <span aria-hidden="true" style={{ position: "absolute", bottom: -8, left: 0, height: 2, width: "100%", borderRadius: 999, background: "var(--red)" }} />}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a
            href={cta.href}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: "var(--radius-pill)", padding: "8px 20px", fontSize: 13.5, fontWeight: 500, textDecoration: "none", background: lightContent ? "#fff" : "var(--red)", color: lightContent ? "var(--red-deep)" : "#fff", transition: "all var(--dur-hover) var(--ease-out-quint)" }}
          >
            {cta.label}
          </a>
        </div>
      </div>

      {active && (
        <div style={{ borderTop: lightContent ? "1px solid rgba(255,255,255,0.10)" : "1px solid var(--line-hairline)" }}>
          <div style={{ margin: "0 auto", maxWidth: "var(--container-wide)", padding: "48px 40px" }}>
            {active.style === "cards" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
                {active.items.map((it) => (
                  <ParticipateCard key={it.label} href={it.href || "#"} title={it.label} body={it.description} image={it.imageUrl} gradient={it.gradient} cta={it.ctaLabel || "Learn more"} ratio="4/3" />
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "0.85fr 2fr", gap: 64 }}>
                <div>
                  {active.kicker && (
                    <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "var(--tracking-kicker-wide)", color: lightContent ? "rgba(255,255,255,0.55)" : "var(--ink-3)" }}>{active.kicker}</div>
                  )}
                  <h3 style={{ marginTop: 16, fontSize: "clamp(1.5rem,2.2vw,2rem)", lineHeight: 1.05, fontWeight: 500, letterSpacing: "var(--tracking-title)", color: lightContent ? "#fff" : "var(--ink)" }}>{active.heading || active.label}</h3>
                  {active.blurb && <p style={{ marginTop: 12, maxWidth: "34ch", fontSize: 14, lineHeight: 1.6, color: lightContent ? "rgba(255,255,255,0.65)" : "var(--ink-2)" }}>{active.blurb}</p>}
                </div>
                <div>
                  {active.items.map((it, i) => (
                    <a
                      key={it.label}
                      href={it.href || undefined}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "14px 12px", margin: "0 -12px", borderRadius: 8, borderTop: i === 0 ? "none" : lightContent ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(20,18,16,0.10)", textDecoration: "none" }}
                    >
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 16, fontWeight: 500, color: lightContent ? "rgba(255,255,255,0.9)" : "var(--ink)" }}>{it.label}</span>
                        {it.description && <span style={{ marginTop: 4, display: "block", fontSize: 13, color: lightContent ? "rgba(255,255,255,0.45)" : "var(--ink-4)" }}>{it.description}</span>}
                      </span>
                      {it.href ? (
                        <Icon name="arrow-right" size={16} strokeWidth={2} color={lightContent ? "rgba(255,255,255,0.4)" : "#cfc7ba"} />
                      ) : (
                        <span style={{ flexShrink: 0, borderRadius: 999, background: "rgba(224,34,20,0.14)", padding: "4px 12px", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--red)" }}>Coming soon</span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
