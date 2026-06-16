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
