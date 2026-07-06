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

// Soft icon-chip palette. Gives each tile its own colour without turning the
// whole card into a colour block, so the grid reads as varied but calm.
const CHIP: Record<string, { bg: string; fg: string }> = {
  red: { bg: "#fde9e7", fg: "#b91404" },
  amber: { bg: "#faf0e2", fg: "#a66a1d" },
  coast: { bg: "#e8f0f3", fg: "#1f4a5c" },
  green: { bg: "#e7f1ea", fg: "#2f6f4e" },
  indigo: { bg: "#eceafa", fg: "#5b53c6" },
  rose: { bg: "#fce9ef", fg: "#b33063" },
};

// Per-destination look, keyed by href. Presentation only, kept out of
// nav-config so that stays a pure data module shared with the sidebar.
const ACCENT: Record<string, string> = {
  "/admin/events": "red",
  "/admin/talks": "coast",
  "/admin/speakers": "amber",
  "/admin/team": "indigo",
  "/admin/posts": "green",
  "/admin/emails": "red",
  "/admin/newsletter": "amber",
  "/admin/subscriber-flow": "indigo",
  "/admin/subscribers": "coast",
  "/admin/socials": "coast",
  "/admin/navigation": "green",
  "/admin/notifications": "rose",
  "/admin/admins": "indigo",
};

// The one primary action rendered as a full-colour feature tile.
const FEATURE = new Set(["/admin/emails"]);

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
    return Icon ? <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} /> : null;
  };

  const cardsFor = (heading: string) =>
    groupItems(heading).map((item) => ({
      href: item.href,
      icon: iconFor(item.iconName),
      title: item.label,
      sub: item.description ?? "",
      count: item.countKey ? counts[item.countKey] : undefined,
      tool: item.tool,
      soon: item.status === "soon",
      accent: ACCENT[item.href] ?? "coast",
    }));

  // One ordered list of tiles for the bento grid: Content, then Community,
  // then Settings. Forms gets its own feature tile at the top-left.
  const tiles = [
    ...cardsFor("Content"),
    ...cardsFor("Community"),
    ...cardsFor("Settings"),
  ];

  const todayLabel = new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Australia/Sydney",
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* Compact header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
            style={{ letterSpacing: "0.22em" }}
          >
            Dashboard
          </div>
          <h1
            className="mt-1.5 font-sans font-medium tracking-[-0.02em] text-[#141210]"
            style={{
              fontSize: "clamp(1.6rem, 3vw, 2rem)",
              fontVariationSettings: '"opsz" 144',
            }}
          >
            {greetingFor(email)}
          </h1>
        </div>
        <div
          className="font-mono text-[10.5px] font-semibold uppercase text-[#9a9186]"
          style={{ letterSpacing: "0.18em" }}
        >
          {todayLabel}
        </div>
      </div>

      {/* Bento grid: forms feature + every destination, tuned to one screen */}
      <ul className="grid auto-rows-[120px] grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {/* Forms feature — dark, with the live total and a chip per form */}
        <li className="col-span-2 row-span-2">
          <div className="flex h-full flex-col justify-between rounded-[var(--radius-md)] bg-[#141210] p-5 text-white shadow-[var(--shadow-sm)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
                  <Inbox className="h-[18px] w-[18px]" strokeWidth={2.25} />
                </span>
                <div
                  className="font-mono text-[10px] font-semibold uppercase text-white/45"
                  style={{ letterSpacing: "0.22em" }}
                >
                  Forms inbox
                </div>
              </div>
              <Link
                href="/admin/forms"
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[11.5px] font-medium text-white/90 transition-colors hover:bg-white/20"
              >
                Open inbox
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} />
              </Link>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className="font-sans font-medium leading-none tracking-[-0.03em]"
                style={{
                  fontSize: "clamp(2.2rem, 4vw, 3rem)",
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                {submissionTotal}
              </span>
              <span className="text-[12.5px] text-white/55">
                total submissions across all forms
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {submissionRows.map((s) => (
                <Link
                  key={s.id}
                  href={s.href}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white"
                >
                  <span>{s.label}</span>
                  <span className="font-mono text-[11px] font-semibold text-white">
                    {s.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </li>

        {tiles.map((t) => (
          <Tile key={t.href} {...t} />
        ))}
      </ul>
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

function Tile({
  href,
  icon,
  title,
  sub,
  count,
  tool,
  soon,
  accent,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  sub: string;
  count?: number;
  /** A tool with no meaningful count — shows an open arrow instead. */
  tool?: boolean;
  /** Not yet built — muted, with a "Soon" pill. */
  soon?: boolean;
  accent: string;
}) {
  // The primary action gets a full-colour treatment; everything else is a
  // calm card with a coloured icon chip.
  if (FEATURE.has(href)) {
    return (
      <li>
        <Link
          href={href}
          className="group flex h-full flex-col justify-between rounded-[var(--radius-md)] bg-gradient-to-br from-[#e02214] to-[#b91404] p-4 text-white shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
        >
          <div className="flex items-start justify-between">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white">
              {icon}
            </span>
            <ArrowUpRight
              className="h-5 w-5 text-white/85 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={2.25}
            />
          </div>
          <div>
            <div className="font-sans text-[15px] font-semibold leading-tight tracking-[-0.01em]">
              {title}
            </div>
            {sub && <div className="mt-0.5 text-[11.5px] text-white/70">{sub}</div>}
          </div>
        </Link>
      </li>
    );
  }

  const chip = CHIP[accent] ?? CHIP.coast;
  return (
    <li>
      <Link
        href={href}
        className={
          "group flex h-full flex-col justify-between rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.08)] bg-white p-4 shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:border-[rgba(20,18,16,0.16)] hover:shadow-[var(--shadow-md)]" +
          (soon ? " opacity-70" : "")
        }
      >
        <div className="flex items-start justify-between">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: chip.bg, color: chip.fg }}
            aria-hidden
          >
            {icon}
          </span>
          {soon ? (
            <span
              className="rounded-full bg-[rgba(20,18,16,0.06)] px-2 py-0.5 font-mono text-[9px] font-semibold uppercase text-[#6b6459]"
              style={{ letterSpacing: "0.16em" }}
            >
              Soon
            </span>
          ) : tool ? (
            <ArrowUpRight
              className="h-5 w-5 text-[#6b6459] transition-colors group-hover:text-[#141210]"
              strokeWidth={2.25}
            />
          ) : (
            <span
              className="font-sans font-medium leading-none tracking-[-0.02em] text-[#141210]"
              style={{
                fontSize: "clamp(1.5rem, 2.4vw, 1.9rem)",
                fontVariationSettings: '"opsz" 144',
              }}
            >
              {count}
            </span>
          )}
        </div>
        <div>
          <div className="font-sans text-[14.5px] font-medium leading-tight tracking-[-0.01em] text-[#141210]">
            {title}
          </div>
          {sub && (
            <div
              className="mt-0.5 font-mono text-[9.5px] font-semibold uppercase text-[#9a9186]"
              style={{ letterSpacing: "0.16em" }}
            >
              {sub}
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}
