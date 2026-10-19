/**
 * Retry queue for transactional email (form notifications, confirmations).
 *
 * Resend's free plan stops accepting mail once the daily limit is used (HTTP
 * 429, resets at midnight UTC). Rather than lose a form notification on a busy
 * day, lib/email-notify.ts parks the refused email here, and the 5-minute cron
 * calls processEmailOutbox() to send it as soon as Resend accepts mail again.
 *
 * Needs supabase/migrations/20261020b_email_outbox.sql. Without that table
 * everything here is a quiet no-op, so the site behaves exactly as before.
 */

export type OutboxEmail = {
  to: string[];
  cc?: string[];
  from: string;
  subject: string;
  text: string;
  html: string;
  tag: string;
};

/** Park an email Resend refused. Never throws: the caller is already handling a failure. */
export async function enqueueEmail(email: OutboxEmail, reason: string): Promise<void> {
  try {
    const { getAdminSupabase } = await import("@/lib/supabase-admin");
    const { error } = await getAdminSupabase()
      .from("email_outbox")
      .insert({
        tag: email.tag,
        from_email: email.from,
        to_emails: email.to,
        cc_emails: email.cc && email.cc.length ? email.cc : null,
        subject: email.subject,
        text_body: email.text,
        html_body: email.html,
        last_error: reason.slice(0, 500),
      });
    if (error) {
      console.error(`[outbox] could not queue ${email.tag}: ${error.message}`);
    } else {
      console.info(`[outbox] queued ${email.tag} for retry`);
    }
  } catch (err) {
    console.error(`[outbox] could not queue ${email.tag}`, err);
  }
}

/** Give up on an email after this many non-quota failures. */
const MAX_ATTEMPTS = 5;
/** Most emails one cron pass sends. */
const BATCH = 50;

export type OutboxRun = { sent: number; failed: number; waiting: boolean; error?: string };

/**
 * Send queued emails, oldest first. Stops at the first 429 (the quota is still
 * used up), leaving the rest queued for the next pass. Each send carries an
 * idempotency key, so a crash between sending and recording it cannot
 * double-send.
 */
export async function processEmailOutbox(): Promise<OutboxRun> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: 0, failed: 0, waiting: false };

  const { getAdminSupabase } = await import("@/lib/supabase-admin");
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("email_outbox")
    .select("id, from_email, to_emails, cc_emails, subject, text_body, html_body, attempts")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(BATCH);
  if (error) {
    // Table not created yet (migration not applied) or a transient error.
    return { sent: 0, failed: 0, waiting: false, error: error.message.slice(0, 200) };
  }

  let sent = 0;
  let failed = 0;
  let waiting = false;
  for (const row of data ?? []) {
    let status = 0;
    let detail = "";
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `outbox-${row.id}`,
        },
        body: JSON.stringify({
          from: row.from_email,
          to: row.to_emails,
          ...(row.cc_emails ? { cc: row.cc_emails } : {}),
          subject: row.subject,
          text: row.text_body ?? "",
          html: row.html_body ?? undefined,
        }),
      });
      status = res.status;
      if (!res.ok) detail = (await res.text().catch(() => "")).slice(0, 300);
    } catch (err) {
      status = 0;
      detail = String(err).slice(0, 300);
    }

    if (status >= 200 && status < 300) {
      await supabase
        .from("email_outbox")
        .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null })
        .eq("id", row.id);
      sent++;
    } else if (status === 429) {
      // Still over the limit: leave this and everything behind it queued.
      await supabase.from("email_outbox").update({ last_error: `429: ${detail}` }).eq("id", row.id);
      waiting = true;
      break;
    } else {
      const attempts = (row.attempts as number) + 1;
      await supabase
        .from("email_outbox")
        .update({
          attempts,
          status: attempts >= MAX_ATTEMPTS ? "dead" : "pending",
          last_error: `${status}: ${detail}`,
        })
        .eq("id", row.id);
      failed++;
    }
    // Stay well under Resend's 10 requests a second.
    await new Promise((r) => setTimeout(r, 150));
  }
  return { sent, failed, waiting };
}
