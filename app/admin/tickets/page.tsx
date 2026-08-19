import Link from "next/link";
import { Download, Ticket } from "lucide-react";
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
  searchParams: Promise<{ flash?: string }>;
}) {
  await requireFullAdmin();
  const { flash } = await searchParams;

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
  const ordered = [...upcoming, ...past];

  const stats = new Map<string, HxEventStats>();
  const errors = new Map<string, string>();
  await Promise.all(
    ordered.map(async (e) => {
      const res = await getHumanitixEventStats(e);
      if (res.ok) stats.set(e.id, res.data);
      else errors.set(e.id, res.error);
    }),
  );

  const totalSold = [...stats.values()].reduce((a, s) => a + s.sold, 0);
  const totalRevenue = [...stats.values()].reduce((a, s) => a + s.revenue, 0);
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
        description="Live sales from Humanitix: sold, revenue and momentum for every event. Import buyers as attendees so feedback requests go out without a CSV."
      />

      {flash && <Flash tone="ok">{flash}</Flash>}

      {/* Stat band — dark, site-style display numbers */}
      <section className="relative overflow-hidden rounded-[var(--radius-md)] bg-[#141210] px-6 py-6 text-white md:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(224,34,20,0.5) 0%, rgba(224,34,20,0) 70%)",
          }}
        />
        <div className="relative grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <BandStat value={String(totalSold)} label="tickets sold across all events" />
          <BandStat value={money(totalRevenue)} label="gross ticket revenue" />
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
          const pct =
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
                    {isUpcoming ? " · upcoming" : " · past"}
                  </div>
                </div>
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(224,34,20,0.08)] text-[#b91404]">
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

                  {pct !== null && (
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(20,18,16,0.08)]">
                      <div
                        className="h-full rounded-full bg-[#e02214]"
                        style={{ width: `${pct}%` }}
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

                  <div className="mt-4 text-[12.5px] text-[#6b6459]">
                    {s.last7} sold in the last 7 days · {s.last28} in the last 28
                    {s.cancelled > 0 ? ` · ${s.cancelled} cancelled or refunded` : ""}
                  </div>

                  <form
                    action={importHumanitixAttendeesAction}
                    className="mt-5 flex flex-col gap-2 border-t border-[rgba(20,18,16,0.08)] pt-4 sm:flex-row"
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
