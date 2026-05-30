import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Badge, Flash, PageHeader } from "../ui";
import SubmissionsTable, { type Column, type Row } from "../SubmissionsTable";
import { deleteApplication } from "../submissions-actions";

const columns: Column[] = [
  {
    id: "first_name",
    label: "Name",
    format: (_v, row) =>
      [row.first_name, row.last_name].filter(Boolean).join(" "),
  },
  { id: "last_name", label: "Last name", detailOnly: true },
  {
    id: "crew",
    label: "Crew",
    format: (v) => (v ? <Badge tone="red">{String(v)}</Badge> : null),
  },
  { id: "email", label: "Email", hrefFor: (v) => `mailto:${String(v)}` },
  { id: "phone", label: "Phone", hrefFor: (v) => (v ? `tel:${String(v)}` : null) },
  { id: "note", label: "Note" },
];

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  await requireAdmin();
  const { deleted } = await searchParams;
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Submissions · Volunteer"
        title="Volunteer applications"
        description={`${data?.length ?? 0} application${data?.length === 1 ? "" : "s"} in the pipeline. Posted from /volunteer, expected reply window: four weeks.`}
      />
      {deleted && <Flash tone="ok">Deleted.</Flash>}
      <SubmissionsTable
        rows={(data ?? []) as Row[]}
        columns={columns}
        searchKeys={["first_name", "last_name", "email", "crew", "note"]}
        deleteAction={deleteApplication}
        exportName="applications"
      />
    </div>
  );
}
