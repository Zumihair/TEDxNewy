/**
 * Subscriber welcome flow send pipeline. Server-only. Two entry points:
 *
 *  - sendFlowStepToNewSubscriber(email): the instant step 1, called from the
 *    public subscribe route. Replaces the old hardcoded confirmation email.
 *  - processFlowDrips(): the delayed steps, called from the newsletter cron.
 *
 * Both use the service client (the subscribe route and the cron have no admin
 * session), render with lib/newsletter-render, and send with
 * sendBulkEmailPersonalized. Every send is guarded by a row in
 * subscriber_flow_sends so a step can never go to the same person twice.
 *
 * Do not import this from a client component.
 */
import { randomUUID } from "node:crypto";
import {
  getResendFrom,
  sendBulkEmailPersonalized,
  type BulkMessage,
} from "@/lib/email-notify";
import { SITE } from "@/lib/email-templates";
import { renderNewsletter } from "@/lib/newsletter-render";
import { getAdminSupabase } from "@/lib/supabase-admin";

const UNSUB_PLACEHOLDER = "%%UNSUB_URL%%";

/** Grace window (days) so launching the flow does not blast the whole existing
 *  base. Only subscribers who crossed a step's delay within this many days of
 *  now are eligible, so anyone who signed up long before launch is skipped. */
const GRACE_DAYS = 3;

type FlowStep = {
  id: string;
  position: number;
  name: string;
  enabled: boolean;
  delay_days: number;
  subject: string;
  preheader: string;
  from_address: string;
  blocks: unknown;
};

type Subscriber = {
  id: string;
  email: string;
  unsubscribe_token: string;
};

function unsubUrl(token: string): string {
  return `${SITE}/unsubscribe?token=${token}`;
}

/**
 * Send the instant welcome (step at position 1, enabled, delay 0) to a
 * just-created subscriber, located by email.
 *
 * Returns true when the welcome was sent or was already on record (nothing more
 * for the caller to do), and false when there is no active welcome step, so the
 * caller can fall back to the legacy confirmation email. Throws on a hard
 * failure (render or send error) so the caller can fall back there too.
 */
export async function sendFlowStepToNewSubscriber(
  email: string,
): Promise<boolean> {
  const supabase = getAdminSupabase();
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes("@")) {
    throw new Error("invalid subscriber email");
  }

  // The welcome step: position 1, enabled, instant. If it is missing or off,
  // do nothing and let the caller send the legacy confirmation.
  const { data: step, error: stepErr } = await supabase
    .from("subscriber_flow_steps")
    .select("*")
    .eq("position", 1)
    .eq("enabled", true)
    .eq("delay_days", 0)
    .maybeSingle();
  if (stepErr) throw new Error(stepErr.message);
  if (!step) return false;
  const s = step as FlowStep;

  const { data: sub, error: subErr } = await supabase
    .from("subscribers")
    .select("id, email, unsubscribe_token")
    .ilike("email", clean)
    .limit(1)
    .maybeSingle();
  if (subErr) throw new Error(subErr.message);
  if (!sub || !sub.unsubscribe_token) {
    throw new Error("subscriber not found or missing unsubscribe token");
  }
  const recipient = sub as Subscriber;

  // Idempotency: bail quietly if this step already went to this subscriber.
  const { data: already } = await supabase
    .from("subscriber_flow_sends")
    .select("id")
    .eq("subscriber_id", recipient.id)
    .eq("step_id", s.id)
    .limit(1)
    .maybeSingle();
  if (already) return true;

  const from = s.from_address || getResendFrom();
  const url = unsubUrl(recipient.unsubscribe_token);
  const { html, text } = await renderNewsletter(
    { subject: s.subject, preheader: s.preheader, blocks: s.blocks },
    { unsubscribeUrl: url, sendDate: new Date() },
  );

  const message: BulkMessage = {
    to: recipient.email,
    from,
    subject: s.subject,
    html,
    text,
    headers: {
      "List-Unsubscribe": `<${url}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };

  const [result] = await sendBulkEmailPersonalized([message]);
  if (!result || !result.ok) {
    throw new Error(result?.error || "welcome email send failed");
  }

  // Record the send so it never repeats.
  await supabase
    .from("subscriber_flow_sends")
    .insert({ subscriber_id: recipient.id, step_id: s.id });

  // Log to email_sends (best effort).
  try {
    await supabase.from("email_sends").insert({
      batch_id: randomUUID(),
      from_email: from,
      to_email: recipient.email,
      cc: null,
      subject: s.subject,
      body: text,
      status: "sent",
      error: null,
      resend_id: result.id ?? null,
    });
  } catch (err) {
    console.error("[flow] failed to log welcome send", err);
  }

  return true;
}

export type FlowDripSummary = {
  stepId: string;
  sent: number;
  failed: number;
};

/**
 * Process every delayed step (enabled, delay_days > 0). For each, find
 * subscribers who crossed the delay within the grace window, are still
 * subscribed, and have no send row for the step yet, then send them the step.
 * Rendered once per step with a per-recipient unsubscribe placeholder.
 */
export async function processFlowDrips(): Promise<FlowDripSummary[]> {
  const supabase = getAdminSupabase();

  const { data: steps, error: stepsErr } = await supabase
    .from("subscriber_flow_steps")
    .select("*")
    .eq("enabled", true)
    .gt("delay_days", 0)
    .order("position", { ascending: true });
  if (stepsErr) throw new Error(stepsErr.message);

  const summaries: FlowDripSummary[] = [];
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  for (const raw of steps ?? []) {
    const step = raw as FlowStep;

    // The window: created on or before (now - delay) and after
    // (now - delay - grace). So only people who just crossed the delay line.
    const cutoffLatest = new Date(now - step.delay_days * DAY).toISOString();
    const cutoffEarliest = new Date(
      now - (step.delay_days + GRACE_DAYS) * DAY,
    ).toISOString();

    const { data: subs, error: subErr } = await supabase
      .from("subscribers")
      .select("id, email, unsubscribe_token")
      .is("unsubscribed_at", null)
      .lte("created_at", cutoffLatest)
      .gt("created_at", cutoffEarliest);
    if (subErr) throw new Error(subErr.message);

    const candidates = (subs ?? []).filter(
      (x): x is Subscriber => Boolean(x.email && x.unsubscribe_token),
    );
    if (candidates.length === 0) {
      summaries.push({ stepId: step.id, sent: 0, failed: 0 });
      continue;
    }

    // Filter out anyone who already has this step.
    const { data: existing } = await supabase
      .from("subscriber_flow_sends")
      .select("subscriber_id")
      .eq("step_id", step.id)
      .in(
        "subscriber_id",
        candidates.map((c) => c.id),
      );
    const done = new Set((existing ?? []).map((r) => r.subscriber_id as string));
    const recipients = candidates.filter((c) => !done.has(c.id));
    if (recipients.length === 0) {
      summaries.push({ stepId: step.id, sent: 0, failed: 0 });
      continue;
    }

    const from = step.from_address || getResendFrom();
    const { html, text } = await renderNewsletter(
      { subject: step.subject, preheader: step.preheader, blocks: step.blocks },
      { unsubscribeUrl: UNSUB_PLACEHOLDER, sendDate: new Date() },
    );

    const messages: BulkMessage[] = recipients.map((r) => {
      const url = unsubUrl(r.unsubscribe_token);
      return {
        to: r.email,
        from,
        subject: step.subject,
        html: html.split(UNSUB_PLACEHOLDER).join(url),
        text: text.split(UNSUB_PLACEHOLDER).join(url),
        headers: {
          "List-Unsubscribe": `<${url}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };
    });

    const results = await sendBulkEmailPersonalized(messages);
    const byEmail = new Map(results.map((r) => [r.to, r]));
    const sent = results.filter((r) => r.ok).length;
    const failed = results.length - sent;
    const batchId = randomUUID();

    // Ledger rows for every recipient we attempted, ok or not, so a failed
    // address is not retried on the next pass (Resend has its own record).
    try {
      await supabase.from("subscriber_flow_sends").insert(
        recipients.map((r) => ({
          subscriber_id: r.id,
          step_id: step.id,
        })),
      );
    } catch (err) {
      console.error("[flow] failed to record drip ledger rows", err);
    }

    // History log (best effort).
    try {
      await supabase.from("email_sends").insert(
        recipients.map((r) => {
          const res = byEmail.get(r.email);
          return {
            batch_id: batchId,
            from_email: from,
            to_email: r.email,
            cc: null,
            subject: step.subject,
            body: text,
            status: res?.ok ? "sent" : "failed",
            error: res?.error ?? null,
            resend_id: res?.id ?? null,
          };
        }),
      );
    } catch (err) {
      console.error("[flow] failed to log drip sends", err);
    }

    summaries.push({ stepId: step.id, sent, failed });
  }

  return summaries;
}
