import { getSupabase } from "@/lib/supabase";

/**
 * Form submission notifier — fans out to whichever channels are configured
 * in env. Designed so we can ship instant notifications today (via a free
 * webhook channel like ntfy / Slack / Discord) and add Resend email later
 * without changing any route code.
 *
 * Channels (any combination — they all fire if configured):
 *   - NTFY_TOPIC                 — push notification to phone via ntfy.sh
 *   - SLACK_WEBHOOK_URL          — incoming webhook for a Slack channel
 *   - DISCORD_WEBHOOK_URL        — incoming webhook for a Discord channel
 *   - RESEND_API_KEY (+RESEND_FROM)
 *                                — proper email via Resend
 *
 * Exports:
 *
 * 1. `sendFormNotification(formSource, payload)` — to the admin team.
 *    Webhook channels always go to the same destination. Resend uses the
 *    `notification_recipients` table (keyed by form_source) and falls
 *    back to FALLBACK_TO if the table is unreachable or empty.
 *
 * 2. `sendConfirmationEmail(to, payload)` — to a single specific address
 *    (e.g. the school's contact email). Email-only; webhook channels are
 *    skipped since these go to the submitter, not us.
 *
 * Both swallow their own errors — email failure must not block form
 * submission, since the row is already in Supabase by the time we get here.
 */

const FALLBACK_TO = "hello@tedxnewy.com.au";
const FROM_DEFAULT = "TEDxNewy <onboarding@resend.dev>";

export type NotifyPayload = {
  /** Heading shown at the top of the email / push notification. */
  subject: string;
  /** Plain-text body — keep short, readable at a glance. */
  text: string;
  /** Optional HTML body. Defaults to a <pre>-wrapped copy of `text`. */
  html?: string;
  /** Optional URL to deep-link from the notification (e.g. /admin/...). */
  url?: string;
};

export async function sendFormNotification(
  formSource: string,
  payload: NotifyPayload,
): Promise<void> {
  // Fire every configured webhook channel + Resend in parallel.
  await Promise.allSettled([
    sendNtfy(payload, formSource),
    sendSlack(payload, formSource),
    sendDiscord(payload, formSource),
    sendResendNotification(formSource, payload),
  ]);
}

export async function sendConfirmationEmail(
  to: string,
  payload: NotifyPayload,
  cc?: string[],
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(
      `[notify] RESEND_API_KEY unset — would have sent confirmation "${payload.subject}" to ${to}`,
    );
    return;
  }
  if (!to || !to.includes("@")) {
    console.warn(`[notify] invalid confirmation recipient: ${to}`);
    return;
  }
  await sendViaResend(apiKey, [to], payload, `confirmation:${to}`, cc);
}

/** The effective From address emails send from (for display + the send log). */
export function getResendFrom(): string {
  return process.env.RESEND_FROM ?? FROM_DEFAULT;
}

/**
 * From addresses offered in the newsletter send-as dropdown. Kept simple: use
 * whatever the site already sends transactional email as. Add more verified
 * tedxnewy.com.au senders to this list if they get set up in Resend.
 */
export function newsletterFromOptions(): string[] {
  return Array.from(new Set([getResendFrom()]));
}

export type SendResult = {
  to: string;
  /** True if Resend accepted the message (not proof of inbox delivery). */
  ok: boolean;
  /** Resend's message id, when accepted. */
  id?: string | null;
  /** Failure reason, when rejected. */
  error?: string | null;
};

/**
 * Send the same message to many recipients, each as its own email (so they
 * never see one another), and report the outcome per recipient.
 *
 * Uses Resend's batch endpoint (up to 100 messages per request), which sends
 * the whole group in a single API call. That sidesteps the per-request rate
 * limit (2/sec) that was silently dropping the old back-to-back single sends.
 * If a batch is rejected as a unit (e.g. one malformed address), we fall back
 * to per-recipient sends, paced under the limit, so one bad address can't
 * sink the rest of the group.
 */
export async function sendBulkEmail(
  recipients: string[],
  payload: NotifyPayload,
  cc?: string[],
): Promise<SendResult[]> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return recipients.map((to) => ({
      to,
      ok: false,
      error: "RESEND_API_KEY is not set",
    }));
  }
  const from = getResendFrom();
  const html = payload.html ?? defaultHtml(payload.text);
  const ccArr = cc && cc.length ? cc : undefined;

  const results: SendResult[] = [];
  const CHUNK = 100; // Resend batch limit.
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const chunk = recipients.slice(i, i + CHUNK);
    const batchBody = chunk.map((to) => ({
      from,
      to: [to],
      ...(ccArr ? { cc: ccArr } : {}),
      subject: payload.subject,
      text: payload.text,
      html,
    }));
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batchBody),
      });
      if (res.ok) {
        const json = (await res.json().catch(() => null)) as {
          data?: { id?: string }[];
        } | null;
        const data = Array.isArray(json?.data) ? json.data : [];
        chunk.forEach((to, idx) =>
          results.push({ to, ok: true, id: data[idx]?.id ?? null }),
        );
      } else {
        const errText = await res.text().catch(() => "");
        console.error(`[notify] resend batch ${res.status}: ${errText}`);
        results.push(
          ...(await sendChunkIndividually(apiKey, from, chunk, payload, html, ccArr)),
        );
      }
    } catch (err) {
      console.error("[notify] resend batch fetch failed", err);
      results.push(
        ...(await sendChunkIndividually(apiKey, from, chunk, payload, html, ccArr)),
      );
    }
  }
  return results;
}

/** Fallback: one request per recipient, paced under Resend's 2/sec limit. */
async function sendChunkIndividually(
  apiKey: string,
  from: string,
  recipients: string[],
  payload: NotifyPayload,
  html: string,
  cc?: string[],
): Promise<SendResult[]> {
  const results: SendResult[] = [];
  for (let i = 0; i < recipients.length; i++) {
    const to = recipients[i];
    if (i > 0) await new Promise((r) => setTimeout(r, 600));
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          ...(cc ? { cc } : {}),
          subject: payload.subject,
          text: payload.text,
          html,
        }),
      });
      if (res.ok) {
        const json = (await res.json().catch(() => null)) as {
          id?: string;
        } | null;
        results.push({ to, ok: true, id: json?.id ?? null });
      } else {
        const errText = await res.text().catch(() => "");
        results.push({
          to,
          ok: false,
          error: `${res.status}: ${errText}`.slice(0, 500),
        });
      }
    } catch (err) {
      results.push({ to, ok: false, error: String(err).slice(0, 500) });
    }
  }
  return results;
}

/**
 * A fully-formed message for one recipient. Unlike sendBulkEmail (same body to
 * everyone), each message here carries its own subject/html/text/from/headers,
 * so the newsletter can substitute a per-recipient unsubscribe link and set a
 * List-Unsubscribe header.
 */
export type BulkMessage = {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

/**
 * Send an array of individually-addressed messages, each as its own email.
 * Uses Resend's batch endpoint (100 per request) and falls back to paced
 * per-message sends if a batch is rejected as a unit. Reports per recipient.
 */
export async function sendBulkEmailPersonalized(
  messages: BulkMessage[],
): Promise<SendResult[]> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return messages.map((m) => ({
      to: m.to,
      ok: false,
      error: "RESEND_API_KEY is not set",
    }));
  }

  const results: SendResult[] = [];
  const CHUNK = 100; // Resend batch limit.
  for (let i = 0; i < messages.length; i += CHUNK) {
    const chunk = messages.slice(i, i + CHUNK);
    const batchBody = chunk.map((m) => ({
      from: m.from,
      to: [m.to],
      subject: m.subject,
      text: m.text,
      html: m.html,
      ...(m.headers ? { headers: m.headers } : {}),
    }));
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batchBody),
      });
      if (res.ok) {
        const json = (await res.json().catch(() => null)) as {
          data?: { id?: string }[];
        } | null;
        const data = Array.isArray(json?.data) ? json.data : [];
        chunk.forEach((m, idx) =>
          results.push({ to: m.to, ok: true, id: data[idx]?.id ?? null }),
        );
      } else {
        const errText = await res.text().catch(() => "");
        console.error(`[notify] resend batch ${res.status}: ${errText}`);
        results.push(...(await sendMessagesIndividually(apiKey, chunk)));
      }
    } catch (err) {
      console.error("[notify] resend batch fetch failed", err);
      results.push(...(await sendMessagesIndividually(apiKey, chunk)));
    }
  }
  return results;
}

/** Fallback for personalized sends: one request per message, paced under 2/sec. */
async function sendMessagesIndividually(
  apiKey: string,
  messages: BulkMessage[],
): Promise<SendResult[]> {
  const results: SendResult[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (i > 0) await new Promise((r) => setTimeout(r, 600));
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: m.from,
          to: [m.to],
          subject: m.subject,
          text: m.text,
          html: m.html,
          ...(m.headers ? { headers: m.headers } : {}),
        }),
      });
      if (res.ok) {
        const json = (await res.json().catch(() => null)) as {
          id?: string;
        } | null;
        results.push({ to: m.to, ok: true, id: json?.id ?? null });
      } else {
        const errText = await res.text().catch(() => "");
        results.push({
          to: m.to,
          ok: false,
          error: `${res.status}: ${errText}`.slice(0, 500),
        });
      }
    } catch (err) {
      results.push({ to: m.to, ok: false, error: String(err).slice(0, 500) });
    }
  }
  return results;
}

function defaultHtml(text: string): string {
  return `<pre style="font-family:ui-monospace,Menlo,monospace;font-size:13px;line-height:1.55;white-space:pre-wrap">${escapeHtml(
    text,
  )}</pre>`;
}

// ============================================================
// Channel: ntfy.sh — free push notifications, no account needed
// ============================================================
async function sendNtfy(
  payload: NotifyPayload,
  formSource: string,
): Promise<void> {
  const topic = process.env.NTFY_TOPIC?.trim();
  if (!topic) return;
  const server = (process.env.NTFY_SERVER ?? "https://ntfy.sh").replace(/\/+$/, "");
  try {
    const headers: Record<string, string> = {
      "Content-Type": "text/plain; charset=utf-8",
      Title: payload.subject,
      Tags: `bell,tedxnewy,${formSource}`,
      Priority: "default",
    };
    if (payload.url) {
      headers.Click = payload.url;
      headers.Actions = `view, Open admin, ${payload.url}, clear=true`;
    }
    const res = await fetch(`${server}/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers,
      body: payload.text,
    });
    if (!res.ok) {
      console.error(`[notify] ntfy ${res.status} for ${formSource}`);
    }
  } catch (err) {
    console.error(`[notify] ntfy failed for ${formSource}`, err);
  }
}

// ============================================================
// Channel: Slack incoming webhook
// ============================================================
async function sendSlack(
  payload: NotifyPayload,
  formSource: string,
): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!url) return;
  try {
    const text = payload.url
      ? `*${payload.subject}*\n${payload.text}\n<${payload.url}|Open in admin →>`
      : `*${payload.subject}*\n${payload.text}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      console.error(`[notify] slack ${res.status} for ${formSource}`);
    }
  } catch (err) {
    console.error(`[notify] slack failed for ${formSource}`, err);
  }
}

// ============================================================
// Channel: Discord incoming webhook
// ============================================================
async function sendDiscord(
  payload: NotifyPayload,
  formSource: string,
): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!url) return;
  try {
    const content = payload.url
      ? `**${payload.subject}**\n${payload.text}\n${payload.url}`
      : `**${payload.subject}**\n${payload.text}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "TEDxNewy", content }),
    });
    if (!res.ok) {
      console.error(`[notify] discord ${res.status} for ${formSource}`);
    }
  } catch (err) {
    console.error(`[notify] discord failed for ${formSource}`, err);
  }
}

// ============================================================
// Channel: Resend (email)
// ============================================================
async function sendResendNotification(
  formSource: string,
  payload: NotifyPayload,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (!hasAnyWebhook()) {
      // Only log the "nothing configured" warning when there's truly nothing
      // configured. Otherwise we're using webhooks deliberately.
      console.info(
        `[notify] no channels configured — would have sent "${payload.subject}" for ${formSource}`,
      );
    }
    return;
  }
  const recipients = await getActiveRecipients(formSource);
  await sendViaResend(apiKey, recipients, payload, `notification:${formSource}`);
}

function hasAnyWebhook(): boolean {
  return Boolean(
    process.env.NTFY_TOPIC ||
      process.env.SLACK_WEBHOOK_URL ||
      process.env.DISCORD_WEBHOOK_URL,
  );
}

async function sendViaResend(
  apiKey: string,
  to: string[],
  payload: NotifyPayload,
  tag: string,
  cc?: string[],
): Promise<void> {
  const html =
    payload.html ??
    `<pre style="font-family:ui-monospace,Menlo,monospace;font-size:13px;line-height:1.55;white-space:pre-wrap">${escapeHtml(payload.text)}</pre>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? FROM_DEFAULT,
        to,
        ...(cc && cc.length ? { cc } : {}),
        subject: payload.subject,
        text: payload.text,
        html,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "<no body>");
      console.error(`[notify] resend ${res.status} for ${tag}: ${errBody}`);
    }
  } catch (err) {
    console.error(`[notify] resend fetch failed for ${tag}`, err);
  }
}

async function getActiveRecipients(formSource: string): Promise<string[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("notification_recipients")
      .select("email")
      .eq("form_source", formSource)
      .eq("active", true);
    if (error || !data || data.length === 0) {
      return [FALLBACK_TO];
    }
    return data.map((r) => r.email as string);
  } catch (err) {
    console.error(`[notify] recipient lookup failed for ${formSource}`, err);
    return [FALLBACK_TO];
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
