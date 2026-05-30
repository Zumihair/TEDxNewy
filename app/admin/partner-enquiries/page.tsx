import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Badge, Flash, PageHeader } from "../ui";
import SubmissionsTable, { type Column, type Row } from "../SubmissionsTable";
import { deletePartnerEnquiry } from "../submissions-actions";

const columns: Column[] = [
  { id: "organisation", label: "Organisation" },
  {
    id: "tier",
    label: "Tier",
    format: (v) => (v ? <Badge tone="red">{String(v)}</Badge> : null),
  },
  { id: "contact_name", label: "Contact" },
  { id: "role", label: "Role" },
  { id: "email", label: "Email", hrefFor: (v) => `mailto:${String(v)}` },
  { id: "phone", label: "Phone", hrefFor: (v) => (v ? `tel:${String(v)}` : null) },
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
