/**
 * Newsletter send pipeline. Shared by the admin "Send now" action and the
 * cron. Uses the service client (no admin session in a cron), renders once
 * with a per-recipient unsubscribe placeholder, sends each subscriber their
 * own email, logs every recipient to email_sends, and records counts on the
 * newsletter row.
 *
 * Unlike the transactional form emails, this must NOT swallow errors: there is
 * no form submit to protect, and the admin needs to see what happened.
 */
import { randomUUID } from "node:crypto";
import {
  getResendFrom,
  sendBulkEmailPersonalized,
  type BulkMessage,
} from "@/lib/email-notify";
import { CONTACT_EMAIL, SITE } from "@/lib/email-templates";
import {
  getAudienceCount,
  mailchimpConfigured,
  sendCampaign,
} from "@/lib/mailchimp";
import { renderNewsletter } from "@/lib/newsletter-render";
import { getAdminSupabase } from "@/lib/supabase-admin";

const UNSUB_PLACEHOLDER = "%%UNSUB_URL%%";

export type SendOutcome = { sent: number; failed: number } | { error: string };

/** Milliseconds a newsletter may sit in "sending" before we treat it as stuck
 *  (a crashed or timed-out run) and return it to "scheduled" for a retry. */
const STALE_SENDING_MS = 15 * 60 * 1000;

/**
 * Recover newsletters stuck in "sending": if a run crashed or timed out after
 * claiming a newsletter but before finalising it, the row stays "sending" and
 * would never be picked up again. Flip any such row older than the stale window
 * back to "scheduled" so the next cron pass can retry it. Returns how many were
 * recovered.
 */
export async function recoverStaleSending(): Promise<number> {
  const supabase = getAdminSupabase();
  const cutoff = new Date(Date.now() - STALE_SENDING_MS).toISOString();
  const { data, error } = await supabase
    .from("newsletters")
    .update({ status: "scheduled" })
    .eq("status", "sending")
    .lt("updated_at", cutoff)
    .select("id");
  if (error) {
    console.error("[newsletter] stale sending recovery failed", error);
    return 0;
  }
  return data?.length ?? 0;
}

export async function sendNewsletter(newsletterId: string): Promise<SendOutcome> {
  const supabase = getAdminSupabase();

  // 1. Claim: flip scheduled/draft -> sending in one atomic update. Zero rows
  //    means an overlapping run already claimed it, so bail without sending.
  const { data: claimed, error: claimErr } = await supabase
    .from("newsletters")
    .update({ status: "sending", updated_at: new Date().toISOString() })
    .eq("id", newsletterId)
    .in("status", ["scheduled", "draft"])
    .select("*")
    .single();

  if (claimErr || !claimed) {
    return { error: "newsletter could not be claimed (already sending or missing)" };
  }

  try {
    // Preferred path: send as a Mailchimp campaign to the whole audience.
    // Mailchimp's plan allows high-volume marketing sends, so the newsletter
    // goes through it; Resend stays for low-volume transactional email. The
    // per-recipient Resend path below remains the fallback when Mailchimp
    // env vars are not set.
    if (mailchimpConfigured()) {
      return await sendViaMailchimp(supabase, claimed);
    }

    // 2. Recipients: active subscribers only.
    const { data: subs, error: subErr } = await supabase
      .from("subscribers")
      .select("email, unsubscribe_token")
      .is("unsubscribed_at", null);
    if (subErr) throw new Error(subErr.message);

    const recipients = (subs ?? []).filter(
      (s) => s.email && s.unsubscribe_token,
    );

    const from: string = claimed.from_address || getResendFrom();

    // 3. Render once with the placeholder, substitute per recipient below.
    const { html, text } = await renderNewsletter(
      {
        subject: claimed.subject,
        preheader: claimed.preheader,
        blocks: claimed.blocks,
      },
      { unsubscribeUrl: UNSUB_PLACEHOLDER, sendDate: new Date() },
    );

    // Empty list: mark sent with zero counts, nothing to dispatch.
    if (recipients.length === 0) {
      await supabase
        .from("newsletters")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          sent_count: 0,
          failed_count: 0,
        })
        .eq("id", newsletterId);
      return { sent: 0, failed: 0 };
    }

    const messages: BulkMessage[] = recipients.map((s) => {
      const unsubUrl = `${SITE}/unsubscribe?token=${s.unsubscribe_token}`;
      return {
        to: s.email as string,
        from,
        subject: claimed.subject,
        html: html.split(UNSUB_PLACEHOLDER).join(unsubUrl),
        text: text.split(UNSUB_PLACEHOLDER).join(unsubUrl),
        headers: {
          "List-Unsubscribe": `<${unsubUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };
    });

    // 4. Send. Past this point some mail may have gone out, so we never revert
    //    to scheduled: a partial send is finalised as sent with its counts.
    const results = await sendBulkEmailPersonalized(messages);
    const sent = results.filter((r) => r.ok).length;
    const failed = results.length - sent;
    const batchId = randomUUID();

    // 5. Log per recipient (best-effort).
    try {
      await supabase.from("email_sends").insert(
        results.map((r) => ({
          batch_id: batchId,
          from_email: from,
          to_email: r.to,
          cc: null,
          subject: claimed.subject,
          body: text,
          status: r.ok ? "sent" : "failed",
          error: r.error ?? null,
          resend_id: r.id ?? null,
        })),
      );
    } catch (err) {
      console.error("[newsletter] failed to record send history", err);
    }

    // 6. Finalise.
    await supabase
      .from("newsletters")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        sent_count: sent,
        failed_count: failed,
        send_batch_id: batchId,
      })
      .eq("id", newsletterId);

    return { sent, failed };
  } catch (err) {
    // We only reach here before any send call (render/recipient lookup failed),
    // so nothing was dispatched: revert to scheduled so it can be retried.
    await supabase
      .from("newsletters")
      .update({ status: "scheduled" })
      .eq("id", newsletterId);
    return { error: String(err).slice(0, 500) };
  }
}

/** Parse `Name <email@host>` into its parts; falls back to the whole string. */
function parseFromAddress(s: string): { name: string; email: string } {
  const m = /^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/.exec(s);
  if (m) return { name: m[1] || "TEDxNewy", email: m[2] };
  return { name: "TEDxNewy", email: s.trim() || CONTACT_EMAIL };
}

/**
 * Send the claimed newsletter as one Mailchimp campaign. Mailchimp owns the
 * per-recipient delivery and the unsubscribe handling (the *|UNSUB|* merge tag
 * in the footer becomes each recipient's personal link). Throwing here is safe:
 * the campaign send has not been accepted yet, so the caller's catch reverts
 * the newsletter to scheduled.
 */
async function sendViaMailchimp(
  supabase: ReturnType<typeof getAdminSupabase>,
  claimed: {
    id: string;
    title: string | null;
    subject: string;
    preheader: string;
    from_address: string | null;
    blocks: unknown;
  },
): Promise<SendOutcome> {
  const { html, text } = await renderNewsletter(
    {
      subject: claimed.subject,
      preheader: claimed.preheader,
      blocks: claimed.blocks,
    },
    {
      unsubscribeUrl: "*|UNSUB|*",
      sendDate: new Date(),
      addressLine: "*|LIST:ADDRESS|*",
    },
  );

  const { name: fromName } = parseFromAddress(
    claimed.from_address || getResendFrom(),
  );

  const campaignId = await sendCampaign({
    title: claimed.title || "TEDxNewy newsletter",
    subject: claimed.subject,
    preheader: claimed.preheader,
    fromName,
    replyTo: CONTACT_EMAIL,
    html,
    plainText: text,
  });

  // Mailchimp accepted the send. Past this point never revert to scheduled.
  const audienceCount = await getAudienceCount();
  const batchId = randomUUID();

  // One history row for the whole campaign; the campaign id goes in resend_id
  // so it is traceable back to Mailchimp without a schema change.
  try {
    await supabase.from("email_sends").insert({
      batch_id: batchId,
      from_email: claimed.from_address || getResendFrom(),
      // When the count is unknown, say "mailchimp audience" plainly rather
      // than a misleading "(0 contacts)".
      to_email:
        audienceCount == null
          ? "mailchimp audience"
          : `mailchimp audience (${audienceCount} contacts)`,
      cc: null,
      subject: claimed.subject,
      body: text,
      status: "sent",
      error: null,
      resend_id: campaignId,
    });
  } catch (err) {
    console.error("[newsletter] failed to record mailchimp send", err);
  }

  await supabase
    .from("newsletters")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      // Store null when the audience count is unknown, so the row does not
      // claim zero recipients were sent. The admin list renders (sent_count ?? 0).
      sent_count: audienceCount,
      failed_count: 0,
      send_batch_id: batchId,
    })
    .eq("id", claimed.id);

  return { sent: audienceCount ?? 0, failed: 0 };
}
