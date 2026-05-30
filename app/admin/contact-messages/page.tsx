import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Flash, PageHeader } from "../ui";
import SubmissionsTable, { type Column, type Row } from "../SubmissionsTable";
import { deleteContactMessage } from "../submissions-actions";

const columns: Column[] = [
  {
    id: "first_name",
    label: "From",
    format: (_v, row) =>
      [row.first_name, row.last_name].filter(Boolean).join(" "),
  },
  { id: "last_name", label: "Last name", detailOnly: true },
  { id: "email", label: "Email", hrefFor: (v) => `mailto:${String(v)}` },
  { id: "phone", label: "Phone", hrefFor: (v) => (v ? `tel:${String(v)}` : null) },
  { id: "message", label: "Message" },
];

// Heuristic: lots of SEO scrapers reach out with very similar shapes.
function looksLikeSpam(row: Row): boolean {
  const msg = String(row.message ?? "").toLowerCase();
  const email = String(row.email ?? "").toLowerCase();
  const tells = [
    "seo",
    "google 1st page",
    "first page of google",
    "rocketdigitaltech",
    "money robot",
    "moneyrobot",
    "ethical marketing",
    "organic clients",
    "website design",
    "online visibility",
    "best regards",
  ];
  const hits = tells.filter((t) => msg.includes(t)).length;
  if (hits >= 2) return true;
  if (email.includes("rocketdigitaltech")) return true;
  // Single-tell low-effort outreach also tends to come with a generic phone like 7532833829 / 3238672815
  if (hits >= 1 && /^\d{10}$/.test(String(row.phone ?? ""))) return true;
  return false;
}

export default async function AdminContactMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  await requireAdmin();
  const { deleted } = await searchParams;
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

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
        exportName="contact-messages"
        isLikelySpam={looksLikeSpam}
      />
    </div>
  );
}
