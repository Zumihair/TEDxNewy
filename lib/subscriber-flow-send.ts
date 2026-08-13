/**
 * Subscriber welcome flow send pipeline. Server-only.
 *
 * The model, in one line: an address ENTERS the flow once, then receives
 * every enabled step in order, on each step's delay, and nothing else
 * decides who gets what.
 *
 *  - Entering is `flow_started_at` on the subscriber row (migration
 *    20260814b_flow_enrolment.sql). NULL means never entered. Every path
 *    that creates a genuinely new address enrols it: the public subscribe
 *    route and the Mailchimp webhook. The admin's bulk Mailchimp import
 *    deliberately does not, or the existing list would be enrolled
 *    retrospectively and sent every step at once.
 *  - `startFlowForSubscriber(email)` enrols a new signup and sends the
 *    instant first step straight away, so a welcome still lands the second
 *    someone subscribes rather than up to five minutes later.
 *  - `processFlowDrips()` runs on the newsletter cron and sends every step
 *    that is due, including step 1 for anyone the instant path missed
 *    (a webhook signup, or a welcome whose send failed).
 *
 * Three rules do all the work in processFlowDrips:
 *   1. DUE: now >= flow_started_at + delay_days.
 *   2. IN ORDER: the previous enabled step must already be on record for
 *      this subscriber. So nobody receives step 2 without step 1, and
 *      disabling a step simply takes it out of the sequence.
 *   3. WAS ON WHEN THEY JOINED: flow_started_at >= the step's enabled_at,
 *      the moment it was last switched on. Writing a new step and
 *      switching it on therefore reaches nobody who is already in the
 *      flow; it starts applying to people who join from then on. Switching
 *      a step off and on again restarts that line.
 * There is no grace window and no other gate.
 *
 * Both entry points use the service client (neither the subscribe route
 * nor the cron has an admin session), render with lib/newsletter-render,
 * and send with sendBulkEmailPersonalized. Every send is guarded by a row
 * in subscriber_flow_sends, claimed before dispatch, so a step can never
 * go to the same person twice however the runs overlap.
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

/**
 * Most recipients one step will send to in a single cron pass. Not a rule
 * about who is eligible: whoever is left is simply picked up by the next
 * pass five minutes later. It exists so one enabled step can never try to
 * dispatch thousands of emails inside a single function invocation.
 */
const MAX_PER_STEP_PER_RUN = 200;

type FlowStep = {
  id: string;
  position: number;
  name: string;
  enabled: boolean;
  /** When this step was last switched on. Nobody who entered the flow
   *  before it receives the step. Null (or missing, pre-migration) means
   *  no cutoff. */
  enabled_at: string | null;
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

/** Every subscriber id already on record for a step. */
async function idsSentStep(stepId: string): Promise<Set<string>> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("subscriber_flow_sends")
    .select("subscriber_id")
    .eq("step_id", stepId);
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((r) => r.subscriber_id as string));
}

/**
 * Put an address into the flow if it is not already in it. Idempotent:
 * re-subscribing never restarts the sequence, because the timestamp is
 * only written when it is currently NULL.
 */
export async function enrolInFlow(email: string): Promise<void> {
  const supabase = getAdminSupabase();
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes("@")) return;
  const { error } = await supabase
    .from("subscribers")
    .update({ flow_started_at: new Date().toISOString() })
    .ilike("email", clean)
    .is("flow_started_at", null);
  if (error) console.error("[flow] enrol failed", error.message);
}

/**
 * Enrol a brand-new subscriber and send the instant first step (the
 * lowest-position enabled step, if its delay is zero).
 *
 * Returns true when a welcome was sent or was already on record (nothing
 * more for the caller to do), and false when there is no instant step, so
 * the caller can fall back to the legacy confirmation email. Throws on a
 * hard failure (render or send error) so the caller can fall back there
 * too. Enrolment happens either way: a later step will still reach them,
 * and turning step 1 on later will still send it.
 */
export async function startFlowForSubscriber(email: string): Promise<boolean> {
  const supabase = getAdminSupabase();
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes("@")) {
    throw new Error("invalid subscriber email");
  }

  await enrolInFlow(clean);

  // The instant step: first enabled step in the sequence, and only if it
  // is a zero-delay one. Anything else is left to the cron.
  const { data: steps, error: stepErr } = await supabase
    .from("subscriber_flow_steps")
    .select("*")
    .eq("enabled", true)
    .order("position", { ascending: true })
    .limit(1);
  if (stepErr) throw new Error(stepErr.message);
  const first = (steps ?? [])[0] as FlowStep | undefined;
  if (!first || first.delay_days !== 0) return false;

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

  // Idempotency by claim: try to insert the ledger row first, ignoring a
  // conflict. If nothing comes back, another path already claimed (and sent)
  // this step for this subscriber, so bail quietly without re-sending.
  const { data: claimed, error: claimErr } = await supabase
    .from("subscriber_flow_sends")
    .upsert(
      { subscriber_id: recipient.id, step_id: first.id },
      { onConflict: "subscriber_id,step_id", ignoreDuplicates: true },
    )
    .select("subscriber_id");
  if (claimErr) throw new Error(claimErr.message);
  if (!claimed || claimed.length === 0) return true;

  const from = first.from_address || getResendFrom();
  const url = unsubUrl(recipient.unsubscribe_token);
  const { html, text } = await renderNewsletter(
    { subject: first.subject, preheader: first.preheader, blocks: first.blocks },
    { unsubscribeUrl: url, sendDate: new Date() },
  );

  const message: BulkMessage = {
    to: recipient.email,
    from,
    subject: first.subject,
    html,
    text,
    headers: {
      "List-Unsubscribe": `<${url}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };

  // We already hold the claim row. If the send fails, release it so the cron
  // can retry, then throw so the caller falls back to legacy confirmation.
  let result;
  try {
    [result] = await sendBulkEmailPersonalized([message]);
  } catch (sendErr) {
    await releaseClaims(first.id, [recipient.id]);
    throw sendErr;
  }
  if (!result || !result.ok) {
    await releaseClaims(first.id, [recipient.id]);
    throw new Error(result?.error || "welcome email send failed");
  }

  // Log to email_sends (best effort).
  try {
    await supabase.from("email_sends").insert({
      batch_id: randomUUID(),
      from_email: from,
      to_email: recipient.email,
      cc: null,
      subject: first.subject,
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

async function releaseClaims(stepId: string, subscriberIds: string[]) {
  if (subscriberIds.length === 0) return;
  try {
    await getAdminSupabase()
      .from("subscriber_flow_sends")
      .delete()
      .eq("step_id", stepId)
      .in("subscriber_id", subscriberIds);
  } catch (err) {
    console.error("[flow] failed to release claims", err);
  }
}

export type FlowDripSummary = {
  stepId: string;
  sent: number;
  failed: number;
};

/**
 * Send every step that is due, in sequence order. See the file header for
 * the two rules. Steps with a zero delay are included, so this doubles as
 * the safety net for anyone the instant welcome path missed.
 */
export async function processFlowDrips(): Promise<FlowDripSummary[]> {
  const supabase = getAdminSupabase();

  const { data: stepRows, error: stepsErr } = await supabase
    .from("subscriber_flow_steps")
    .select("*")
    .eq("enabled", true)
    .order("position", { ascending: true });
  if (stepsErr) throw new Error(stepsErr.message);
  const steps = (stepRows ?? []) as FlowStep[];

  const summaries: FlowDripSummary[] = [];
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // Nobody may receive two steps in one pass: getting step 1 in this run
  // must not immediately qualify you for step 2 in the same run.
  const sentThisRun = new Set<string>();
  let previousStepId: string | null = null;

  for (const step of steps) {
    const stepId = step.id;
    const previous = previousStepId;
    previousStepId = stepId;

    const dueBy = new Date(now - step.delay_days * DAY).toISOString();

    // The eligibility window on one column:
    //   step switched on  <=  entered the flow  <=  now minus the delay
    // The lower bound is what stops switching a step on from reaching
    // back to people who joined while it was off.
    let query = supabase
      .from("subscribers")
      .select("id, email, unsubscribe_token")
      .is("unsubscribed_at", null)
      .not("flow_started_at", "is", null)
      .lte("flow_started_at", dueBy);
    if (step.enabled_at) {
      query = query.gte("flow_started_at", step.enabled_at);
    }
    const { data: subs, error: subErr } = await query.order("flow_started_at", {
      ascending: true,
    });
    if (subErr) throw new Error(subErr.message);

    const [already, prevDone] = await Promise.all([
      idsSentStep(stepId),
      previous ? idsSentStep(previous) : Promise.resolve(null),
    ]);

    const candidates = (subs ?? [])
      .filter((x): x is Subscriber => Boolean(x.email && x.unsubscribe_token))
      .filter(
        (s) =>
          !already.has(s.id) &&
          !sentThisRun.has(s.id) &&
          (prevDone === null || prevDone.has(s.id)),
      )
      .slice(0, MAX_PER_STEP_PER_RUN);

    if (candidates.length === 0) {
      summaries.push({ stepId, sent: 0, failed: 0 });
      continue;
    }

    // Claim first: upsert a ledger row for every candidate, ignoring
    // conflicts. Only the rows THIS run inserted come back, so overlapping
    // cron passes never send the same step twice, and one pre-existing row
    // can never abort the whole batch. We send only to the claimed set.
    const { data: claimedRows, error: claimErr } = await supabase
      .from("subscriber_flow_sends")
      .upsert(
        candidates.map((c) => ({ subscriber_id: c.id, step_id: stepId })),
        { onConflict: "subscriber_id,step_id", ignoreDuplicates: true },
      )
      .select("subscriber_id");
    if (claimErr) throw new Error(claimErr.message);

    const claimedIds = new Set(
      (claimedRows ?? []).map((r) => r.subscriber_id as string),
    );
    const recipients = candidates.filter((c) => claimedIds.has(c.id));
    if (recipients.length === 0) {
      summaries.push({ stepId, sent: 0, failed: 0 });
      continue;
    }
    for (const r of recipients) sentThisRun.add(r.id);

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

    // If the whole send throws before any dispatch, release this run's claims
    // so a later pass can retry the step. A per-recipient failure below does
    // NOT release the claim (Resend has its own record, and auto-retrying a
    // dispatched address risks a send loop); we just log it.
    let results;
    try {
      results = await sendBulkEmailPersonalized(messages);
    } catch (sendErr) {
      await releaseClaims(
        stepId,
        recipients.map((r) => r.id),
      );
      for (const r of recipients) sentThisRun.delete(r.id);
      console.error("[flow] drip send threw, released claims", sendErr);
      summaries.push({ stepId, sent: 0, failed: recipients.length });
      continue;
    }

    const byEmail = new Map(results.map((r) => [r.to, r]));
    const sent = results.filter((r) => r.ok).length;
    const failed = results.length - sent;
    const batchId = randomUUID();

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

    summaries.push({ stepId, sent, failed });
  }

  return summaries;
}
