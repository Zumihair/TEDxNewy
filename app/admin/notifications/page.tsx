import { Bell } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Flash, PageHeader } from "../ui";
import { FORM_SOURCES } from "./sources";
import NotificationMatrix, { type RecipientRow } from "./NotificationMatrix";
import { addRecipient, removeRecipient, setRecipientForm } from "./actions";

export const metadata = {
  title: "Notifications · Admin · TEDxNewy",
};

const ERR_COPY: Record<string, string> = {
  "bad-email": "That doesn't look like a valid email address.",
  "no-forms": "Pick at least one form for the recipient.",
  failed: "Something went wrong. Try again.",
};

type DbRow = {
  form_source: string;
  email: string;
  label: string | null;
  active: boolean;
};

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    added?: string;
    removed?: string;
    error?: string;
  }>;
}) {
  await requireAdmin();
  const { added, removed, error } = await searchParams;
  const supabase = await getServerSupabase();

  const { data, error: loadError } = await supabase
    .from("notification_recipients")
    .select("form_source, email, label, active")
    .order("email", { ascending: true });

  const rows = (data ?? []) as DbRow[];

  // One matrix row per email; a recipient is "on" for a form when an active
  // row exists for that (email, form_source) pair.
  const byEmail = new Map<string, RecipientRow>();
  for (const r of rows) {
    const existing =
      byEmail.get(r.email) ??
      ({ email: r.email, label: r.label, forms: [] } as RecipientRow);
    if (!existing.label && r.label) existing.label = r.label;
    if (r.active) existing.forms.push(r.form_source);
    byEmail.set(r.email, existing);
  }
  const recipients = [...byEmail.values()].sort((a, b) =>
    a.email.localeCompare(b.email),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings · Notifications"
        title="Who gets emailed when a form comes in"
        description="Pick a recipient, then tick the forms they should be copied on. Changes apply the moment you tick — every form in the grid is already wired to send."
      />

      {added && <Flash tone="ok">Recipient added.</Flash>}
      {removed && <Flash tone="ok">Recipient removed.</Flash>}
      {error && (
        <Flash tone="error">{ERR_COPY[error] ?? "Something went wrong."}</Flash>
      )}

      {loadError && (
        <Flash tone="error">
          Couldn&rsquo;t load recipients. The Supabase migration creating the{" "}
          <code className="font-mono">notification_recipients</code> table may
          not have run yet.
        </Flash>
      )}

      <NotificationMatrix
        forms={FORM_SOURCES}
        recipients={recipients}
        setAction={setRecipientForm}
        addAction={addRecipient}
        removeAction={removeRecipient}
      />

      <div className="flex items-start gap-2.5 rounded-[var(--radius-md)] bg-[#f9f5ec] px-4 py-3.5 text-[12.5px] leading-[1.55] text-[#6b6459]">
        <Bell
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#141210]"
          strokeWidth={2.25}
        />
        <p>
          Email only sends if{" "}
          <code className="font-mono text-[#141210]">RESEND_API_KEY</code> is set
          in the Vercel env vars. With nobody ticked for a form, its
          notifications fall back to{" "}
          <code className="font-mono text-[#141210]">hello@tedxnewy.com.au</code>
          . Submissions always save to Supabase regardless.
        </p>
      </div>
    </div>
  );
}
