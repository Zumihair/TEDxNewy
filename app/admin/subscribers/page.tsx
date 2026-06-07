import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Flash, PageHeader } from "../ui";
import SubmissionsTable, { type Column, type Row } from "../SubmissionsTable";
import { deleteSubscriber } from "../submissions-actions";

const columns: Column[] = [
  { id: "email", label: "Email", link: "mailto" },
  { id: "source", label: "Source", mono: true, prefix: "via " },
  { id: "user_agent", label: "User agent", detailOnly: true },
];

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  await requireAdmin();
  const { deleted } = await searchParams;
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("subscribers")
    .select("id, created_at, email, source, user_agent, ip")
    .order("created_at", { ascending: false });

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
        exportName="subscribers"
      />
    </div>
  );
}
