import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { PageHeader } from "../ui";
import RegistrationsTable, { type Registration } from "./RegistrationsTable";

export const metadata = {
  title: "Youth Futures Lab · Admin · TEDxNewy",
};

export default async function AdminYouthFuturesPage() {
  await requireAdmin();
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("youth_futures_registrations")
    .select(
      "id, created_at, school_name, suburb, contact_name, contact_role, email, phone, student_count, year_levels, comments, marketing_consent, school_authorised",
    )
    .order("created_at", { ascending: false });

  const rows: Registration[] = (data ?? []) as Registration[];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Submissions"
        title="Youth Futures Lab — EOIs"
        description={
          rows.length === 0 && !error
            ? "No registrations yet. Submissions will appear here as schools register through /youth-futures-lab."
            : `${rows.length} school${rows.length === 1 ? "" : "s"} registered. Deadline: 15 June 2026.`
        }
      />

      {error && (
        <div className="rounded-[var(--radius-md)] border border-[#e02214]/30 bg-[#e02214]/10 px-4 py-3 text-[13.5px] text-[#b91404]">
          Couldn&rsquo;t load registrations. The Supabase migration may not have
          run yet, or the connection is failing. Check the SQL editor for the
          `youth_futures_registrations` table.
        </div>
      )}

      <RegistrationsTable rows={rows} />
    </div>
  );
}
