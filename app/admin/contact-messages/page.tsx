import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Flash, PageHeader } from "../ui";
import SubmissionsTable, { type Column, type Row } from "../SubmissionsTable";
import {
  bulkDeleteContactMessages,
  bulkSetContactMessagesContacted,
  deleteContactMessage,
  setContactMessageContacted,
} from "../submissions-actions";

const columns: Column[] = [
  {
    id: "first_name",
    label: "From",
    combine: ["first_name", "last_name"],
    headline: true,
  },
  { id: "last_name", label: "Last name", detailOnly: true },
  { id: "email", label: "Email", link: "mailto", headline: true },
  { id: "phone", label: "Phone", link: "tel" },
  { id: "message", label: "Message" },
];

export default async function AdminContactMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { deleted } = await searchParams;
  const supabase = await getServerSupabase();
  const [, { data }] = await Promise.all([
    requireAdmin(),
    supabase.from("contact_messages").select("*").order("created_at", {
      ascending: false,
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Submissions · Contact"
        title="General enquiries"
        description={`${data?.length ?? 0} message${data?.length === 1 ? "" : "s"}. Toggle "Hide spam" to focus on real ones — heuristic flags rocketdigitaltech.com, Money Robot, and other repeat SEO outreach patterns.`}
      />
      {deleted && <Flash tone="ok">Deleted.</Flash>}
      <SubmissionsTable
        rows={(data ?? []) as Row[]}
        columns={columns}
        searchKeys={["first_name", "last_name", "email", "phone", "message"]}
        deleteAction={deleteContactMessage}
        contactedAction={setContactMessageContacted}
        bulkDeleteAction={bulkDeleteContactMessages}
        bulkContactedAction={bulkSetContactMessagesContacted}
        exportName="contact-messages"
        spamPreset="contact"
      />
    </div>
  );
}
