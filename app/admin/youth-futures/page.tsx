import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { PageHeader } from "../ui";
import SubmissionsTable, { type Column, type Row } from "../SubmissionsTable";
import {
  bulkDeleteYouthFutures,
  bulkSetYouthFuturesContacted,
  deleteYouthFutures,
  setYouthFuturesContacted,
} from "../submissions-actions";

export const metadata = {
  title: "Youth Futures Lab · Admin · TEDxNewy",
};

const columns: Column[] = [
  { id: "school_name", label: "School", headline: true },
  { id: "suburb", label: "Suburb", headline: true },
  { id: "student_count", label: "Students", headline: true },
  { id: "year_levels", label: "Year levels" },
  { id: "contact_name", label: "Contact" },
  { id: "contact_role", label: "Role" },
  { id: "email", label: "Email", link: "mailto" },
  { id: "phone", label: "Phone", link: "tel" },
  { id: "marketing_consent", label: "Marketing consent", boolean: true },
  { id: "school_authorised", label: "School authorised", boolean: true },
  { id: "comments", label: "Comments" },
];

export default async function AdminYouthFuturesPage() {
  const supabase = await getServerSupabase();

  const [, { data, error }] = await Promise.all([
    requireAdmin(),
    supabase
      .from("youth_futures_registrations")
      .select(
        "id, created_at, school_name, suburb, contact_name, contact_role, email, phone, student_count, year_levels, comments, marketing_consent, school_authorised, contacted",
      )
      .order("created_at", { ascending: false }),
  ]);

  const rows = (data ?? []) as Row[];
  const totalStudents = rows.reduce(
    (sum, r) => sum + (Number(r.student_count) || 0),
    0,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Submissions"
        title="Youth Futures Lab — EOIs"
        description={
          rows.length === 0 && !error
            ? "No registrations yet. Submissions will appear here as schools register through /youth-futures-lab."
            : `${rows.length} school${rows.length === 1 ? "" : "s"} registered · ${totalStudents} students. Deadline: 26 June 2026.`
        }
      />

      {error && (
        <div className="rounded-[var(--radius-md)] border border-[#e02214]/30 bg-[#e02214]/10 px-4 py-3 text-[13.5px] text-[#b91404]">
          Couldn&rsquo;t load registrations. This may not be fully set up yet,
          or the connection is down. Ask Will to take a look.
        </div>
      )}

      <SubmissionsTable
        rows={rows}
        columns={columns}
        searchKeys={[
          "school_name",
          "suburb",
          "contact_name",
          "email",
          "year_levels",
        ]}
        deleteAction={deleteYouthFutures}
        contactedAction={setYouthFuturesContacted}
        bulkDeleteAction={bulkDeleteYouthFutures}
        bulkContactedAction={bulkSetYouthFuturesContacted}
        exportName="youth-futures-registrations"
      />
    </div>
  );
}
