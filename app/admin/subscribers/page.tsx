import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Flash, PageHeader } from "../ui";
import SubmissionsTable, { type Column, type Row } from "../SubmissionsTable";
import {
  bulkDeleteSubscribers,
  deleteSubscriber,
} from "../submissions-actions";

const columns: Column[] = [
  { id: "email", label: "Email", link: "mailto", headline: true },
  { id: "source", label: "Source", mono: true, prefix: "via ", headline: true },
  { id: "user_agent", label: "User agent", detailOnly: true },
];

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { deleted } = await searchParams;
  const supabase = await getServerSupabase();
  const [, { data }] = await Promise.all([
    requireAdmin(),
    supabase
      .from("subscribers")
      .select("id, created_at, email, source, user_agent, ip")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Submissions · Subscribers"
        title="Newsletter signups"
        description={`${data?.length ?? 0} email${data?.length === 1 ? "" : "s"} on the list. Posts to /api/subscribe from the home page + /subscribe.`}
      />
      {deleted && <Flash tone="ok">Deleted.</Flash>}
      <SubmissionsTable
        rows={(data ?? []) as Row[]}
        columns={columns}
        searchKeys={["email", "source"]}
        deleteAction={deleteSubscriber}
        bulkDeleteAction={bulkDeleteSubscribers}
        exportName="subscribers"
      />
    </div>
  );
}
