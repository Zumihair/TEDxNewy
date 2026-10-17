import { requireFullAdmin } from "@/lib/cms-auth";
import {
  humanitixConfigured,
  listHumanitixEvents,
  getHumanitixEventStats,
  type HxEvent,
  type HxEventStats,
} from "@/lib/humanitix";
import { Badge, Flash, NotSetUp, PageHeader } from "../ui";
import { TicketsView } from "./TicketsView";
import { buildAudience } from "./demographics";

type TicketTypeRow = { name: string; sold: number; quantity: number | null };

/** Strips a trailing round/release/tier/date marker so two on-sale rounds of
 *  the same offer collapse to one logical name. On our own Humanitix listing
 *  the two rounds actually share one literal name already ("Standard
 *  ticket" appears under both "First Release" and "Main Release" with
 *  nothing in the `name` field itself telling them apart), so this is a
 *  no-op there; the pattern match exists for the events where Humanitix (or
 *  a future listing) DOES bake the round into the name, e.g. "Standard -
 *  Round 2" or "Standard (Early Bird)". */
const ROUND_SUFFIX =
  /[\s([-–—:]+(round|release|tier|phase)\s*\d+\)?\s*$|[\s([-–—:]+(first|second|main|early ?bird|early|final)\s*(release|round)?\)?\s*$|[\s([-–—:]+\d{1,2}\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\)?\s*$/i;
function normalizeTicketTypeName(name: string): string {
  return name.replace(ROUND_SUFFIX, "").trim() || name.trim();
}

/** Donations are an optional add-on at checkout, not a ticket type in the
 *  sold-vs-capacity sense this chart is for. */
function isDonationTicketType(name: string): boolean {
  return /donations?\b/i.test(name);
}

/** Sell-through per ticket type, one bar per logical type: rounds of the
 *  same offer (two Standard releases, two Concession releases) are merged
 *  by normalized name, summing sold and capacity across them, and donations
 *  are dropped. Sold is summed from Humanitix's own per-exact-name totals
 *  (`s.byType`, already a Map keyed by the raw name), so two rounds that
 *  share one literal name are never double counted — Humanitix has already
 *  merged those — while two rounds with distinct round-suffixed names sum
 *  correctly. A type Humanitix stopped reporting quantity for (or a
 *  renamed/deleted one still showing up in sales) still appears, just
 *  without a bar to measure it against; if any merged round has an unknown
 *  quantity the combined capacity is left unknown too, rather than
 *  understating it. */
function buildTicketTypeRows(e: HxEvent, s: HxEventStats): TicketTypeRow[] {
  const order: string[] = [];
  const displayName = new Map<string, string>();
  const qtySum = new Map<string, number>();
  const qtyUnknown = new Set<string>();
  const soldSum = new Map<string, number>();

  const norm = (raw: string) => {
    const display = normalizeTicketTypeName(raw);
    const key = display.toLowerCase();
    if (!displayName.has(key)) {
      displayName.set(key, display);
      order.push(key);
    }
    return key;
  };

  for (const tt of e.ticketTypes) {
    if (isDonationTicketType(tt.name)) continue;
    const key = norm(tt.name);
    if (tt.quantity === null) qtyUnknown.add(key);
    else qtySum.set(key, (qtySum.get(key) ?? 0) + tt.quantity);
  }
  for (const t of s.byType) {
    if (isDonationTicketType(t.name)) continue;
    const key = norm(t.name);
    soldSum.set(key, (soldSum.get(key) ?? 0) + t.sold);
  }

  return order.map((key) => ({
    name: displayName.get(key)!,
    sold: soldSum.get(key) ?? 0,
    quantity: qtyUnknown.has(key) ? null : (qtySum.get(key) ?? null),
  }));
}

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Australia/Sydney",
});

const money = (n: number) =>
  n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  await requireFullAdmin();
  const { event: eventParam } = await searchParams;

  if (!humanitixConfigured()) {
    return (
      <div className="adm-stack">
        <PageHeader title="Tickets" description="Live sales for the campaign that is on sale now." />
        <NotSetUp title="Humanitix isn't connected yet">
          Add HUMANITIX_API_KEY to the Vercel environment and redeploy, then
          this page shows live ticket sales.
        </NotSetUp>
      </div>
    );
  }

  const eventsRes = await listHumanitixEvents();
  if (!eventsRes.ok) {
    return (
      <div className="adm-stack">
        <PageHeader title="Tickets" description="Live sales for the campaign that is on sale now." />
        <Flash tone="error">Humanitix error: {eventsRes.error}</Flash>
      </div>
    );
  }

  // Only the active campaign lives here: the events still to come, soonest first.
  // Past events keep their numbers on the Events page.
  const now = Date.now();
  const stamp = (e: HxEvent) => (e.startDate ? Date.parse(e.startDate) : Number.NaN);
  const upcoming = eventsRes.data
    .filter((e) => (stamp(e) || 0) >= now)
    .sort((a, b) => (stamp(a) || 0) - (stamp(b) || 0));
  const active = upcoming.find((e) => e.id === eventParam) ?? upcoming[0];

  if (!active) {
    return (
      <div className="adm-stack">
        <PageHeader title="Tickets" description="Live sales for the campaign that is on sale now." />
        <NotSetUp title="Nothing is on sale right now">
          When the next event goes on sale in Humanitix its sales show up here. Numbers for past events are on the
          Events page.
        </NotSetUp>
      </div>
    );
  }

  const res = await getHumanitixEventStats(active);
  const s = res.ok ? res.data : null;
  const barPct = s && active.capacity ? Math.min(100, Math.round((s.sold / active.capacity) * 100)) : null;
  const audience = s && s.sold > 0 ? buildAudience(s) : null;
  const ticketTypeRows = s ? buildTicketTypeRows(active, s) : [];
  const daysToGo = active.startDate ? Math.max(0, Math.ceil((Date.parse(active.startDate) - now) / 86400_000)) : null;

  return (
    <TicketsView
      data={{
        name: active.name,
        dateLabel: active.startDate ? dateFmt.format(new Date(active.startDate)) : "Date to be confirmed",
        capacity: active.capacity ?? null,
        others: upcoming.map((e) => ({ id: e.id, name: e.name, active: e.id === active.id })),
        error: res.ok ? undefined : res.error,
        stats: s
          ? { sold: s.sold, revenue: s.revenue, last7: s.last7, last28: s.last28, angel: s.angel, orders: s.orders, cancelled: s.cancelled }
          : null,
        types: ticketTypeRows,
        daysToGo,
        audience,
        sampleKeys: s?.sampleKeys ?? [],
      }}
    />
  );
}
