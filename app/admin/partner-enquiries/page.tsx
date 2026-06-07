import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Flash, PageHeader } from "../ui";
import SubmissionsTable, { type Column, type Row } from "../SubmissionsTable";
import { deletePartnerEnquiry } from "../submissions-actions";

const columns: Column[] = [
  { id: "organisation", label: "Organisation", headline: true },
  { id: "tier", label: "Tier", badge: "red" },
  { id: "contact_name", label: "Contact", headline: true },
  { id: "role", label: "Role" },
  { id: "email", label: "Email", link: "mailto" },
  { id: "phone", label: "Phone", link: "tel" },
  { id: "message", label: "Note" },
];

export default async function AdminPartnerEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  await requireAdmin();
  const { deleted } = await searchParams;
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("partner_enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Submissions · Partner"
        title="Partnership enquiries"
        description={`${data?.length ?? 0} enquir${data?.length === 1 ? "y" : "ies"}. Posted from /partner — back within a week with the 2026 partner pack.`}
      />
      {deleted && <Flash tone="ok">Deleted.</Flash>}
      <SubmissionsTable
        rows={(data ?? []) as Row[]}
        columns={columns}
        searchKeys={[
          "organisation",
          "contact_name",
          "role",
          "email",
          "tier",
          "message",
        ]}
        deleteAction={deletePartnerEnquiry}
        exportName="partner-enquiries"
      />
    </div>
  );
}
