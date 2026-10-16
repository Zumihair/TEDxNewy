import { HomeView } from "./views";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";

import { visibleGroupsFor } from "./access";
import { getTicketSummary } from "@/lib/ticket-summary";
import { VISIBLE_FORMS } from "./forms/registry";




export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const supabase = await getServerSupabase();

  // Resolve access first: a community admin sees only the Community cluster,
  // so the counts behind the hidden tiles aren't worth fetching. requireAdmin
  // is React-cached and the layout already ran it, so this costs no round trip.
  const [{ email, access }, { denied }] = await Promise.all([
    requireAdmin(),
    searchParams,
  ]);
  const isFull = access === "full";

  const [baseCounts, formCounts, subscriberRes] = await Promise.all([
    isFull
      ? Promise.all([
          supabase.from("cms_talks").select("*", { count: "exact", head: true }),
          supabase
            .from("cms_speakers")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("cms_team_members")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("cms_admins")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("notification_recipients")
            .select("*", { count: "exact", head: true }),
          // cms_events may not exist yet (pre-migration); the count is null then.
          supabase
            .from("cms_events")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("cms_sponsors")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("cms_documents")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("cms_partners")
            .select("*", { count: "exact", head: true }),
        ])
      : Promise.resolve(null),
    // Live count per form, in registry order, for the Forms tiles. `filter`
    // (see forms/registry.ts) scopes a form that's really a filtered slice
    // of a table shared with something else (waitlist -> subscribers where
    // source = "signal-waitlist") to just its own rows.
    isFull
      ? Promise.all(
          VISIBLE_FORMS.map((f) => {
            let q = supabase.from(f.table).select("*", { count: "exact", head: true });
            if (f.filter) q = q.eq(f.filter.column, f.filter.value);
            return q;
          }),
        )
      : Promise.resolve([] as { count: number | null }[]),
    supabase.from("subscribers").select("*", { count: "exact", head: true }),
  ]);

  // Live counts, keyed by the countKey values used in nav-config.
  const counts: Record<string, number> = {
    talks: baseCounts?.[0].count ?? 0,
    speakers: baseCounts?.[1].count ?? 0,
    team: baseCounts?.[2].count ?? 0,
    admins: baseCounts?.[3].count ?? 0,
    recipients: baseCounts?.[4].count ?? 0,
    events: baseCounts?.[5].count ?? 0,
    sponsors: baseCounts?.[6].count ?? 0,
    documents: baseCounts?.[7].count ?? 0,
    partners: baseCounts?.[8].count ?? 0,
    subscribers: subscriberRes.count ?? 0,
  };

  // Forms tiles: label, slug and order from the form registry; count by table.
  const submissionRows = VISIBLE_FORMS.map((f, i) => ({
    id: f.slug,
    label: f.label,
    href: `/admin/forms/${f.slug}`,
    count: formCounts[i]?.count ?? 0,
  }));

  // Pulse band: the numbers that matter today. Ticket data is cached for
  // five minutes (lib/ticket-summary) so the dashboard never waits on
  // Humanitix; the counts are cheap head-only queries.
  const weekAgoIso = new Date(Date.now() - 7 * 86400_000).toISOString();
  const [ticketSummary, subs7Res] = await Promise.all([
    isFull ? getTicketSummary() : Promise.resolve(null),
    supabase
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgoIso),
  ]);
  const money = (n: number) =>
    n.toLocaleString("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    });


  const groups = visibleGroupsFor(access).filter((g) => g.key !== "home");

  const todayLabel = new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Australia/Sydney",
  }).format(new Date());

  const pulse = isFull
    ? [
        ticketSummary
          ? {
              href: "/admin/tickets",
              label: `${/signal|signature/i.test(ticketSummary.eventName) ? "Signal" : ticketSummary.eventName} tickets`,
              value: ticketSummary.capacity
                ? `${ticketSummary.sold}/${ticketSummary.capacity}`
                : String(ticketSummary.sold),
              sub:
                ticketSummary.pct !== null
                  ? `${ticketSummary.pct}% sold, +${ticketSummary.last7} this week`
                  : `+${ticketSummary.last7} this week`,
              pct: ticketSummary.pct ?? undefined,
            }
          : { href: "/admin/tickets", label: "Ticket sales", value: "-", sub: "Open the tickets page" },
        ...(ticketSummary
          ? [
              {
                href: "/admin/tickets",
                label: "Gross ticket revenue",
                value: money(ticketSummary.revenue),
                sub: `+${ticketSummary.last7} tickets this week`,
              },
            ]
          : []),
        {
          href: "/admin/subscribers",
          label: "Subscribers",
          value: String(counts.subscribers),
          sub: `+${subs7Res.count ?? 0} this week`,
        },
        {
          href: "/admin/partners",
          label: "Partner pipeline",
          value: String(counts.partners),
          sub: "organisations on the board",
        },
      ]
    : null;

  return (
    <HomeView
      greeting={greetingFor()}
      today={todayLabel}
      denied={
        denied
          ? "That page needs full admin access. Your account is set to community access: Comms."
          : undefined
      }
      pulse={pulse}
      forms={
        isFull
          ? submissionRows.map((r) => ({ label: r.label, count: r.count, href: r.href }))
          : null
      }
      workspaces={groups}
    />
  );
}

function greetingFor() {
  // Server runs in UTC; greet by Newcastle local time, not UTC.
  const hourStr = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: "Australia/Sydney",
  }).format(new Date());
  const hour = Number(hourStr) % 24;
  return hour < 5 || hour >= 22
    ? "Up late"
    : hour < 12
      ? "Good morning"
      : hour < 18
        ? "Good afternoon"
        : "Good evening";
}
