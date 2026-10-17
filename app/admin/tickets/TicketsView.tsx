import Link from "next/link";
import { Badge, Flash, PageHeader } from "../ui";
import { DemographicsContent, type Audience } from "./demographics";

export type TicketsData = {
  name: string;
  dateLabel: string;
  capacity: number | null;
  /** Other events on sale, to switch between. Empty when there is only one. */
  others: { id: string; name: string; active: boolean }[];
  error?: string;
  stats: {
    sold: number;
    revenue: number;
    last7: number;
    last28: number;
    angel: number;
    orders: number;
    cancelled: number;
  } | null;
  types: { name: string; sold: number; quantity: number | null }[];
  daysToGo: number | null;
  audience: Audience | null;
  sampleKeys: string[];
};

const money = (n: number) =>
  n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });

/** A small value and label tile for an order stat. */
function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="adm-chipstat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

/** The Tickets page body for the one campaign on sale. Presentation only, so the sample preview can reuse it. */
export function TicketsView({ data }: { data?: TicketsData }) {
  const d = data ?? SAMPLE;
  const s = d.stats;
  const barPct = s && d.capacity ? Math.min(100, Math.round((s.sold / d.capacity) * 100)) : null;
  return (
    <div className="adm-stack">
      <PageHeader title={d.name} description={`${d.dateLabel}. Live from Humanitix.`} />

      {d.others.length > 1 && (
        <div className="adm-pills" role="tablist">
          {d.others.map((e) => (
            <Link key={e.id} href={`/admin/tickets?event=${encodeURIComponent(e.id)}`} className={"adm-pill" + (e.active ? " is-active" : "")}>
              {e.name}
            </Link>
          ))}
        </div>
      )}

      {d.error && <Flash tone="error">Could not load tickets: {d.error}</Flash>}

      {s && (
        <>
          <section className="adm-statrow" style={{ ["--n" as string]: 4 }}>
            <div className="adm-stat2">
              <span className="adm-stat2__label">Tickets sold</span>
              <span className="adm-stat2__value">
                {s.sold}
                {d.capacity ? <span className="adm-stat2__of"> / {d.capacity}</span> : null}
              </span>
              <span className="adm-stat2__foot">
                {barPct !== null && (
                  <span className="adm-bar" aria-hidden>
                    <i style={{ width: `${Math.max(2, barPct)}%` }} />
                  </span>
                )}
                <span>{barPct !== null ? `${barPct}% sold` : "no capacity set"}</span>
              </span>
            </div>
            <div className="adm-stat2">
              <span className="adm-stat2__label">Gross revenue</span>
              <span className="adm-stat2__value">{money(s.revenue)}</span>
              <span className="adm-stat2__foot">before Humanitix fees</span>
            </div>
            <div className="adm-stat2">
              <span className="adm-stat2__label">Last 7 days</span>
              <span className="adm-stat2__value">+{s.last7}</span>
              <span className="adm-stat2__foot">{s.last28} in 28 days</span>
            </div>
            <div className="adm-stat2">
              <span className="adm-stat2__label">Days to go</span>
              <span className="adm-stat2__value">{d.daysToGo === null ? "·" : d.daysToGo}</span>
              <span className="adm-stat2__foot">
                {s.angel} angel seat{s.angel === 1 ? "" : "s"} funded
              </span>
            </div>
          </section>

          <div className="adm-twocol adm-twocol--wide">
            <section className="adm-panel adm-panel--tight">
              <h2 className="adm-section__title">Ticket types</h2>
              <div className="adm-types">
                {d.types.map((tt) => {
                  const typePct = tt.quantity && tt.quantity > 0 ? Math.min(100, Math.round((tt.sold / tt.quantity) * 100)) : null;
                  const soldOut = typePct !== null && tt.sold >= (tt.quantity ?? 0);
                  return (
                    <div key={tt.name} className="adm-type">
                      <div className="adm-type__head">
                        <span className="adm-type__name">{tt.name}</span>
                        <span className="adm-type__n">
                          {soldOut && <Badge tone="red">Sold out</Badge>}
                          <b>{tt.sold}</b>
                          {tt.quantity ? <span> / {tt.quantity}</span> : null}
                        </span>
                      </div>
                      <span className="adm-bar" aria-hidden>
                        <i style={{ width: `${typePct ?? 0}%` }} />
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="adm-panel adm-panel--tight">
              <h2 className="adm-section__title">Orders</h2>
              <div className="adm-chipstats">
                <StatChip value={String(s.orders)} label="Orders" />
                <StatChip value={s.orders > 0 ? (s.sold / s.orders).toFixed(1) : "·"} label="Tickets per order" />
                <StatChip value={s.orders > 0 ? money(s.revenue / s.orders) : "·"} label="Average order" />
                <StatChip value={String(s.cancelled)} label="Cancelled" />
              </div>
            </section>
          </div>

          <section className="adm-panel">
            <h2 className="adm-section__title">Who is coming</h2>
            {d.audience ? (
              <DemographicsContent eventName={d.name} audience={d.audience} sampleKeys={d.sampleKeys} />
            ) : (
              <p className="adm-card__text">Demographics appear once the first tickets are sold.</p>
            )}
          </section>
        </>
      )}

      <p className="adm-card__text">
        Sales update on their own from Humanitix. Revenue is the gross ticket price before fees. Past events are on the Events page.
      </p>
    </div>
  );
}

const SAMPLE: TicketsData = {
  name: "Signal",
  dateLabel: "24 Oct 2026",
  capacity: 240,
  others: [],
  stats: { sold: 232, revenue: 14820, last7: 6, last28: 41, angel: 9, orders: 128, cancelled: 3 },
  types: [
    { name: "Standard", sold: 150, quantity: 150 },
    { name: "Concession", sold: 52, quantity: 60 },
    { name: "Angel", sold: 30, quantity: 30 },
  ],
  daysToGo: 8,
  sampleKeys: [],
  audience: {
    tickets: 232,
    answered: 210,
    points: [
      { postcode: "2300", name: "Newcastle", count: 70, lat: -32.93, lng: 151.78 },
      { postcode: "2304", name: "Mayfield", count: 38, lat: -32.9, lng: 151.74 },
      { postcode: "2290", name: "Charlestown", count: 25, lat: -32.96, lng: 151.69 },
    ],
    unmapped: [],
    regions: [{ region: "Newcastle", count: 133 }],
    beenBefore: { yes: 90, no: 110, unknown: 32 },
    shirts: { ladies: 100, mens: 90, unknown: 42 },
    mail: { work: 80, personal: 150 },
    companies: [{ domain: "newcastle.edu.au", count: 14 }],
  },
};
