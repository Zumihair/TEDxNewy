import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { listRecentResendEmails } from "@/lib/resend-activity";
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
  sent_by: string | null;
  recipients: Row[];
};

function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// A soft colour pill per admin, so at a glance you can tell who sent what.
// The colour is derived from the email, so each admin always gets the same
// one without any config. Tones avoid the green/red used by the status badges.
const SENDER_TONES: { bg: string; text: string }[] = [
  { bg: "rgba(99,102,241,0.14)", text: "#4338ca" }, // indigo
  { bg: "rgba(14,165,233,0.14)", text: "#0369a1" }, // sky
  { bg: "rgba(139,92,246,0.14)", text: "#6d28d9" }, // violet
  { bg: "rgba(20,184,166,0.16)", text: "#0f766e" }, // teal
  { bg: "rgba(244,63,94,0.13)", text: "#be123c" }, // rose
  { bg: "rgba(245,158,11,0.18)", text: "#a16207" }, // amber
  { bg: "rgba(217,70,239,0.13)", text: "#a21caf" }, // fuchsia
  { bg: "rgba(249,115,22,0.16)", text: "#c2410c" }, // orange
];

function senderTone(email: string): { bg: string; text: string } {
  let h = 0;
  const s = email.toLowerCase();
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return SENDER_TONES[h % SENDER_TONES.length];
}

function SenderChip({ email }: { email: string }) {
  const tone = senderTone(email);
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: tone.bg, color: tone.text }}
      title={`Sent by ${email}`}
    >
      {email}
    </span>
  );
}

/** Map a Resend delivery event to a badge tone. */
function eventTone(
  ev: string | null,
): "live" | "red" | "soon" | "neutral" {
  const e = (ev ?? "").toLowerCase();
  if (["delivered", "sent", "opened", "clicked"].includes(e)) return "live";
  if (["bounced", "complained", "failed"].includes(e)) return "red";
  if (["queued", "scheduled", "delivery_delayed"].includes(e)) return "soon";
  return "neutral";
}

export default async function EmailHistoryPage() {
  const supabase = await getServerSupabase();
  const [, { data, error }, resend] = await Promise.all([
    requireAdmin(),
    supabase
      .from("email_sends")
      .select(
        "id, created_at, batch_id, from_email, to_email, cc, subject, body, status, error, resend_id",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    listRecentResendEmails(100),
  ]);

  const rows = (data ?? []) as Row[];

  // Sender attribution lives in a column added later (sent_by). Fetch it in a
  // separate, optional query so a pre-migration state (column absent) returns
  // an error here without breaking the main history above.
  const sentByBatch = new Map<string, string>();
  const { data: attrib } = await supabase
    .from("email_sends")
    .select("batch_id, sent_by")
    .order("created_at", { ascending: false })
    .limit(2000);
  for (const r of (attrib ?? []) as { batch_id: string; sent_by: string | null }[]) {
    if (r.sent_by && !sentByBatch.has(r.batch_id)) {
      sentByBatch.set(r.batch_id, r.sent_by);
    }
  }

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
        sent_by: sentByBatch.get(r.batch_id) ?? null,
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
        description="Every one-off email sent from Compose, newest first. “Sent” means the email service accepted the message; a failure shows the reason. It doesn't confirm the inbox, but it does confirm whether the message left."
        backHref="/admin/emails"
      />

      {/* Live delivery activity, straight from the email service */}
      <section className="space-y-4">
        <div>
          <h2 className="font-sans text-[18px] font-semibold tracking-[-0.01em] text-[#141210]">
            Delivery activity
          </h2>
          <p className="mt-1 max-w-[70ch] text-[13px] leading-[1.6] text-[#6b6459]">
            Pulled live from the email service: every email the site has sent
            (form confirmations, admin notifications and your Compose sends),
            most recent 100, each with its latest delivery status. This includes
            emails sent before this log existed.
          </p>
        </div>

        {!resend.configured && (
          <Flash tone="error">
            The email service isn&rsquo;t connected yet, so activity can&rsquo;t
            be pulled. Ask Will to finish the email setup.
          </Flash>
        )}
        {resend.configured && !resend.ok && (
          <Flash tone="error">
            Couldn&rsquo;t reach the email service ({resend.error}). The
            connection may be send-only, and reading activity needs full access.
            Ask Will to check the email setup.
          </Flash>
        )}
        {resend.ok && resend.emails.length === 0 && (
          <div className="rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white px-5 py-8 text-center text-[14px] text-[#6b6459]">
            The email service has no recent emails on record.
          </div>
        )}
        {resend.ok && resend.emails.length > 0 && (
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white">
            <ul className="divide-y divide-[rgba(20,18,16,0.06)]">
              {resend.emails.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-medium text-[#141210]">
                      {e.subject || "(no subject)"}
                    </div>
                    <div className="mt-0.5 break-all text-[12px] text-[#6b6459]">
                      {e.to.join(", ")}
                      {e.from ? ` · from ${e.from}` : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[12px] text-[#8a8278]">
                      {formatDate(e.created_at)}
                    </span>
                    <Badge tone={eventTone(e.last_event)}>
                      {e.last_event ?? "unknown"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* COMPOSE LOG — local, grouped by send, with per-recipient results */}
      <section className="space-y-4">
        <div>
          <h2 className="font-sans text-[18px] font-semibold tracking-[-0.01em] text-[#141210]">
            Compose log
          </h2>
          <p className="mt-1 max-w-[70ch] text-[13px] leading-[1.6] text-[#6b6459]">
            Messages sent from Compose, grouped by send, with the exact
            recipients and per-recipient result. The most recent 200 compose
            sends, recorded from now on.
          </p>
        </div>

      {error && (
        <Flash tone="error">
          Send history is not set up yet. Ask Will to finish the email setup.
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
                  <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] text-[#6b6459]">
                    <span>{formatDate(b.created_at)}</span>
                    {b.sent_by && (
                      <>
                        <span aria-hidden>·</span>
                        <span>by</span>
                        <SenderChip email={b.sent_by} />
                      </>
                    )}
                    {b.from_email && <span>· from {b.from_email}</span>}
                    {b.cc && <span>· cc {b.cc}</span>}
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
      </section>
    </div>
  );
}
