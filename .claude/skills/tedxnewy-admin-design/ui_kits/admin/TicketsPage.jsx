const { PageHeader, StatBand, BandStat, Card, Flash, Button, SecondaryButton, Icon, Modal, Select, StatChip, FilterChip } = window.TEDxNewyAdminDesignSystem_bb30ae;

const money = (n) => "$" + n.toLocaleString("en-AU", { maximumFractionDigits: 0 });

const EVENTS = [
  {
    id: "hx1", name: "TEDxNewy Signal 2026", date: "14 Nov 2026", onSale: true,
    sold: 184, capacity: 300, revenue: 17640,
    byType: [["General", 121], ["Concession", 38], ["Angel", 17], ["Student", 8]],
    last7: 18, last28: 64, cancelled: 2, orders: 118,
  },
  {
    id: "hx2", name: "TEDxNewy Salon: What If", date: "27 Nov 2026", onSale: true,
    sold: 41, capacity: 80, revenue: 2870,
    byType: [["General", 33], ["Concession", 8]],
    last7: 9, last28: 41, cancelled: 0, orders: 34,
  },
];

const PAST = [["60-Second Talk Night", 96], ["Salon: Newcastle 2050", 74], ["Youth Futures Lab", 120]];

const REGIONS = [["Newcastle", 96], ["Lake Macquarie", 41], ["Port Stephens", 18], ["Maitland", 14], ["Sydney", 9], ["Elsewhere", 6]];
const COMPANIES = [["hunterwater.com.au", 11], ["newcastle.edu.au", 9], ["ncc.nsw.gov.au", 7], ["portofnewcastle.com.au", 5]];

function Demographics({ name }) {
  const total = 184;
  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "6px" }}>
        <StatChip value="184" label="Tickets" />
        <StatChip value="171" label="Answered" />
        <StatChip value="93%" label="Response rate" />
        <StatChip value="41" label="Postcodes" />
      </div>
      <div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--ink-3)" }}>Where they're coming from</div>
        <div style={{ marginTop: "10px", display: "grid", gap: "6px" }}>
          {REGIONS.map(([r, n]) => (
            <div key={r} style={{ display: "grid", gridTemplateColumns: "150px 1fr 42px", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "12.5px", color: "var(--ink-2)" }}>{r}</span>
              <span style={{ height: "8px", borderRadius: "var(--radius-pill)", background: "rgba(20,18,16,0.06)", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: `${Math.round((n / total) * 100)}%`, background: "var(--ticket-bar)", borderRadius: "var(--radius-pill)" }} />
              </span>
              <span style={{ fontSize: "12px", color: "var(--ink-3)", fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{n}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--ink-3)" }}>Workplaces</div>
          <div style={{ marginTop: "10px", display: "grid", gap: "6px" }}>
            {COMPANIES.map(([d, n]) => (
              <div key={d} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "12.5px", color: "var(--ink-2)" }}>
                <span>{d}</span><span style={{ color: "var(--ink-4)", fontVariantNumeric: "tabular-nums" }}>{n}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--ink-3)" }}>Been before</div>
          <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "6px" }}>
            <StatChip value="63" label="Yes" />
            <StatChip value="108" label="First time" />
            <StatChip value="13" label="Didn't say" />
          </div>
          <p style={{ margin: "12px 0 0", fontSize: "12px", lineHeight: "var(--leading-body)", color: "var(--ink-4)" }}>
            The audience map itself reads live postcode data via <code style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>hunter-postcodes</code> — not recreated in this kit.
          </p>
        </div>
      </div>
    </div>
  );
}

function TicketsPage() {
  const [focus, setFocus] = React.useState(null);
  const totalSold = EVENTS.reduce((a, e) => a + e.sold, 0);
  const totalRevenue = EVENTS.reduce((a, e) => a + e.revenue, 0);
  return (
    <div style={{ display: "grid", gap: "20px" }} data-section="coast">
      <PageHeader
        section="coast"
        eyebrow="Humanitix"
        title="Ticket sales"
        description="Currently on-sale events: sold, revenue and momentum. Import buyers as attendees so feedback requests go out without a CSV."
      />

      <StatBand columns={5}>
        <BandStat value={String(totalSold)} label="tickets sold across all events" />
        <BandStat value={money(totalRevenue)} label="gross ticket revenue" />
        <BandStat value="17" label="Angel seats funded, each paying for a second seat" tone="good" />
        <BandStat value="61%" label="TEDxNewy Signal 2026 sold through" tone="good" />
        <BandStat value="81" label="days until TEDxNewy Signal 2026" />
      </StatBand>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {EVENTS.map((e) => {
          const barPct = Math.min(100, Math.round((e.sold / e.capacity) * 100));
          return (
            <Card key={e.id} style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                <div>
                  <div style={{ fontSize: "17px", fontWeight: 500, color: "var(--ink)" }}>{e.name}</div>
                  <div style={{ marginTop: "4px", fontSize: "12.5px", color: "var(--ink-3)" }}>{e.date} · on sale</div>
                </div>
                <span style={{ display: "inline-flex", height: "36px", width: "36px", flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-pill)", background: "rgba(31,74,92,0.08)", color: "var(--sec-coast-ink)" }}>
                  <Icon name="Ticket" size={16} strokeWidth={2} />
                </span>
              </div>

              <div style={{ marginTop: "20px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                <div style={{ fontSize: "30px", fontWeight: 500, lineHeight: 1, letterSpacing: "-0.03em", color: "var(--ink)", fontVariantNumeric: "tabular-nums", fontVariationSettings: '"opsz" 144' }}>
                  {e.sold}<span style={{ fontSize: "16px", color: "var(--ink-4)" }}> / {e.capacity}</span>
                </div>
                <div style={{ textAlign: "right", fontSize: "12.5px", color: "var(--ink-3)" }}>
                  <div style={{ fontWeight: 500, color: "var(--ink)" }}>{money(e.revenue)}</div>
                  gross revenue
                </div>
              </div>

              <div style={{ marginTop: "12px", height: "8px", overflow: "hidden", borderRadius: "var(--radius-pill)", background: "rgba(20,18,16,0.08)" }}>
                <div style={{ height: "100%", width: `${barPct}%`, borderRadius: "var(--radius-pill)", background: "var(--ticket-bar)" }} />
              </div>

              <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {e.byType.map(([n, c]) => (
                  <span key={n} style={{ borderRadius: "var(--radius-pill)", background: "var(--surface-chip)", padding: "4px 12px", fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-3)" }}>{n} · {c}</span>
                ))}
              </div>

              <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "6px" }}>
                <StatChip value={String(e.last7)} label="Sold, 7d" />
                <StatChip value={String(e.last28)} label="Sold, 28d" />
                <StatChip value={String(e.cancelled)} label="Cancelled" />
                <StatChip value={String(e.orders)} label="Orders" />
                <StatChip value={(e.sold / e.orders).toFixed(1)} label="Per order" />
                <StatChip value={money(Math.round(e.revenue / e.orders))} label="Avg order" />
              </div>

              <div style={{ marginTop: "16px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
                <Modal title={`Who's coming to ${e.name}`} size="xl" trigger={<Button variant="secondary" icon={<Icon name="BarChart3" size={14} strokeWidth={2.25} />}>Demographics</Button>}>
                  <Demographics name={e.name} />
                </Modal>
              </div>

              <div style={{ marginTop: "16px", display: "flex", gap: "8px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
                <Select style={{ flex: 1, padding: "10px 16px" }} defaultValue="" options={[{ value: "", label: "Import buyers as attendees of…" }, { value: "1", label: "TEDxNewy Signal 2026" }, { value: "2", label: "TEDxNewy Salon: What If" }]} />
                <Button variant="primary" icon={<Icon name="Download" size={14} strokeWidth={2.25} />}>Import</Button>
              </div>
            </Card>
          );
        })}
      </div>

      <div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--ink-4)" }}>Past events</div>
        <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {PAST.map(([n, c]) => (
            <FilterChip key={n} count={c} active={focus === n} onClick={(ev) => { ev.preventDefault(); setFocus(focus === n ? null : n); }}>{n}</FilterChip>
          ))}
        </div>
      </div>

      <p style={{ margin: 0, fontSize: "12.5px", lineHeight: "var(--leading-body)", color: "var(--ink-4)" }}>
        Imports skip anyone already on the event's attendee list, so re-importing after more sales only adds the new buyers. Revenue is gross ticket price before Humanitix fees.
      </p>
    </div>
  );
}

Object.assign(window, { TicketsPage });
