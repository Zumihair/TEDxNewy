import Link from "next/link";
import {
  ArrowUpRight,
  AtSign,
  Newspaper,
  Plus,
  Waypoints,
} from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { listRecentCampaigns, mailchimpConfigured } from "@/lib/mailchimp";
import { PageHeader } from "../ui";
import { PendingButton } from "../PendingButtons";
import { THEMES } from "../section-theme";
import { createNewsletter } from "./actions";

export const metadata = {
  title: "Newsletter · Admin · TEDxNewy",
};

const red = THEMES.red; // Newsletter is a Community (red) page.

/** Readable Australia/Sydney date + time. Server runs in UTC. */
function fmtSydney(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export default async function AdminNewsletterHub() {
  await requireAdmin();
  const supabase = await getServerSupabase();

  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const [
    { data: newsletters },
    { count: subscribedCount },
    { count: newCount },
    { data: recentSubs },
    { data: flowSteps },
  ] = await Promise.all([
    supabase.from("newsletters").select("status, scheduled_at, sent_at"),
    supabase
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .is("unsubscribed_at", null),
    supabase
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .is("unsubscribed_at", null)
      .gte("created_at", monthAgo),
    supabase
      .from("subscribers")
      .select("email, created_at")
      .is("unsubscribed_at", null)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase.from("subscriber_flow_steps").select("enabled"),
  ]);

  // Latest Mailchimp campaign report, for the opens/clicks line on the tile.
  const latestReport = mailchimpConfigured()
    ? ((await listRecentCampaigns(1))[0] ?? null)
    : null;

  const rows = (newsletters ?? []) as {
    status: string;
    scheduled_at: string | null;
    sent_at: string | null;
  }[];
  const drafts = rows.filter((r) => r.status === "draft").length;
  const scheduled = rows.filter(
    (r) => r.status === "scheduled" || r.status === "sending",
  );
  const sent = rows.filter((r) => r.status === "sent");
  const nextSend = scheduled
    .map((r) => r.scheduled_at)
    .filter(Boolean)
    .sort()[0] as string | undefined;
  const lastSent = sent
    .map((r) => r.sent_at)
    .filter(Boolean)
    .sort()
    .at(-1) as string | undefined;

  const steps = (flowSteps ?? []) as { enabled: boolean }[];
  const liveSteps = steps.filter((s) => s.enabled).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Community · Newsletter"
        title="Newsletter"
        description="Everything subscriber email in one place: campaigns from draft to sent, the subscriber list, and the welcome flow new signups receive."
        actions={
          <form action={createNewsletter}>
            <PendingButton icon={<Plus className="h-4 w-4" strokeWidth={2.25} />}>
              New newsletter
            </PendingButton>
          </form>
        }
      />

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Campaigns */}
        <HubTile
          href="/admin/newsletter/campaigns"
          icon={<Newspaper className="h-5 w-5" strokeWidth={2} />}
          title="Campaigns"
          blurb="Build, schedule and send newsletters with the block editor."
        >
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Stat label="Drafts" value={drafts} />
            <Stat label="Scheduled" value={scheduled.length} />
            <Stat label="Sent" value={sent.length} />
          </div>
          <p className="mt-2 text-[12px] text-[#6b6459]">
            {nextSend
              ? `Next send ${fmtSydney(nextSend)}.`
              : lastSent
                ? `Last sent ${fmtSydney(lastSent)}.`
                : "Nothing sent yet."}
          </p>
          {latestReport && (
            <p className="mt-1 text-[12px] text-[#6b6459]">
              Last campaign: {Math.round(latestReport.openRate * 100)}% opened,{" "}
              {Math.round(latestReport.clickRate * 100)}% clicked.
            </p>
          )}
        </HubTile>

        {/* Subscribers */}
        <HubTile
          href="/admin/subscribers"
          icon={<AtSign className="h-5 w-5" strokeWidth={2} />}
          title="Subscribers"
          blurb="Who's on the list, with import, export and Mailchimp sync."
        >
          <div className="flex items-baseline gap-2">
            <span
              className="font-sans text-[26px] font-medium leading-none tracking-[-0.02em] text-[#141210]"
              style={{ fontVariationSettings: '"opsz" 144' }}
            >
              {subscribedCount ?? 0}
            </span>
            <span className="text-[12px] text-[#6b6459]">
              subscribed · {newCount ?? 0} new in the last 30 days
            </span>
          </div>
          {(recentSubs ?? []).length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {(recentSubs ?? []).map((s) => (
                <li
                  key={s.email}
                  className="truncate font-mono text-[11px] text-[#6b6459]"
                >
                  {s.email}
                </li>
              ))}
            </ul>
          )}
        </HubTile>

        {/* Subscriber flow */}
        <HubTile
          href="/admin/subscriber-flow"
          icon={<Waypoints className="h-5 w-5" strokeWidth={2} />}
          title="Subscriber flow"
          blurb="The welcome sequence every new subscriber receives."
        >
          <div className="flex items-baseline gap-2">
            <span
              className="font-sans text-[26px] font-medium leading-none tracking-[-0.02em] text-[#141210]"
              style={{ fontVariationSettings: '"opsz" 144' }}
            >
              {steps.length}
            </span>
            <span className="text-[12px] text-[#6b6459]">
              {steps.length === 1 ? "step" : "steps"} · {liveSteps} live
            </span>
          </div>
          <p className="mt-2 text-[12px] text-[#6b6459]">
            {liveSteps === 0
              ? "All steps are off; new subscribers get no welcome emails."
              : "The first live step sends the moment someone subscribes."}
          </p>
        </HubTile>
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span
        className="font-sans text-[20px] font-medium leading-none tracking-[-0.02em] text-[#141210]"
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        {value}
      </span>
      <span
        className="font-mono text-[9.5px] font-semibold uppercase text-[#9a9186]"
        style={{ letterSpacing: "0.14em" }}
      >
        {label}
      </span>
    </span>
  );
}

function HubTile({
  href,
  icon,
  title,
  blurb,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <li className="h-full">
      <Link
        href={href}
        className="group flex h-full flex-col rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.08)] bg-white p-5 shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
      >
        <div className="flex items-start justify-between">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: red.chipBg, color: red.chipFg }}
            aria-hidden
          >
            {icon}
          </span>
          <ArrowUpRight
            className="h-5 w-5 text-[#6b6459] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#141210]"
            strokeWidth={2.25}
          />
        </div>
        <div className="mt-4 font-sans text-[16.5px] font-medium leading-tight tracking-[-0.01em] text-[#141210]">
          {title}
        </div>
        <p className="mb-4 mt-1 text-[12.5px] leading-[1.5] text-[#6b6459]">
          {blurb}
        </p>
        <div className="mt-auto border-t border-[rgba(20,18,16,0.08)] pt-3.5">
          {children}
        </div>
      </Link>
    </li>
  );
}
