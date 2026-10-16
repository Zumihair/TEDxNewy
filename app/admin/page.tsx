import { HomeView } from "./views";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { visibleGroupsFor } from "./access";
import { getTicketSummary } from "@/lib/ticket-summary";
import { VISIBLE_FORMS } from "./forms/registry";
import { dailyLine, nextEvent, subscriberGrowth } from "@/lib/admin-stats";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const supabase = await getServerSupabase();
  const [admin, { denied }] = await Promise.all([requireAdmin(), searchParams]);
  const can = (ws: string) => admin.access === "full" || admin.workspaces.includes(ws);
  const canEvents = can("events");
  const canComms = can("comms");
  const canInbox = can("inbox");

  const [tickets, growth, next, formCounts] = await Promise.all([
    canEvents ? getTicketSummary() : Promise.resolve(null),
    canComms ? subscriberGrowth(supabase, 13) : Promise.resolve(null),
    canEvents ? nextEvent(supabase) : Promise.resolve(null),
    canInbox
      ? Promise.all(
          VISIBLE_FORMS.map((f) => {
            let q = supabase.from(f.table).select("*", { count: "exact", head: true });
            if (f.filter) q = q.eq(f.filter.column, f.filter.value);
            return q;
          }),
        )
      : Promise.resolve(null),
  ]);

  const money = (n: number) =>
    n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });

  const stats = [
    ...(tickets
      ? [
          {
            href: "/admin/tickets",
            label: `${/signal|signature/i.test(tickets.eventName) ? "Signal" : tickets.eventName} tickets sold`,
            value: tickets.capacity ? `${tickets.sold}` : String(tickets.sold),
            foot: tickets.capacity ? `of ${tickets.capacity} · +${tickets.last7} this week` : `+${tickets.last7} this week`,
            pct: tickets.pct ?? undefined,
          },
          {
            href: "/admin/tickets",
            label: "Ticket revenue",
            value: money(tickets.revenue),
            foot: "before fees",
          },
        ]
      : []),
    ...(growth
      ? [
          {
            href: "/admin/newsletter",
            label: "Subscribers",
            value: growth.total.toLocaleString("en-AU"),
            foot: `+${growth.last7} this week`,
          },
        ]
      : []),
  ];

  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Australia/Sydney" }).format(new Date()),
  ) % 24;
  const greeting =
    hour < 5 || hour >= 22 ? "Up late" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const today = new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Australia/Sydney",
  }).format(new Date());

  let headline = dailyLine();
  if (next && next.days >= 0) {
    headline =
      next.days === 0
        ? `${next.title} is today.`
        : next.days === 1
          ? `${next.title} is tomorrow.`
          : `${next.title} is ${next.days} days away.`;
  }

  return (
    <HomeView
      greeting={greeting}
      headline={headline}
      today={today}
      denied={denied ? "That page isn't part of your access. Ask a full admin if you need it." : undefined}
      stats={stats}
      growth={growth}
      forms={
        formCounts
          ? VISIBLE_FORMS.map((f, i) => ({
              label: f.label,
              count: formCounts[i]?.count ?? 0,
              href: `/admin/forms/${f.slug}`,
            }))
          : null
      }
      workspaces={visibleGroupsFor({ level: admin.access, workspaces: admin.workspaces }).filter((g) => g.key !== "home")}
    />
  );
}
