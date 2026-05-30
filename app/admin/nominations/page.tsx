import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Badge, Flash, PageHeader } from "../ui";
import SubmissionsTable, { type Column, type Row } from "../SubmissionsTable";
import { deleteNomination } from "../submissions-actions";

const columns: Column[] = [
  { id: "nominee_name", label: "Nominee" },
  { id: "nominee_title", label: "What they do" },
  {
    id: "relationship",
    label: "Relationship",
    format: (v) => (v ? <Badge tone="neutral">{String(v)}</Badge> : null),
  },
  { id: "nominator_name", label: "Nominator" },
  {
    id: "nominator_email",
    label: "Nominator email",
    hrefFor: (v) => `mailto:${String(v)}`,
  },
  { id: "idea", label: "Idea" },
  {
    id: "link",
    label: "Link(s)",
    hrefFor: (v) => {
      // The form posts a single text field — extract the first http URL
      const m = String(v).match(/https?:\/\/\S+/);
      return m?.[0] ?? null;
    },
  },
];

export default async function AdminNominationsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  await requireAdmin();
  const { deleted } = await searchParams;
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("nominations")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Submissions · Speak"
        title="Speaker nominations"
        description={`${data?.length ?? 0} nomination${data?.length === 1 ? "" : "s"} for the curation committee. Posted from /speak, promised reply window: six weeks.`}
      />
      {deleted && <Flash tone="ok">Deleted.</Flash>}
      <SubmissionsTable
        rows={(data ?? []) as Row[]}
        columns={columns}
        searchKeys={[
          "nominee_name",
          "nominee_title",
          "nominator_name",
          "nominator_email",
          "idea",
        ]}
        deleteAction={deleteNomination}
        exportName="nominations"
      />
    </div>
  );
}
