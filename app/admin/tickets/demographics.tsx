import { unstable_cache } from "next/cache";
import {
  humanitixConfigured,
  listHumanitixEvents,
  getHumanitixEventStats,
  type HxEventStats,
} from "@/lib/humanitix";
import { placeFor, type Region } from "@/lib/hunter-postcodes";
import AudienceMap, { type MapPoint } from "./AudienceMap";

/**
 * Ticket-buyer demographics: builder + presentation, extracted from
 * app/admin/tickets/page.tsx (2026-09-06) so a second admin surface (the
 * Events page's per-event Demographics modal) can render the exact same
 * thing for any event with real Humanitix sales, not just the ones listed
 * on /admin/tickets itself.
 */

export type HumanitixEventWithSales = { name: string; stats: HxEventStats };

/**
 * Every Humanitix event with at least one sale, name-matched against our
 * own `cms_events` titles by the caller (see `namesMatch()` in
 * app/admin/events/page.tsx). Cached 5 minutes, same rationale as
 * `getTicketPurchaserEmailsCached` in lib/segment-audiences.ts: this only
 * decides whether to show a Demographics chip, not the live sales figure
 * itself, so a few minutes of staleness is the right trade against calling
 * Humanitix on every `/admin/events` page load. `/admin/tickets` itself is
 * NOT changed to use this: that page is `dynamic = "force-dynamic"` on
 * purpose, since it IS the live sales dashboard.
 */
async function fetchHumanitixEventsWithSales(): Promise<HumanitixEventWithSales[]> {
  if (!humanitixConfigured()) return [];
  const hxRes = await listHumanitixEvents();
  if (!hxRes.ok) return [];
  const results: HumanitixEventWithSales[] = [];
  await Promise.all(
    hxRes.data.map(async (h) => {
      const statsRes = await getHumanitixEventStats(h);
      if (statsRes.ok && statsRes.data.sold > 0) {
        results.push({ name: h.name, stats: statsRes.data });
      }
    }),
  );
  return results;
}

export const getHumanitixEventsWithSalesCached = unstable_cache(
  fetchHumanitixEventsWithSales,
  ["humanitix-events-with-sales"],
  { revalidate: 300 },
);

/** Consumer mail providers; anything else is read as a workplace domain. */
const PERSONAL_MAIL =
  /(^|\.)(gmail|googlemail|hotmail|live|outlook|yahoo|icloud|me|mac|bigpond|optusnet|tpg|iinet|proton|protonmail|pm|mail|ymail|aol|westnet|internode|dodo)\.(com|net|org|me|au)(\.au)?$/i;

export type Audience = {
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

export function buildAudience(s: HxEventStats): Audience {
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
const LOCAL_REGIONS: Region[] = ["Newcastle", "Lake Macquarie"];

/** The demographics modal's body for one event: map, suburbs, breakdowns,
 *  companies. Pure presentation over an already-built Audience. */
export function DemographicsContent({
  eventName,
  audience,
  sampleKeys,
}: {
  eventName: string;
  audience: Audience;
  sampleKeys: string[];
}) {
  const postcodeTotal =
    audience.points.reduce((a, p) => a + p.count, 0) +
    audience.unmapped.reduce((a, p) => a + p.count, 0);
  const travellingIn = audience.regions
    .filter((r) => !LOCAL_REGIONS.includes(r.region))
    .reduce((a, r) => a + r.count, 0);

  if (audience.answered === 0) {
    return (
      <div className="rounded-[var(--radius-sm)] bg-[#f1ede4] p-4 text-[12.5px] leading-[1.6] text-[#6b6459]">
        No checkout answers came through from Humanitix for {eventName}, so
        the map and demographics are empty. The ticket payload exposes these
        top-level keys:{" "}
        <code className="font-mono text-[11px]">{sampleKeys.join(", ") || "none"}</code>
        . If the questions live under a key not in that list, the reader in
        lib/humanitix.ts needs that key added.
      </div>
    );
  }

  return (
    <>
      <p className="text-[12.5px] text-[#6b6459]">
        {audience.tickets} tickets · {audience.answered} answered the checkout questions
      </p>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
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
              No postcodes read. Payload: {sampleKeys.join(" · ")}
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

      <div className="mt-6 grid gap-5 border-t border-[rgba(20,18,16,0.08)] pt-5 sm:grid-cols-3">
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
  );
}

function Breakdown({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { label: string; n: number; tone?: "accent"; muted?: boolean }[];
  total: number;
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
    </div>
  );
}
