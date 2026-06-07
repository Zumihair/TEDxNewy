import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Flash, PageHeader } from "../ui";
import SubmissionsTable, { type Column, type Row } from "../SubmissionsTable";
import { deleteApplication } from "../submissions-actions";

const columns: Column[] = [
  {
    id: "first_name",
    label: "Name",
    combine: ["first_name", "last_name"],
    headline: true,
  },
  { id: "last_name", label: "Last name", detailOnly: true },
  { id: "crew", label: "Crew", badge: "red", headline: true },
  { id: "email", label: "Email", link: "mailto" },
  { id: "phone", label: "Phone", link: "tel" },
  { id: "note", label: "Note" },
];

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { deleted } = await searchParams;
  const supabase = await getServerSupabase();
  const [, { data }] = await Promise.all([
    requireAdmin(),
    supabase.from("applications").select("*").order("created_at", {
      ascending: false,
    }),
  ]);

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
