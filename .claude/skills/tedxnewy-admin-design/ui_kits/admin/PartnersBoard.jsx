const { PageHeader, StatBand, BandStat, Card, Button, Icon, Modal, Field, Input, Select, FilterChip, SectionLabel } = window.TEDxNewyAdminDesignSystem_bb30ae;

const STATUSES = [
  { id: "prospect", label: "Prospect", hint: "Identified, nobody's reached out yet" },
  { id: "contacted", label: "Contacted", hint: "Outreach sent, no reply yet" },
  { id: "in_discussion", label: "In discussion", hint: "Talking numbers" },
  { id: "confirmed", label: "Confirmed", hint: "Signed" },
  { id: "declined", label: "Declined", hint: "Not this year" },
  { id: "dormant", label: "Dormant", hint: "Parked, revisit later" },
];

const CHIP = {
  prospect: { bg: "var(--pipe-prospect-chip-bg)", fg: "var(--pipe-prospect-chip-fg)", ink: "var(--pipe-prospect-ink)" },
  contacted: { bg: "var(--pipe-contacted-chip-bg)", fg: "var(--pipe-contacted-chip-fg)", ink: "var(--pipe-contacted-ink)" },
  in_discussion: { bg: "var(--pipe-discussion-chip-bg)", fg: "var(--pipe-discussion-chip-fg)", ink: "var(--pipe-discussion-ink)" },
  confirmed: { bg: "var(--pipe-confirmed-chip-bg)", fg: "var(--pipe-confirmed-chip-fg)", ink: "var(--pipe-confirmed-ink)" },
  declined: { bg: "var(--pipe-declined-chip-bg)", fg: "var(--pipe-declined-chip-fg)", ink: "var(--pipe-declined-ink)" },
  dormant: { bg: "var(--pipe-dormant-chip-bg)", fg: "var(--pipe-dormant-chip-fg)", ink: "var(--pipe-dormant-ink)" },
};

const PARTNERS = [
  { id: "p1", org: "Hunter Water", status: "in_discussion", cat: "Utilities", tier: "Major · $5k", contact: "Priya Raman", stale: 11, prospectus: true, last: "12 Aug" },
  { id: "p2", org: "Greater Bank", status: "contacted", cat: "Banking", tier: "Activation · $3k", contact: "Tom Whelan", stale: 9, last: "14 Aug" },
  { id: "p3", org: "Newcastle Permanent", status: "confirmed", cat: "Banking", tier: "Champion · $8k", contact: "Dana Elias", prospectus: true, last: "20 Aug" },
  { id: "p4", org: "University of Newcastle", status: "in_discussion", cat: "Education", tier: "Major · $5k", contact: "Dr Alan Boyd", prospectus: true, last: "22 Aug" },
  { id: "p5", org: "Port of Newcastle", status: "prospect", cat: "Logistics", tier: "Major · $5k", contact: null },
  { id: "p6", org: "City of Newcastle", status: "contacted", cat: "Government", tier: "Community · $2k", contact: "Sam Okoye", last: "21 Aug" },
  { id: "p7", org: "Ampcontrol", status: "prospect", cat: "Manufacturing", tier: null, contact: null },
  { id: "p8", org: "Nova Eye Medical", status: "declined", cat: "Medtech", tier: null, contact: "Rachel Lim", last: "1 Aug" },
  { id: "p9", org: "The Herald", status: "dormant", cat: "Media", tier: "In-kind", contact: "Jo Bennett", last: "12 Jun" },
];

function PartnerCard({ p, onOpen }) {
  const [hover, setHover] = React.useState(false);
  const c = CHIP[p.status];
  const st = STATUSES.find((s) => s.id === p.status);
  return (
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); onOpen(p); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: "var(--radius-md)",
        border: "1px solid " + (hover ? "rgba(20,18,16,0.2)" : "rgba(20,18,16,0.10)"),
        background: "var(--surface-card)",
        padding: "16px",
        textDecoration: "none",
        boxShadow: hover ? "0 16px 40px rgba(0,0,0,0.08)" : "var(--shadow-sm)",
        transform: hover ? "translateY(-4px)" : "none",
        transition: "all var(--dur-slow) var(--ease-out-quint)",
      }}
    >
      <span aria-hidden style={{ position: "absolute", left: 0, right: 0, top: 0, height: "3px", background: c.ink }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ fontSize: "16.5px", fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--ink)", textWrap: "balance", fontVariationSettings: '"opsz" 144' }}>{p.org}</div>
        <span style={{ display: "inline-flex", flexShrink: 0, alignItems: "center", gap: "4px", borderRadius: "var(--radius-pill)", padding: "2px 8px", fontFamily: "var(--font-mono)", fontSize: "8.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", background: c.bg, color: c.fg }}>
          {p.status === "confirmed" && <Icon name="Check" size={10} strokeWidth={3} />}
          {st.label}
        </span>
      </div>
      <div style={{ marginTop: "4px", fontSize: "12px", color: "var(--ink-3)", minHeight: "18px" }}>{[p.cat, p.tier].filter(Boolean).join(" · ")}</div>
      {p.stale && (
        <div style={{ marginTop: "8px", width: "fit-content", display: "inline-flex", alignItems: "center", gap: "4px", borderRadius: "var(--radius-pill)", background: "rgba(224,34,20,0.08)", padding: "2px 8px", fontFamily: "var(--font-mono)", fontSize: "8.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--red-mid)" }}>
          No update · {p.stale}d
        </div>
      )}
      <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--line)", paddingTop: "10px", fontSize: "11.5px", color: "var(--ink-3)" }}>
        <span style={{ display: "inline-flex", minWidth: 0, alignItems: "center", gap: "6px" }}>
          <Icon name="Handshake" size={14} strokeWidth={2} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.contact ?? "No contact yet"}</span>
        </span>
        <span style={{ display: "inline-flex", flexShrink: 0, alignItems: "center", gap: "10px" }}>
          {p.prospectus && <Icon name="FileText" size={14} strokeWidth={2} />}
          {p.last && <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Icon name="Mail" size={14} strokeWidth={2} />{p.last}</span>}
        </span>
      </div>
    </a>
  );
}

function PartnersBoard({ onOpen }) {
  const [filter, setFilter] = React.useState("");
  const [q, setQ] = React.useState("");
  const counts = {};
  PARTNERS.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
  const needle = q.trim().toLowerCase();
  const rows = PARTNERS
    .filter((p) => (filter ? p.status === filter : true))
    .filter((p) => (needle ? (p.org + " " + (p.contact || "") + " " + (p.cat || "")).toLowerCase().includes(needle) : true))
    .sort((a, b) => (b.stale ?? -1) - (a.stale ?? -1));
  const staleCount = PARTNERS.filter((p) => p.stale).length;

  return (
    <div style={{ display: "grid", gap: "20px" }} data-section="coast">
      <PageHeader
        section="coast"
        eyebrow="Partnerships"
        title="The partner pipeline"
        description="Who we've identified, who we're talking to, and what it's worth. Open a partner to find a contact, send the outreach email or read their prospectus."
      />

      <StatBand columns={4}>
        <BandStat value="9" label="organisations on the board" />
        <BandStat value="4" label="conversations in play" />
        <BandStat value="$8k" label="confirmed partner value" tone="good" />
        <BandStat value="$20k" label="open pipeline, at suggested tiers" />
      </StatBand>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--ink-4)", display: "inline-flex" }}>
            <Icon name="Search" size={14} strokeWidth={2.25} />
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search partners…"
            style={{ width: "100%", boxSizing: "border-box", borderRadius: "var(--radius-pill)", border: "1px solid rgba(20,18,16,0.12)", background: "var(--surface-card)", padding: "8px 14px 8px 36px", fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--ink)", outline: "none" }}
          />
        </div>
        <Modal title="Add a prospect" size="wide" trigger={<Button variant="primary" icon={<Icon name="Plus" size={14} strokeWidth={2.25} />}>Add a prospect</Button>}>
          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Field label="Organisation"><Input placeholder="e.g. Greater Bank" /></Field>
              <Field label="Contact name"><Input placeholder="Optional" /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Field label="Email"><Input placeholder="Optional" /></Field>
              <Field label="Website"><Input placeholder="Optional" /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Field label="Category"><Input placeholder="e.g. Banking" /></Field>
              <Field label="Suggested tier"><Select defaultValue="" options={[{ value: "", label: "Not sure yet" }, { value: "presenting", label: "Champion · $8k" }, { value: "platinum", label: "Major · $5k" }, { value: "gold", label: "Activation · $3k" }, { value: "community", label: "Community · $2k" }, { value: "in_kind", label: "In-kind" }]} /></Field>
            </div>
            <div><Button variant="primary" icon={<Icon name="Plus" size={14} strokeWidth={2.25} />}>Add prospect</Button></div>
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
              <SectionLabel section="coast">Or find more with Apollo</SectionLabel>
              <p style={{ margin: "10px 0 0", fontSize: "12.5px", lineHeight: "var(--leading-body)", color: "var(--ink-3)" }}>
                Apollo suggests Hunter-region organisations that look like the ones already on the board. Not recreated in this kit.
              </p>
            </div>
          </div>
        </Modal>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
        <FilterChip active={!filter} count={PARTNERS.length} onClick={(e) => { e.preventDefault(); setFilter(""); }}>All</FilterChip>
        {STATUSES.map((s) => (
          <FilterChip key={s.id} active={filter === s.id} count={counts[s.id] || 0} title={s.hint} passive={CHIP[s.id]} onClick={(e) => { e.preventDefault(); setFilter(s.id); }}>{s.label}</FilterChip>
        ))}
      </div>

      {staleCount > 0 && (
        <p style={{ margin: 0, fontSize: "12.5px", lineHeight: 1.5, color: "var(--red-mid)" }}>
          {staleCount} conversations with no update in 7+ days, surfaced first below.
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "14px" }}>
        {rows.map((p) => <PartnerCard key={p.id} p={p} onOpen={onOpen} />)}
        {rows.length === 0 && (
          <Card style={{ gridColumn: "span 3" }}>
            <p style={{ margin: 0, padding: "56px 20px", textAlign: "center", fontSize: "14px", color: "var(--ink-3)" }}>Nothing matches.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { PartnersBoard, PARTNERS, PARTNER_STATUSES: STATUSES, PARTNER_CHIP: CHIP });
