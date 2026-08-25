const { PulseTile, DashboardTile, SectionLabel, Icon, Flash } = window.TEDxNewyAdminDesignSystem_bb30ae;

const FAMILIES = [
  { group: "Content", label: "Content pages", section: "yellow" },
  { group: "Management", label: "Management", section: "coast" },
  { group: "Community", label: "Community", section: "red" },
  { group: "Settings", label: "Settings & tools", section: "green" },
];

const COUNTS = {
  "/admin/events": 8, "/admin/talks": 34, "/admin/speakers": 41, "/admin/team": 17, "/admin/sponsors": 12,
  "/admin/partners": 24, "/admin/documents": 6, "/admin/notifications": 5, "/admin/admins": 4,
};
const TOOLS = new Set(["/admin/media", "/admin/tickets", "/admin/emails", "/admin/calendar", "/admin/socials", "/admin/newsletter"]);

function Dashboard({ onNavigate }) {
  const today = new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const go = (href) => (e) => { e.preventDefault(); onNavigate(href); };
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--ink-3)" }}>Dashboard</div>
          <h1 style={{ margin: "6px 0 0", fontSize: "clamp(1.6rem, 3vw, 2rem)", fontWeight: 500, letterSpacing: "-0.02em", fontVariationSettings: '"opsz" 144', color: "var(--ink)" }}>Afternoon, Will.</h1>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--ink-5)" }}>{today}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "8px" }}>
        <PulseTile label="Signal tickets" value="184/300" sub="61% sold · +18 this week" pct={61} accent />
        <PulseTile label="Gross ticket revenue" value="$17,640" sub="+18 tickets this week" />
        <PulseTile label="Subscribers" value="1,284" sub="+37 this week" />
        <PulseTile label="Partner pipeline" value="24" sub="organisations on the board" />
      </div>

      <div style={{ borderRadius: "var(--radius-md)", background: "var(--ink)", padding: "16px", color: "#fff", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ display: "inline-flex", height: "32px", width: "32px", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-pill)", background: "rgba(255,255,255,0.1)" }}>
              <Icon name="Inbox" size={16} strokeWidth={2.25} />
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.22em", color: "rgba(255,255,255,0.6)" }}>Forms inbox</span>
          </div>
          <a href="#" onClick={go("/admin/forms")} style={{ display: "inline-flex", alignItems: "center", gap: "4px", borderRadius: "var(--radius-pill)", background: "rgba(255,255,255,0.1)", padding: "6px 14px", fontSize: "11.5px", fontWeight: 500, color: "rgba(255,255,255,0.9)", textDecoration: "none" }}>
            Open inbox <Icon name="ArrowUpRight" size={14} strokeWidth={2.25} />
          </a>
        </div>
        <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: "8px" }}>
          {window.FORMS.map((f) => (
            <a key={f.label} href="#" onClick={go("/admin/forms")} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "8px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", padding: "12px", textDecoration: "none" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 600, textTransform: "uppercase", lineHeight: 1.3, letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)" }}>{f.label}</span>
              <span style={{ fontSize: "22px", fontWeight: 500, lineHeight: 1, letterSpacing: "-0.02em", color: "#fff", fontVariationSettings: '"opsz" 96' }}>{f.count}</span>
            </a>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: "14px" }}>
        {FAMILIES.map((fam) => {
          const group = window.NAV_GROUPS.find((g) => g.heading === fam.group);
          return (
            <section key={fam.group} style={{ display: "grid", gap: "8px" }}>
              <SectionLabel section={fam.section}>{fam.label}</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: "10px" }}>
                {group.items.map((it) => (
                  <DashboardTile
                    key={it.href}
                    section={it.section}
                    title={it.label}
                    count={COUNTS[it.href]}
                    tool={TOOLS.has(it.href)}
                    feature={it.href === "/admin/emails"}
                    icon={<Icon name={it.iconName} size={18} strokeWidth={2.25} />}
                    href="#"
                    onClick={go(it.href)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard });
