import { Bell, Mail, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import {
  Badge,
  Card,
  DangerButton,
  Field,
  Flash,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  SectionLabel,
  inputCls,
} from "../ui";
import {
  addRecipient,
  deleteRecipient,
  toggleRecipient,
} from "./actions";

export const metadata = {
  title: "Notifications · Admin · TEDxNewy",
};

/**
 * Form sources that can have email notifications. Add new ones here as
 * other forms get wired up to lib/email-notify.
 */
const FORM_SOURCES: Array<{ value: string; label: string }> = [
  { value: "youth-futures", label: "Youth Futures Lab" },
];

const ERR_COPY: Record<string, string> = {
  "bad-email": "That doesn't look like a valid email address.",
  "bad-source": "Pick a form to notify on.",
  exists: "That email is already on this form's notification list.",
  failed: "Something went wrong. Try again.",
};

type Recipient = {
  id: string;
  form_source: string;
  email: string;
  label: string | null;
  active: boolean;
  created_at: string;
};

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    added?: string;
    removed?: string;
    toggled?: string;
    error?: string;
  }>;
}) {
  await requireAdmin();
  const { added, removed, toggled, error } = await searchParams;
  const supabase = await getServerSupabase();

  const { data, error: loadError } = await supabase
    .from("notification_recipients")
    .select("*")
    .order("form_source", { ascending: true })
    .order("created_at", { ascending: true });

  const recipients: Recipient[] = (data ?? []) as Recipient[];
  const sourceLabel = (s: string) =>
    FORM_SOURCES.find((x) => x.value === s)?.label ?? s;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Notifications"
        title="Who gets emailed when a form is submitted"
        description="Each form can copy multiple admins. Toggle inactive to keep someone in the audit trail without sending them mail. Currently only the Youth Futures Lab EOI form is wired to send notifications — other forms can be hooked up later."
      />

      {added && <Flash tone="ok">Recipient added.</Flash>}
      {removed && <Flash tone="ok">Recipient removed.</Flash>}
      {toggled && <Flash tone="ok">Updated.</Flash>}
      {error && <Flash tone="error">{ERR_COPY[error] ?? "Something went wrong."}</Flash>}

      {loadError && (
        <Flash tone="error">
          Couldn&rsquo;t load recipients. The Supabase migration creating the{" "}
          <code className="font-mono">notification_recipients</code> table may
          not have run yet.
        </Flash>
      )}

      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        {/* List */}
        <Card>
          <ul className="divide-y divide-[rgba(20,18,16,0.08)]">
            {recipients.map((r) => (
              <li
                key={r.id}
                className="grid grid-cols-[36px_1fr_auto] items-center gap-4 px-4 py-3.5 md:px-5"
              >
                <span
                  className={
                    "inline-flex h-9 w-9 items-center justify-center rounded-full " +
                    (r.active
                      ? "bg-[#e02214] text-white"
                      : "bg-[rgba(20,18,16,0.06)] text-[#6b6459]")
                  }
                  aria-hidden
                >
                  <Mail className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-sans text-[14.5px] font-medium text-[#141210]">
                      {r.email}
                    </span>
                    <Badge tone="neutral">{sourceLabel(r.form_source)}</Badge>
                    {!r.active && <Badge tone="draft">Paused</Badge>}
                  </div>
                  {r.label && (
                    <div className="mt-0.5 text-[12.5px] text-[#6b6459]">
                      {r.label}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <form action={toggleRecipient}>
                    <input type="hidden" name="id" value={r.id} />
                    <SecondaryButton type="submit">
                      {r.active ? "Pause" : "Activate"}
                    </SecondaryButton>
                  </form>
                  <form action={deleteRecipient}>
                    <input type="hidden" name="id" value={r.id} />
                    <DangerButton type="submit">
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                      Remove
                    </DangerButton>
                  </form>
                </div>
              </li>
            ))}
            {recipients.length === 0 && !loadError && (
              <li className="px-5 py-12 text-center text-[14px] text-[#6b6459]">
                No recipients yet. Add one to the right — submissions will go
                to that address.
              </li>
            )}
          </ul>
        </Card>

        {/* Add form */}
        <aside className="md:sticky md:top-8 md:self-start">
          <SectionLabel>Add a recipient</SectionLabel>
          <Card className="mt-3 space-y-4 p-5">
            <form action={addRecipient} className="space-y-4">
              <Field label="Form">
                <select
                  name="formSource"
                  required
                  defaultValue={FORM_SOURCES[0].value}
                  className={inputCls}
                >
                  {FORM_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Email">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="teammate@tedxnewy.com.au"
                  className={inputCls}
                />
              </Field>
              <Field
                label="Label"
                hint="Optional — context like 'Activations team'."
              >
                <input
                  name="label"
                  placeholder="e.g. Will (co-director)"
                  className={inputCls}
                />
              </Field>
              <div className="flex">
                <PrimaryButton type="submit">
                  <Plus className="h-4 w-4" strokeWidth={2.25} />
                  Add recipient
                </PrimaryButton>
              </div>
            </form>
            <div className="rounded-[var(--radius-sm)] bg-[#f9f5ec] p-3 text-[12px] leading-[1.55] text-[#6b6459]">
              <div className="inline-flex items-center gap-1.5 text-[#141210]">
                <Bell className="h-3.5 w-3.5" strokeWidth={2.25} />
                <span
                  className="font-mono text-[10.5px] font-semibold uppercase"
                  style={{ letterSpacing: "0.22em" }}
                >
                  Heads-up
                </span>
              </div>
              <p className="mt-1.5">
                Notifications only send if{" "}
                <code className="font-mono text-[#141210]">RESEND_API_KEY</code>{" "}
                is set in Vercel env vars. Otherwise the form still saves
                submissions to Supabase silently.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
