import Link from "next/link";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Flash, PageHeader } from "../ui";
import SubmissionsTable, { type Column, type Row } from "../SubmissionsTable";
import {
  bulkDeleteSubscribers,
  deleteSubscriber,
} from "../submissions-actions";
import ImportSubscribers from "./ImportSubscribers";

const columns: Column[] = [
  { id: "email", label: "Email", link: "mailto", headline: true },
  { id: "sub_status", label: "Status", headline: true },
  { id: "source", label: "Source", mono: true, prefix: "via ", headline: true },
  { id: "user_agent", label: "User agent", detailOnly: true },
  { id: "unsubscribed_at", label: "Unsubscribed at", detailOnly: true },
];

type View = "all" | "subscribed" | "unsubscribed";

const VIEWS: { key: View; label: string }[] = [
  { key: "all", label: "All" },
  { key: "subscribed", label: "Subscribed" },
  { key: "unsubscribed", label: "Unsubscribed" },
];

type SubscriberRow = {
  id: string;
  created_at: string;
  email: string | null;
  source: string | null;
  user_agent: string | null;
  ip: string | null;
  unsubscribed_at: string | null;
};

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; view?: string }>;
}) {
  const { deleted, view: viewParam } = await searchParams;
  const view: View =
    viewParam === "subscribed" || viewParam === "unsubscribed"
      ? viewParam
      : "all";

  const supabase = await getServerSupabase();
  const [, { data }] = await Promise.all([
    requireAdmin(),
    supabase
      .from("subscribers")
      .select("id, created_at, email, source, user_agent, ip, unsubscribed_at")
      .order("created_at", { ascending: false }),
  ]);

  const all = (data ?? []) as SubscriberRow[];
  const subscribedCount = all.filter((r) => !r.unsubscribed_at).length;
  const unsubscribedCount = all.length - subscribedCount;

  const counts: Record<View, number> = {
    all: all.length,
    subscribed: subscribedCount,
    unsubscribed: unsubscribedCount,
  };

  const rows: Row[] = all
    .filter((r) =>
      view === "subscribed"
        ? !r.unsubscribed_at
        : view === "unsubscribed"
          ? !!r.unsubscribed_at
          : true,
    )
    .map((r) => ({
      ...r,
      sub_status: r.unsubscribed_at ? "Unsubscribed" : "Subscribed",
    })) as Row[];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Community · Subscribers"
        title="Newsletter signups"
        description={`${subscribedCount} subscribed, ${unsubscribedCount} unsubscribed. Posts to /api/subscribe from the home page and /subscribe.`}
        actions={<ImportSubscribers />}
      />

      {deleted && <Flash tone="ok">Deleted.</Flash>}

      {/* Subscribed / unsubscribed filter */}
      <div className="flex items-center gap-1 border-b border-[rgba(20,18,16,0.10)]">
        {VIEWS.map((v) => {
          const active = v.key === view;
          return (
            <Link
              key={v.key}
              href={`/admin/subscribers?view=${v.key}`}
              className={
                "-mb-px border-b-2 px-4 py-2.5 text-[13.5px] font-medium transition-colors " +
                (active
                  ? "border-[#e02214] text-[#141210]"
                  : "border-transparent text-[#6b6459] hover:text-[#141210]")
              }
            >
              {v.label}{" "}
              <span className="text-[#a59f93]">{counts[v.key]}</span>
            </Link>
          );
        })}
      </div>

      <SubmissionsTable
        rows={rows}
        columns={columns}
        searchKeys={["email", "source", "sub_status"]}
        deleteAction={deleteSubscriber}
        bulkDeleteAction={bulkDeleteSubscribers}
        exportName="subscribers"
      />
    </div>
  );
}
