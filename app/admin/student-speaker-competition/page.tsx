import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { PageHeader } from "../ui";
import SubmissionsTable, { type Column, type Row } from "../SubmissionsTable";
import {
  deleteStudentSpeaker,
  setStudentSpeakerContacted,
} from "../submissions-actions";

export const metadata = {
  title: "Student Speaker Competition · Admin · TEDxNewy",
};

const columns: Column[] = [
  { id: "full_name", label: "Student", headline: true },
  { id: "school", label: "School", headline: true },
  { id: "talk_title", label: "Talk title", headline: true },
  { id: "email", label: "Email", link: "mailto" },
  { id: "phone", label: "Phone", link: "tel" },
  { id: "city", label: "City / Suburb" },
  { id: "post_code", label: "Post code" },
  { id: "video_url", label: "Video", link: "url", linkLabel: "Watch entry" },
];

export default async function AdminStudentSpeakerPage() {
  const supabase = await getServerSupabase();

  const [, { data, error }] = await Promise.all([
    requireAdmin(),
    supabase
      .from("student_speaker_submissions")
      .select(
        "id, created_at, full_name, email, phone, school, post_code, city, talk_title, video_url, contacted",
      )
      .order("created_at", { ascending: false }),
  ]);

  const rows = (data ?? []) as Row[];

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

      <SubmissionsTable
        rows={rows}
        columns={columns}
        searchKeys={["full_name", "school", "email", "city", "talk_title"]}
        deleteAction={deleteStudentSpeaker}
        contactedAction={setStudentSpeakerContacted}
        exportName="student-speaker-entries"
      />
    </div>
  );
}
