import React from "react";

/** Ink footer: brand line and socials left, three link columns right, then fine print. */
export function SiteFooter({ logo, tagline = "Ideas change everything.", columns = [], socials = [], acknowledgment, access, legal, legalLinks = [] }) {
  return (
    <footer className="grain" style={{ position: "relative", overflow: "hidden", background: "var(--ink)", color: "var(--cream)" }}>
      <div style={{ position: "relative", margin: "0 auto", maxWidth: "var(--container-wide)", padding: "0 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: 32, padding: "56px 0" }}>
          <div>
            {logo && <img src={logo} alt="TEDxNewy" style={{ height: 32, width: "auto", marginBottom: 24 }} />}
            <div style={{ maxWidth: "18ch", fontSize: "clamp(1.6rem,2.4vw,2.1rem)", fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.03em" }}>{tagline}</div>
            <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 10 }}>
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "1px solid var(--line-light)", textDecoration: "none" }}
                >
                  <img src={s.icon} alt="" style={{ width: 16, height: 16, opacity: 0.75 }} />
                </a>
              ))}
            </div>
          </div>
          <nav style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 32 }}>
            {columns.map((col) => (
              <div key={col.title}>
                <h4 style={{ marginBottom: 16, fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "var(--tracking-kicker-wide)", color: "rgba(255,255,255,0.45)" }}>{col.title}</h4>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
                  {col.items.map((it) => (
                    <li key={it.label}>
                      <a href={it.href} style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.85)", textDecoration: "none" }}>{it.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 48px", borderTop: "1px solid var(--line-light-soft)", padding: "32px 0" }}>
          {[["Acknowledgment of Country", acknowledgment], ["Access & inclusion", access]].map(([t, body]) =>
            body ? (
              <div key={t}>
                <h4 style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "var(--tracking-kicker-wide)", color: "rgba(255,255,255,0.4)" }}>{t}</h4>
                <p style={{ marginTop: 12, fontSize: 12.5, lineHeight: 1.6, color: "rgba(255,255,255,0.55)" }}>{body}</p>
              </div>
            ) : null,
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderTop: "1px solid var(--line-light-soft)", padding: "20px 0", fontSize: 11.5, color: "rgba(255,255,255,0.55)" }}>
          <div>{legal}</div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20 }}>
            {legalLinks.map((l) => (
              <a key={l.label} href={l.href} style={{ color: "inherit", textDecoration: "none" }}>{l.label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
