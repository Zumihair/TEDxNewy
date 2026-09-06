import Link from "next/link";
import { BarChart3, Download, Ticket } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  humanitixConfigured,
  listHumanitixEvents,
  getHumanitixEventStats,
  type HxEvent,
  type HxEventStats,
} from "@/lib/humanitix";
import { Badge, BandStat, Card, Flash, NotSetUp, PageHeader, PrimaryButton, SecondaryButton, inputCls } from "../ui";
import { Modal } from "../Modal";
import { importHumanitixAttendeesAction } from "./actions";
import { buildAudience, DemographicsContent } from "./demographics";
import FlashToast from "../FlashToast";
import { asTone } from "../flash";

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

type CmsEventOption = { id: string; title: string };

async function listCmsEventOptions(): Promise<CmsEventOption[]> {
  const sb = getAdminSupabase();
  const { data, error } = await sb
    .from("cms_events")
    .select("id, title")
    .order("starts_at", { ascending: false, nullsFirst: false });
  if (error || !data) return [];
  return data as CmsEventOption[];
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{
    flash?: string;
    tone?: string;
    event?: string;
  }>;
}) {
  await requireFullAdmin();
  const { flash, tone, event: eventParam } = await searchParams;

  if (!humanitixConfigured()) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Humanitix"
          title="Ticket sales"
          description="Live sales from Humanitix: sold, revenue and momentum for every event."
        />
        <NotSetUp title="Humanitix isn't connected yet">
          Add HUMANITIX_API_KEY to the Vercel environment and redeploy, then
          this page shows live ticket sales for every event.
        </NotSetUp>
      </div>
    );
  }

  const [eventsRes, cmsEvents] = await Promise.all([
    listHumanitixEvents(),
    listCmsEventOptions(),
  ]);

  if (!eventsRes.ok) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Humanitix"
          title="Ticket sales"
          description="Live sales from Humanitix: sold, revenue and momentum for every event."
        />
        <Flash tone="error">Humanitix error: {eventsRes.error}</Flash>
      </div>
    );
  }

  // Soonest upcoming first, then past events newest first.
  const now = Date.now();
  const stamp = (e: HxEvent) =>
    e.startDate ? Date.parse(e.startDate) : Number.NaN;
  const upcoming = eventsRes.data
    .filter((e) => (stamp(e) || 0) >= now)
    .sort((a, b) => (stamp(a) || 0) - (stamp(b) || 0));
  const past = eventsRes.data
    .filter((e) => !((stamp(e) || 0) >= now))
    .sort((a, b) => (stamp(b) || 0) - (stamp(a) || 0));
  const everyEvent = [...upcoming, ...past];

  const stats = new Map<string, HxEventStats>();
  const errors = new Map<string, string>();
  await Promise.all(
    everyEvent.map(async (e) => {
      const res = await getHumanitixEventStats(e);
      if (res.ok) stats.set(e.id, res.data);
      else errors.set(e.id, res.error);
    }),
  );

  // A past event reaches this page pinned open via a direct id (?event=).
  // The old ?q= loose-name-match fallback (for a "Tickets" link on
  // /admin/events that only knew the CMS event's title) was removed
  // 2026-09-06 along with that link — Events now uses a Demographics
  // chip/modal instead of sending anyone here.
  const focusPast = past.find((e) => e.id === eventParam);

  // The main list stays focused on what's actually on sale; a past event
  // only appears when specifically asked for, pinned first and marked.
  const ordered = focusPast ? [focusPast, ...upcoming] : upcoming;

  const totalSold = [...stats.values()].reduce((a, s) => a + s.sold, 0);
  const totalRevenue = [...stats.values()].reduce((a, s) => a + s.revenue, 0);
  const totalAngel = [...stats.values()].reduce((a, s) => a + s.angel, 0);

  const next = upcoming[0];
  const nextStats = next ? stats.get(next.id) : undefined;
  const daysToNext =
    next && next.startDate
      ? Math.max(0, Math.ceil((Date.parse(next.startDate) - now) / 86400_000))
      : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Humanitix"
        title="Ticket sales"
        description="Currently on-sale events: sold, revenue and momentum. Import buyers as attendees so feedback requests go out without a CSV."
      />

      {flash && (
        <FlashToast tone={asTone(tone)} clear={["flash", "tone"]}>
          {flash}
        </FlashToast>
      )}

      {/* Stat band — dark, site-style display numbers */}
      <section className="rounded-[var(--radius-md)] bg-[#141210] px-6 py-6 text-white md:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          <BandStat value={String(totalSold)} label="tickets sold across all events" />
          <BandStat value={money(totalRevenue)} label="gross ticket revenue" />
          <BandStat
            value={String(totalAngel)}
            label="Angel seats funded, each paying for a second seat"
            tone={totalAngel > 0 ? "good" : undefined}
          />
          <BandStat
            value={
              next && nextStats
                ? next.capacity
                  ? `${Math.round((nextStats.sold / next.capacity) * 100)}%`
                  : String(nextStats.sold)
                : "—"
            }
            label={
              next
                ? next.capacity
                  ? `${next.name} sold through`
                  : `sold for ${next.name}`
                : "no upcoming event"
            }
            tone={nextStats && next?.capacity ? "good" : undefined}
          />
          <BandStat
            value={daysToNext === null ? "—" : String(daysToNext)}
            label={next ? `days until ${next.name}` : "days until the next event"}
          />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {ordered.map((e) => {
          const s = stats.get(e.id);
          const err = errors.get(e.id);
          const isUpcoming = (stamp(e) || 0) >= now;
          const isPinnedPast = focusPast?.id === e.id;
          const barPct =
            s && e.capacity ? Math.min(100, Math.round((s.sold / e.capacity) * 100)) : null;
          const audience = s && s.sold > 0 ? buildAudience(s) : null;
          const ticketTypeRows = s ? buildTicketTypeRows(e, s) : [];
          return (
            <Card key={e.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-sans text-[17px] font-medium text-[#141210]">
                    {e.name}
                  </div>
                  <div className="mt-1 text-[12.5px] text-[#6b6459]">
                    {e.startDate ? dateFmt.format(new Date(e.startDate)) : "Date TBC"}
                    {isUpcoming ? " · on sale" : isPinnedPast ? " · past" : ""}
                  </div>
                </div>
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(31,74,92,0.08)] text-[#1f4a5c]">
                  <Ticket className="h-4 w-4" strokeWidth={2} />
                </span>
              </div>

              {err && <Flash tone="error">Couldn&apos;t load tickets: {err}</Flash>}

              {s && (
                <>
                  <div className="mt-5 flex items-end justify-between">
                    <div
                      className="font-sans text-[30px] font-medium leading-none tracking-[-0.03em] text-[#141210] tabular-nums"
                      style={{ fontVariationSettings: '"opsz" 144' }}
                    >
                      {s.sold}
                      {e.capacity ? (
                        <span className="text-[16px] text-[#8a8278]"> / {e.capacity}</span>
                      ) : null}
                    </div>
                    <div className="text-right text-[12.5px] text-[#6b6459]">
                      <div className="font-medium text-[#141210]">{money(s.revenue)}</div>
                      gross revenue
                    </div>
                  </div>

                  {barPct !== null && (
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(20,18,16,0.08)]">
                      <div
                        className="h-full rounded-full bg-[#1f4a5c]"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  )}

                  {ticketTypeRows.length > 0 && (
                    <div className="mt-4 space-y-2.5">
                      {ticketTypeRows.map((tt) => {
                        const typePct =
                          tt.quantity && tt.quantity > 0
                            ? Math.min(100, Math.round((tt.sold / tt.quantity) * 100))
                            : null;
                        const soldOut = typePct !== null && tt.sold >= (tt.quantity ?? 0);
                        return (
                          <div key={tt.name}>
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b6459]">
                                {tt.name}
                              </span>
                              <span className="flex items-center gap-1.5 whitespace-nowrap font-mono text-[10.5px] tabular-nums text-[#8a8278]">
                                {soldOut && <Badge tone="red">Sold out</Badge>}
                                <span className="font-medium text-[#141210]">{tt.sold}</span>
                                {tt.quantity ? (
                                  <>
                                    <span>/ {tt.quantity}</span>
                                    <span>· {typePct}%</span>
                                  </>
                                ) : null}
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[rgba(20,18,16,0.08)]">
                              {typePct !== null && (
                                <div
                                  className={`h-full rounded-full ${soldOut ? "bg-[#b91404]" : "bg-[#1f4a5c]"}`}
                                  style={{ width: `${typePct}%` }}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-3 gap-1.5">
                    <StatChip value={String(s.last7)} label="Sold, 7d" />
                    <StatChip value={String(s.last28)} label="Sold, 28d" />
                    <StatChip value={String(s.cancelled)} label="Cancelled" />
                    {s.orders > 0 && (
                      <>
                        <StatChip value={String(s.orders)} label="Orders" />
                        <StatChip value={(s.sold / s.orders).toFixed(1)} label="Per order" />
                        <StatChip value={money(s.revenue / s.orders)} label="Avg order" />
                      </>
                    )}
                  </div>

                  {audience && (
                    <div className="mt-4 border-t border-[rgba(20,18,16,0.08)] pt-4">
                      <Modal
                        title={`Who's coming to ${e.name}`}
                        size="xl"
                        trigger={
                          <SecondaryButton type="button">
                            <BarChart3 className="h-3.5 w-3.5" strokeWidth={2.25} />
                            Demographics
                          </SecondaryButton>
                        }
                      >
                        <DemographicsContent
                          eventName={e.name}
                          audience={audience}
                          sampleKeys={s.sampleKeys}
                        />
                      </Modal>
                    </div>
                  )}

                  <form
                    action={importHumanitixAttendeesAction}
                    className="mt-4 flex flex-col gap-2 border-t border-[rgba(20,18,16,0.08)] pt-4 sm:flex-row"
                  >
                    <input type="hidden" name="humanitixEventId" value={e.id} />
                    <select
                      name="cmsEventId"
                      className={`${inputCls} sm:flex-1 sm:py-2.5`}
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>
                        Import buyers as attendees of…
                      </option>
                      {cmsEvents.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                    <PrimaryButton type="submit">
                      <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
                      Import
                    </PrimaryButton>
                  </form>
                </>
              )}
            </Card>
          );
        })}
      </div>

      {past.length > 0 && (
        <div>
          <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#8a8278]">
            Past events
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {past.map((e) => (
              <Link
                key={e.id}
                href={`/admin/tickets?event=${encodeURIComponent(e.id)}`}
                className={
                  "rounded-full px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] transition-colors " +
                  (focusPast?.id === e.id
                    ? "bg-[#141210] text-[#f4efe6]"
                    : "border border-[rgba(20,18,16,0.12)] bg-white text-[#6b6459] hover:text-[#141210]")
                }
              >
                {e.name} · {stats.get(e.id)?.sold ?? 0}
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="text-[12.5px] leading-[1.6] text-[#8a8278]">
        Imports skip anyone already on the event&apos;s attendee list, so
        re-importing after more sales only adds the new buyers. Send surveys
        from the event&apos;s{" "}
        <Link href="/admin/events" className="underline decoration-[rgba(20,18,16,0.3)] underline-offset-2 hover:text-[#141210]">
          Attendees page
        </Link>{" "}
        as usual. Revenue is gross ticket price before Humanitix fees.
      </p>
    </div>
  );
}

/** A small value+label tile for a momentum/order stat, instead of stacking
 *  them as a run-on sentence of plain text. */
function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[10px] bg-[#f1ede4] px-2.5 py-2">
      <div
        className="font-sans text-[15px] font-medium leading-none tracking-[-0.02em] text-[#141210] tabular-nums"
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        {value}
      </div>
      <div
        className="mt-1 font-mono text-[8.5px] font-semibold uppercase leading-tight text-[#8a8278]"
        style={{ letterSpacing: "0.1em" }}
      >
        {label}
      </div>
    </div>
  );
}
