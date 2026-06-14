import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { PageHeader } from "../ui";
import SubmissionsTable, { type Column, type Row } from "../SubmissionsTable";
import { deleteTalkNight, setTalkNightContacted } from "../submissions-actions";

export const metadata = {
  title: "60-Second Talk Night · Admin · TEDxNewy",
};

const columns: Column[] = [
  { id: "full_name", label: "Name", headline: true },
  { id: "attendance_type", label: "Interest", headline: true, badge: "red" },
  { id: "email", label: "Email", link: "mailto" },
  { id: "phone", label: "Phone", link: "tel" },
  { id: "idea", label: "Idea" },
  { id: "comments", label: "Comments" },
  { id: "marketing_consent", label: "Marketing consent", boolean: true },
];

export default async function AdminTalkNightPage() {
  const supabase = await getServerSupabase();

  const [, { data, error }] = await Promise.all([
    requireAdmin(),
    supabase
      .from("talk_night_registrations")
      .select(
        "id, created_at, full_name, email, phone, attendance_type, idea, comments, marketing_consent, contacted",
      )
      .order("created_at", { ascending: false }),
  ]);

  const rows = (data ?? []) as Row[];
  const speakers = rows.filter(
    (r) => r.attendance_type === "speak" || r.attendance_type === "both",
  ).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Submissions"
        title="60-Second Talk Night — EOIs"
        description={
          rows.length === 0 && !error
            ? "No registrations yet. Submissions will appear here as people register through /60-second-talk-night."
            : `${rows.length} registration${rows.length === 1 ? "" : "s"} · ${speakers} keen to speak. Event: 16 July 2026, The Base.`
        }
      />

      {error && (
        <div className="rounded-[var(--radius-md)] border border-[#e02214]/30 bg-[#e02214]/10 px-4 py-3 text-[13.5px] text-[#b91404]">
          Couldn&rsquo;t load registrations. The Supabase migration may not have
          run yet, or the connection is failing. Check the SQL editor for the
          `talk_night_registrations` table.
        </div>
      )}

      <SubmissionsTable
        rows={rows}
        columns={columns}
        searchKeys={["full_name", "email", "attendance_type", "idea"]}
        deleteAction={deleteTalkNight}
        contactedAction={setTalkNightContacted}
        exportName="talk-night-registrations"
      />
    </div>
  );
}
