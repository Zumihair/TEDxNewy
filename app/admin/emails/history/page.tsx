import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Badge, Flash, PageHeader } from "../../ui";

export const metadata = {
  title: "Email history · Admin · TEDxNewy",
};

type Row = {
  id: string;
  created_at: string;
  batch_id: string;
  from_email: string | null;
  to_email: string;
  cc: string | null;
  subject: string;
  body: string | null;
  status: string;
  error: string | null;
  resend_id: string | null;
};

type Batch = {
  id: string;
  created_at: string;
  subject: string;
  from_email: string | null;
  cc: string | null;
  body: string | null;
  recipients: Row[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function EmailHistoryPage() {
  const supabase = await getServerSupabase();
  const [, { data, error }] = await Promise.all([
    requireAdmin(),
    supabase
      .from("email_sends")
      .select(
        "id, created_at, batch_id, from_email, to_email, cc, subject, body, status, error, resend_id",
      )
      .order("created_at", { ascending: false })
      .limit(3000),
  ]);

  const rows = (data ?? []) as Row[];

  // Group rows (already newest-first) into the compose action they belong to.
  const batches: Batch[] = [];
  const byId = new Map<string, Batch>();
  for (const r of rows) {
    let b = byId.get(r.batch_id);
    if (!b) {
      b = {
        id: r.batch_id,
        created_at: r.created_at,
        subject: r.subject,
        from_email: r.from_email,
        cc: r.cc,
        body: r.body,
        recipients: [],
      };
      byId.set(r.batch_id, b);
      batches.push(b);
    }
    b.recipients.push(r);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings · Emails"
        title="Send history"
        description="Every one-off email sent from Compose, newest first. “Sent” means Resend accepted the message; a failure shows the reason. It doesn't confirm the inbox, but it does confirm whether the message left."
        backHref="/admin/emails"
      />

      {error && (
        <Flash tone="error">
          Couldn&rsquo;t load the history. The{" "}
          <code className="font-mono">email_sends</code> table may not exist
          yet. Run the 20260702_email_sends.sql migration in Supabase.
        </Flash>
      )}

      {!error && batches.length === 0 && (
        <div className="rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white px-5 py-8 text-center text-[14px] text-[#6b6459]">
          No emails sent from Compose yet. Once you send one, every recipient
          and its status will appear here.
        </div>
      )}

      <div className="space-y-4">
        {batches.map((b) => {
          const sent = b.recipients.filter((r) => r.status === "sent").length;
          const failed = b.recipients.length - sent;
          return (
            <article
              key={b.id}
              className="overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(20,18,16,0.08)] px-5 py-4">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-[#141210]">
                    {b.subject}
                  </div>
                  <div className="mt-1 text-[12.5px] text-[#6b6459]">
                    {formatDate(b.created_at)}
                    {b.from_email ? ` · from ${b.from_email}` : ""}
                    {b.cc ? ` · cc ${b.cc}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone="live">{sent} sent</Badge>
                  {failed > 0 && <Badge tone="red">{failed} failed</Badge>}
                </div>
              </div>

              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-[13px] font-medium text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.02)]">
                  <span>
                    {b.recipients.length} recipient
                    {b.recipients.length === 1 ? "" : "s"}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8a8278] group-open:hidden">
                    Show
                  </span>
                  <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-[#8a8278] group-open:inline">
                    Hide
                  </span>
                </summary>
                <ul className="divide-y divide-[rgba(20,18,16,0.06)] border-t border-[rgba(20,18,16,0.06)]">
                  {b.recipients.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5"
                    >
                      <span className="min-w-0 break-all text-[13.5px] text-[#141210]">
                        {r.to_email}
                      </span>
                      <span className="flex items-center gap-2">
                        {r.error && (
                          <span className="text-[12px] text-[#b91404]">
                            {r.error}
                          </span>
                        )}
                        <Badge tone={r.status === "sent" ? "live" : "red"}>
                          {r.status}
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            </article>
          );
        })}
      </div>
    </div>
  );
}
