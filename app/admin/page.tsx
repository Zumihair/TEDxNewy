import Link from "next/link";
import {
  ArrowUpRight,
  AtSign,
  Bell,
  CalendarDays,
  Film,
  Inbox,
  Newspaper,
  PanelsTopLeft,
  PenSquare,
  Send,
  Share2,
  ShieldCheck,
  UserCircle,
  Users,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { NAV_GROUPS } from "./nav-config";
import { FORM_REGISTRY } from "./forms/registry";
import { PageHeader, SectionLabel } from "./ui";

// Icons the dashboard cards render, keyed by the nav-config string names.
const ICONS: Record<string, LucideIcon> = {
  Inbox,
  AtSign,
  CalendarDays,
  Film,
  Users,
  UserCircle,
  PenSquare,
  Send,
  Newspaper,
  PanelsTopLeft,
  Share2,
  Bell,
  ShieldCheck,
  Waypoints,
};

const groupItems = (heading: string) =>
  NAV_GROUPS.find((g) => g.heading === heading)?.items ?? [];

export default async function AdminDashboard() {
  const supabase = await getServerSupabase();

  const [{ email }, baseCounts, formCounts, subscriberRes] = await Promise.all([
    requireAdmin(),
    Promise.all([
      supabase.from("cms_talks").select("*", { count: "exact", head: true }),
      supabase.from("cms_speakers").select("*", { count: "exact", head: true }),
      supabase
        .from("cms_team_members")
        .select("*", { count: "exact", head: true }),
      supabase.from("cms_posts").select("*", { count: "exact", head: true }),
      supabase.from("cms_admins").select("*", { count: "exact", head: true }),
      supabase
        .from("notification_recipients")
        .select("*", { count: "exact", head: true }),
      // cms_events may not exist yet (pre-migration); the count is null then.
      supabase.from("cms_events").select("*", { count: "exact", head: true }),
    ]),
    // Live count per form, in registry order, for the Forms tiles.
    Promise.all(
      FORM_REGISTRY.map((f) =>
        supabase.from(f.table).select("*", { count: "exact", head: true }),
      ),
    ),
    supabase.from("subscribers").select("*", { count: "exact", head: true }),
  ]);

  const [
    { count: talkCount },
    { count: speakerCount },
    { count: teamCount },
    { count: postCount },
    { count: adminCount },
    { count: recipientCount },
    { count: eventCount },
  ] = baseCounts;

  // Live counts, keyed by the countKey values used in nav-config.
  const counts: Record<string, number> = {
    talks: talkCount ?? 0,
    speakers: speakerCount ?? 0,
    team: teamCount ?? 0,
    posts: postCount ?? 0,
    admins: adminCount ?? 0,
    recipients: recipientCount ?? 0,
    events: eventCount ?? 0,
    subscribers: subscriberRes.count ?? 0,
  };

  // Forms tiles: label, slug and order from the form registry; count by table.
  const submissionRows = FORM_REGISTRY.map((f, i) => ({
    id: f.slug,
    label: f.label,
    href: `/admin/forms/${f.slug}`,
    count: formCounts[i]?.count ?? 0,
  }));
  const submissionTotal = submissionRows.reduce((acc, r) => acc + r.count, 0);

  const iconFor = (name: string): ReactNode => {
    const Icon = ICONS[name];
    return Icon ? <Icon className="h-4 w-4" strokeWidth={2.25} /> : null;
  };

  const cardsFor = (heading: string) =>
    groupItems(heading).map((item) => ({
      href: item.href,
      icon: iconFor(item.iconName),
      title: item.label,
      blurb: item.blurb ?? "",
      count: item.countKey ? counts[item.countKey] : undefined,
      tool: item.tool,
    }));

  const content = cardsFor("Content");
  const community = cardsFor("Community");
  const settings = cardsFor("Settings");

  return (
    <div className="space-y-12">
      <PageHeader eyebrow="Dashboard" title={greetingFor(email)} />

      {/* Forms — live counts per form */}
      <section className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <SectionLabel>
            Forms · {submissionTotal} total across all forms
          </SectionLabel>
          <Link
            href="/admin/forms"
            className="inline-flex items-center gap-1 font-mono text-[10.5px] font-semibold uppercase text-[#6b6459] transition-colors hover:text-[#e02214]"
            style={{ letterSpacing: "0.18em" }}
          >
            Open the inbox
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} />
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {submissionRows.map((s) => (
            <li key={s.id}>
              <Link
                href={s.href}
                className="group flex h-full flex-col rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[rgba(20,18,16,0.18)] hover:shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="font-mono text-[10px] font-semibold uppercase leading-[1.35] text-[#6b6459]"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    {s.label}
                  </span>
                  <Inbox
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6b6459] group-hover:text-[#141210]"
                    strokeWidth={2.25}
                  />
                </div>
                <div
                  className="mt-auto pt-4 font-sans font-medium leading-none tracking-[-0.02em] text-[#141210]"
                  style={{
                    fontSize: "clamp(1.5rem, 2.6vw, 1.85rem)",
                    fontVariationSettings: '"opsz" 144',
                  }}
                >
                  {s.count}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Content — editable site sections with live counts */}
      <section className="space-y-5">
        <SectionLabel>Content</SectionLabel>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {content.map((m) => (
            <ManageCard key={m.href} {...m} />
          ))}
        </ul>
      </section>

      {/* Community — outbound comms tools */}
      <section className="space-y-5">
        <SectionLabel>Community</SectionLabel>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {community.map((m) => (
            <ManageCard key={m.href} {...m} />
          ))}
        </ul>
      </section>

      {/* Settings & tools */}
      <section className="space-y-5">
        <SectionLabel>Settings &amp; tools</SectionLabel>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {settings.map((m) => (
            <ManageCard key={m.href} {...m} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function greetingFor(email: string) {
  const name = email.split("@")[0];
  const pretty =
    name.charAt(0).toUpperCase() + name.slice(1).replace(/[._-]+/g, " ");
  // Server runs in UTC; greet by Newcastle local time, not UTC.
  const hourStr = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: "Australia/Sydney",
  }).format(new Date());
  const hour = Number(hourStr) % 24;
  const greet =
    hour < 5 || hour >= 22
      ? "Up late"
      : hour < 12
        ? "Morning"
        : hour < 18
          ? "Afternoon"
          : "Evening";
  return `${greet}, ${pretty}.`;
}

function ManageCard({
  href,
  icon,
  title,
  blurb,
  count,
  tool,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  blurb: string;
  count?: number;
  /** A tool with no meaningful count — show an open affordance instead. */
  tool?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group block h-full rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[rgba(20,18,16,0.18)] hover:shadow-[var(--shadow-sm)]"
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#141210] text-white"
            aria-hidden
          >
            {icon}
          </span>
          {tool ? (
            <ArrowUpRight
              className="h-5 w-5 text-[#6b6459] transition-colors group-hover:text-[#141210]"
              strokeWidth={2.25}
            />
          ) : (
            <span
              className="font-sans font-medium leading-none tracking-[-0.02em] text-[#141210]"
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                fontVariationSettings: '"opsz" 144',
              }}
            >
              {count}
            </span>
          )}
        </div>
        <div className="mt-5 font-sans text-[17px] font-medium leading-tight tracking-[-0.01em] text-[#141210]">
          {title}
        </div>
        <p className="mt-1.5 text-[13px] leading-[1.5] text-[#6b6459]">{blurb}</p>
      </Link>
    </li>
  );
}
