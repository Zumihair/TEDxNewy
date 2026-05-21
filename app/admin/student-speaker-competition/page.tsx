import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { PageHeader } from "../ui";
import SubmissionsTable, { type Submission } from "./SubmissionsTable";

export const metadata = {
  title: "Student Speaker Competition · Admin · TEDxNewy",
};

export default async function AdminStudentSpeakerPage() {
  await requireAdmin();
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("student_speaker_submissions")
    .select(
      "id, created_at, full_name, email, phone, school, post_code, city, talk_title, video_url",
    )
    .order("created_at", { ascending: false });

  const rows: Submission[] = (data ?? []) as Submission[];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Submissions"
        title="Student Speaker Competition — entries"
        description={
          rows.length === 0 && !error
            ? "No entries yet. Submissions will appear here as students enter via /student-speaker-competition."
            : `${rows.length} entr${rows.length === 1 ? "y" : "ies"}. Entries close 15 August 2026.`
        }
      />

      {error && (
        <div className="rounded-[var(--radius-md)] border border-[#e02214]/30 bg-[#e02214]/10 px-4 py-3 text-[13.5px] text-[#b91404]">
          Couldn&rsquo;t load entries. The Supabase migration may not have run
          yet, or the connection is failing. Check the SQL editor for the{" "}
          <code className="font-mono">student_speaker_submissions</code> table.
        </div>
      )}

      <SubmissionsTable rows={rows} />
    </div>
  );
}
