import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Flash, PageHeader } from "../ui";
import SubmissionsTable, { type Column, type Row } from "../SubmissionsTable";
import {
  bulkDeleteNominations,
  bulkSetNominationsContacted,
  deleteNomination,
  setNominationContacted,
} from "../submissions-actions";

const columns: Column[] = [
  { id: "nominee_name", label: "Nominee", headline: true },
  { id: "nominee_title", label: "What they do", headline: true },
  { id: "relationship", label: "Relationship", badge: "neutral" },
  { id: "nominator_name", label: "Nominator" },
  { id: "nominator_email", label: "Nominator email", link: "mailto" },
  { id: "idea", label: "Idea" },
  // Free-text field — link out to the first http URL it contains.
  { id: "link", label: "Link(s)", link: "url" },
];

export default async function AdminNominationsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { deleted } = await searchParams;
  const supabase = await getServerSupabase();
  const [, { data }] = await Promise.all([
    requireAdmin(),
    supabase.from("nominations").select("*").order("created_at", {
      ascending: false,
    }),
  ]);

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
        contactedAction={setNominationContacted}
        bulkDeleteAction={bulkDeleteNominations}
        bulkContactedAction={bulkSetNominationsContacted}
        exportName="nominations"
      />
    </div>
  );
}
