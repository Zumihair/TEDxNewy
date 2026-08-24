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
import { Card, Flash, NotSetUp, PageHeader, PrimaryButton, inputCls } from "../ui";
import { importHumanitixAttendeesAction } from "./actions";
import AudienceMap, { type MapPoint } from "./AudienceMap";
import { placeFor, type Region } from "@/lib/hunter-postcodes";

/** Consumer mail providers; anything else is read as a workplace domain. */
const PERSONAL_MAIL =
  /(^|\.)(gmail|googlemail|hotmail|live|outlook|yahoo|icloud|me|mac|bigpond|optusnet|tpg|iinet|proton|protonmail|pm|mail|ymail|aol|westnet|internode|dodo)\.(com|net|org|me|au)(\.au)?$/i;

type Audience = {
  tickets: number;
  answered: number;
  points: MapPoint[];
  unmapped: { postcode: string; count: number }[];
  regions: { region: Region; count: number }[];
  beenBefore: { yes: number; no: number; unknown: number };
  shirts: { ladies: number; mens: number; unknown: number };
  mail: { work: number; personal: number };
  companies: { domain: string; count: number }[];
};

function buildAudience(s: HxEventStats): Audience {
  const byPostcode = new Map<string, number>();
  const beenBefore = { yes: 0, no: 0, unknown: 0 };
  const shirts = { ladies: 0, mens: 0, unknown: 0 };
  const mail = { work: 0, personal: 0 };
  const domains = new Map<string, number>();
  let answered = 0;
  for (const p of s.profiles) {
    if (p.postcode || p.beenBefore !== null || p.shirt) answered++;
    if (p.postcode) byPostcode.set(p.postcode, (byPostcode.get(p.postcode) ?? 0) + 1);
    if (p.beenBefore === true) beenBefore.yes++;
    else if (p.beenBefore === false) beenBefore.no++;
    else beenBefore.unknown++;
    if (p.shirt && /ladies|women|female/i.test(p.shirt)) shirts.ladies++;
    else if (p.shirt && /men|male/i.test(p.shirt)) shirts.mens++;
    else shirts.unknown++;
    const domain = p.email.split("@")[1] ?? "";
    if (!domain) continue;
    if (PERSONAL_MAIL.test(domain)) mail.personal++;
    else {
      mail.work++;
      domains.set(domain, (domains.get(domain) ?? 0) + 1);
    }
  }
  const points: MapPoint[] = [];
  const unmapped: { postcode: string; count: number }[] = [];
  const regionCounts = new Map<Region, number>();
  for (const [postcode, count] of byPostcode) {
    const place = placeFor(postcode);
    if (!place) {
      unmapped.push({ postcode, count });
      regionCounts.set("Elsewhere", (regionCounts.get("Elsewhere") ?? 0) + count);
      continue;
    }
    points.push({ postcode, name: place.name, count, lat: place.lat, lng: place.lng });
    regionCounts.set(place.region, (regionCounts.get(place.region) ?? 0) + count);
  }
  points.sort((a, b) => b.count - a.count);
  unmapped.sort((a, b) => b.count - a.count);
  return {
    tickets: s.profiles.length,
    answered,
    points,
    unmapped,
    regions: [...regionCounts.entries()]
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count),
    beenBefore,
    shirts,
    mail,
    companies: [...domains.entries()]
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain)),
  };
}

const pct = (n: number, of: number) => (of > 0 ? `${Math.round((n / of) * 100)}%` : "—");

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
  searchParams: Promise<{ flash?: string; whos?: string; event?: string; q?: string }>;
}) {
  await requireFullAdmin();
  const { flash, whos, event: eventParam, q } = await searchParams;

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

  // A past event reaches this page pinned open two ways: a direct id
  // (?event=) or a loose name match (?q=), the latter from the "Tickets"
  // link on an event's row in /admin/events, which only knows the CMS
  // event's title, not its Humanitix id.
  const focusPast =
    past.find((e) => e.id === eventParam) ??
    (q
      ? past.find(
          (e) =>
            e.name.toLowerCase().includes(q.toLowerCase()) ||
            q.toLowerCase().includes(e.name.toLowerCase()),
        )
      : undefined);

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

  // "Who's coming" is opt-in per event via a button on its card, not pinned
  // to whichever event happens to be soonest, so it works for any event on
  // this page (upcoming or a pinned-open past one) with ticket data.
  const whosEvent = whos ? ordered.find((e) => e.id === whos) : undefined;
  const whosStats = whosEvent ? stats.get(whosEvent.id) : undefined;
  const audience = whosEvent && whosStats && whosStats.sold > 0 ? buildAudience(whosStats) : null;
  const postcodeTotal = audience
    ? audience.points.reduce((a, p) => a + p.count, 0) +
      audience.unmapped.reduce((a, p) => a + p.count, 0)
    : 0;
  const localRegions: Region[] = ["Newcastle", "Lake Macquarie"];
  const travellingIn = audience
    ? audience.regions
        .filter((r) => !localRegions.includes(r.region))
        .reduce((a, r) => a + r.count, 0)
    : 0;

  // Rendered below the event cards, not above them — demographics are a
  // detail you drill into per event, not the first thing on the page.
  const demographicsPanel = audience && whosEvent && (
    <Card className="p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="font-sans text-[17px] font-medium text-[#141210]">
          Who&apos;s coming to {whosEvent.name}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[12.5px] text-[#6b6459]">
            {audience.tickets} tickets · {audience.answered} answered the checkout questions
          </div>
          <Link
            href={ticketsHref({ eventParam, q })}
            className="rounded-full bg-[#f1ede4] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b6459] hover:text-[#141210]"
          >
            Hide
          </Link>
        </div>
      </div>

      {audience.answered === 0 ? (
        <div className="mt-4 rounded-[var(--radius-sm)] bg-[#f1ede4] p-4 text-[12.5px] leading-[1.6] text-[#6b6459]">
          No checkout answers came through from Humanitix for this event, so
          the map and demographics are empty. The ticket payload exposes these
          top-level keys:{" "}
          <code className="font-mono text-[11px]">{whosStats?.sampleKeys.join(", ") || "none"}</code>
          . If the questions live under a key not in that list, the reader in
          lib/humanitix.ts needs that key added.
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <AudienceMap points={audience.points} />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {audience.regions.map((r) => (
                  <span
                    key={r.region}
                    className="rounded-full bg-[#f1ede4] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b6459]"
                  >
                    {r.region} · {r.count} · {pct(r.count, postcodeTotal)}
                  </span>
                ))}
              </div>
              {postcodeTotal === 0 && (
                <p className="mt-2 rounded-[var(--radius-sm)] bg-[#f1ede4] p-3 font-mono text-[11px] leading-[1.6] text-[#6b6459]">
                  No postcodes read. Payload: {whosStats?.sampleKeys.join(" · ")}
                </p>
              )}
              <p className="mt-2 text-[12px] leading-[1.6] text-[#8a8278]">
                {postcodeTotal} tickets gave a postcode · {pct(travellingIn, postcodeTotal)}{" "}
                travelling in from outside Newcastle and Lake Macquarie
                {audience.unmapped.length > 0 && (
                  <>
                    {" "}
                    · not on the map: {audience.unmapped.map((u) => `${u.postcode} (${u.count})`).join(", ")}
                  </>
                )}
              </p>
            </div>

            <div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
                Suburbs
              </div>
              <ul className="mt-2 divide-y divide-[rgba(20,18,16,0.06)]">
                {audience.points.slice(0, 12).map((p) => (
                  <li key={p.postcode} className="flex items-center gap-3 py-2 text-[13px]">
                    <span className="w-10 shrink-0 font-mono text-[11px] text-[#8a8278]">{p.postcode}</span>
                    <span className="flex-1 truncate text-[#2a2521]">{p.name}</span>
                    <span className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-[rgba(20,18,16,0.08)]">
                      <span
                        className="block h-full rounded-full bg-[#1f4a5c]"
                        style={{ width: `${Math.round((p.count / (audience.points[0]?.count || 1)) * 100)}%` }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right tabular-nums text-[#141210]">{p.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 grid gap-5 border-t border-[rgba(20,18,16,0.08)] pt-5 md:grid-cols-3">
            <Breakdown
              title="Been to a TEDxNewy event before?"
              rows={[
                { label: "No, first time", n: audience.beenBefore.no, tone: "accent" },
                { label: "Yes", n: audience.beenBefore.yes },
                { label: "Didn't answer", n: audience.beenBefore.unknown, muted: true },
              ]}
              total={audience.tickets}
            />
            <Breakdown
              title="T-shirt size chosen"
              rows={[
                { label: "Ladies sizes", n: audience.shirts.ladies, tone: "accent" },
                { label: "Mens sizes", n: audience.shirts.mens },
                { label: "Didn't answer", n: audience.shirts.unknown, muted: true },
              ]}
              total={audience.tickets}
            />
            <Breakdown
              title="Email used at checkout"
              rows={[
                { label: "Work or organisation", n: audience.mail.work, tone: "accent" },
                { label: "Personal", n: audience.mail.personal },
              ]}
              total={audience.mail.work + audience.mail.personal}
            />
          </div>

          {audience.companies.length > 0 && (
            <div className="mt-6 border-t border-[rgba(20,18,16,0.08)] pt-5">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
                Organisations buying on a work address
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {audience.companies.map((c) => (
                  <span
                    key={c.domain}
                    className="rounded-full border border-[rgba(20,18,16,0.12)] px-3 py-1 text-[12px] text-[#2a2521]"
                  >
                    {c.domain}
                    {c.count > 1 ? <span className="ml-1.5 text-[#8a8278]">×{c.count}</span> : null}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Humanitix"
        title="Ticket sales"
        description="Currently on-sale events: sold, revenue and momentum. Import buyers as attendees so feedback requests go out without a CSV."
      />

      {flash && <Flash tone="ok">{flash}</Flash>}

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

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {s.byType.map((t) => (
                      <span
                        key={t.name}
                        className="rounded-full bg-[#f1ede4] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b6459]"
                      >
                        {t.name} · {t.sold}
                      </span>
                    ))}
                  </div>

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

                  {s.sold > 0 && (
                    <div className="mt-4 border-t border-[rgba(20,18,16,0.08)] pt-4">
                      <Link
                        href={
                          whos === e.id
                            ? ticketsHref({ eventParam, q })
                            : ticketsHref({ eventParam, q, whos: e.id })
                        }
                        className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3.5 py-1.5 text-[12.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                      >
                        <BarChart3 className="h-3.5 w-3.5" strokeWidth={2.25} />
                        {whos === e.id ? "Hide demographics" : "Demographics"}
                      </Link>
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

      {demographicsPanel}

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

/** Builds an /admin/tickets href carrying over event/q and optionally
 *  setting `whos`, so the "who's coming" toggle stays a plain server link. */
function ticketsHref(opts: {
  eventParam?: string;
  q?: string;
  whos?: string;
}): string {
  const params = new URLSearchParams();
  if (opts.eventParam) params.set("event", opts.eventParam);
  if (opts.q) params.set("q", opts.q);
  if (opts.whos) params.set("whos", opts.whos);
  const qs = params.toString();
  return qs ? `/admin/tickets?${qs}` : "/admin/tickets";
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

function Breakdown({
  title,
  rows,
  total,
  note,
}: {
  title: string;
  rows: { label: string; n: number; tone?: "accent"; muted?: boolean }[];
  total: number;
  note?: string;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
        {title}
      </div>
      <ul className="mt-2 space-y-2">
        {rows.map((r) => (
          <li key={r.label} className={`text-[13px] ${r.muted ? "text-[#8a8278]" : "text-[#2a2521]"}`}>
            <div className="flex items-baseline justify-between gap-3">
              <span>{r.label}</span>
              <span className="tabular-nums">
                <span className={`font-medium ${r.tone === "accent" ? "text-[#1f4a5c]" : "text-[#141210]"}`}>
                  {pct(r.n, total)}
                </span>
                <span className="ml-1.5 text-[#8a8278]">{r.n}</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[rgba(20,18,16,0.08)]">
              <div
                className={`h-full rounded-full ${r.tone === "accent" ? "bg-[#1f4a5c]" : r.muted ? "bg-[rgba(20,18,16,0.18)]" : "bg-[#141210]"}`}
                style={{ width: total > 0 ? `${Math.round((r.n / total) * 100)}%` : "0%" }}
              />
            </div>
          </li>
        ))}
      </ul>
      {note && <p className="mt-2 text-[11.5px] leading-[1.5] text-[#8a8278]">{note}</p>}
    </div>
  );
}

function BandStat({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone?: "good";
}) {
  return (
    <div>
      <div
        className={`font-sans text-[clamp(1.9rem,3.4vw,2.6rem)] font-medium leading-none tracking-[-0.03em] tabular-nums ${
          tone === "good" ? "text-[#8fd0a2]" : "text-white"
        }`}
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        {value}
      </div>
      <div className="mt-2 text-[12.5px] leading-[1.45] text-[rgba(255,255,255,0.62)]">
        {label}
      </div>
    </div>
  );
}
