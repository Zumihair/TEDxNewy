import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Flash, PageHeader } from "../ui";
import { FORM_SOURCES } from "./sources";

import NotificationMatrix, { type RecipientRow } from "./NotificationMatrix";
import { addRecipient, removeRecipient, setRecipientForm } from "./actions";
import FlashToast from "../FlashToast";

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
  const { added, removed, error } = await searchParams;
  const supabase = await getServerSupabase();

  const [, { data, error: loadError }] = await Promise.all([
    requireFullAdmin(),
    supabase
      .from("notification_recipients")
      .select("form_source, email, label, active")
      .order("email", { ascending: true }),
  ]);

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
    <div className="adm-stack">
      <PageHeader
        title="Notifications"
        description="Who is emailed when someone fills in a form."
      />

      {added && <FlashToast clear="added">Recipient added.</FlashToast>}
      {removed && <FlashToast clear="removed">Recipient removed.</FlashToast>}
      {error && (
        <FlashToast tone="error" clear="error">
          {ERR_COPY[error] ?? "Something went wrong."}
        </FlashToast>
      )}

      {loadError && (
        <Flash tone="error">
          Couldn&rsquo;t load recipients. This feature is not fully set up yet.
          Ask Will to finish the setup.
        </Flash>
      )}

      <NotificationMatrix
        forms={FORM_SOURCES}
        recipients={recipients}
        setAction={setRecipientForm}
        addAction={addRecipient}
        removeAction={removeRecipient}
      />

      <p className="adm-card__text">
        With nobody ticked for a form, its notifications go to <code>hello@tedxnewy.com.au</code>. Submissions are
        always saved either way.
      </p>
    </div>
  );
}
