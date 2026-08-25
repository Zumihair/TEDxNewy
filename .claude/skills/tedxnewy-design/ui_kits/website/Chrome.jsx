
// Shared page chrome: the fixed header (transparent over a dark hero) and the
// ink footer. `route` drives the header CTA and the dark-hero treatment.
function Chrome({ children, darkHero, onNavigate }) {
  const { SiteHeader, SiteFooter } = window.TEDxNewyDesignSystem_0329fe;
  const [scrolled, setScrolled] = React.useState(false);
  const ref = React.useRef(null);
  return (
    <div
      ref={ref}
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 60)}
      style={{ height: "100vh", overflowY: "auto", background: "var(--cream)", position: "relative" }}
    >
      <div style={{ position: "sticky", top: 0, zIndex: 50, height: 0 }}>
        <SiteHeader
          darkHero={darkHero}
          scrolled={scrolled}
          logo="../../../../../public/brand/tedxnewy-black.png"
          logoLight="../../../../../public/brand/tedxnewy-white.png"
          cta={{ label: "Get tickets", href: "#signal" }}
          groups={window.TEDX.nav}
        />
      </div>
      {children}
      <SiteFooter
        logo="../../../../../public/brand/tedxnewy-white.png"
        columns={window.TEDX.footerColumns}
        socials={window.TEDX.socials}
        acknowledgment={window.TEDX.acknowledgment}
        access={window.TEDX.access}
        legal="© 2026 Newcastle Ideas Network Limited · ACN 676 155 462 · formerly TEDxCooksHill"
        legalLinks={[{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }, { label: "Code of Conduct", href: "#" }, { label: "Contact", href: "#" }]}
      />
    </div>
  );
}

// Section shell: max-width container with the site's vertical rhythm.
function Section({ children, background = "var(--cream)", color, narrow, padding = "128px 40px", style }) {
  return (
    <section style={{ background, color, ...style }}>
      <div style={{ margin: "0 auto", maxWidth: narrow ? "var(--container-narrow)" : "var(--container)", padding }}>{children}</div>
    </section>
  );
}

function SectionTitle({ children, tone = "dark", max = "20ch" }) {
  return (
    <h2 style={{ maxWidth: max, fontSize: "var(--fs-h2)", lineHeight: "var(--lh-display)", fontWeight: 500, letterSpacing: "var(--tracking-display)", color: tone === "dark" ? "var(--ink)" : "#fff", fontVariationSettings: '"opsz" 144' }}>
      {children}
    </h2>
  );
}

Object.assign(window, { Chrome, Section, SectionTitle });
