import { getSupabase } from "@/lib/supabase";

/**
 * Email helpers. Two patterns:
 *
 * 1. `sendFormNotification(formSource, payload)` — to admin recipients
 *    configured in the `notification_recipients` table (keyed by form_source).
 *    Falls back to FALLBACK_TO if the table is unreachable or empty.
 *
 * 2. `sendConfirmationEmail(to, payload)` — to a single specific address
 *    (e.g. the school's contact email, to confirm their EOI was received).
 *
 * Both return silently if RESEND_API_KEY is unset (lets local dev work
 * without a Resend account) and swallow their own errors — email failure
 * must not block form submission, since the row is already in Supabase by
 * the time we get here.
 */

const FALLBACK_TO = "hello@tedxnewy.com.au";
const FROM_DEFAULT = "TEDxNewy <onboarding@resend.dev>";

export type NotifyPayload = {
  /** Heading shown at the top of the email. */
  subject: string;
  /** Plain-text body — keep short, readable at a glance. */
  text: string;
  /** Optional HTML body. Defaults to a <pre>-wrapped copy of `text`. */
  html?: string;
};

export async function sendFormNotification(
  formSource: string,
  payload: NotifyPayload,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(
      `[email-notify] RESEND_API_KEY unset — would have sent admin notification "${payload.subject}" for ${formSource}`,
    );
    return;
  }
  const recipients = await getActiveRecipients(formSource);
  await sendViaResend(apiKey, recipients, payload, `notification:${formSource}`);
}

export async function sendConfirmationEmail(
  to: string,
  payload: NotifyPayload,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(
      `[email-notify] RESEND_API_KEY unset — would have sent confirmation "${payload.subject}" to ${to}`,
    );
    return;
  }
  if (!to || !to.includes("@")) {
    console.warn(`[email-notify] invalid confirmation recipient: ${to}`);
    return;
  }
  await sendViaResend(apiKey, [to], payload, `confirmation:${to}`);
}

async function sendViaResend(
  apiKey: string,
  to: string[],
  payload: NotifyPayload,
  tag: string,
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
        subject: payload.subject,
        text: payload.text,
        html,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "<no body>");
      console.error(
        `[email-notify] Resend ${res.status} for ${tag}: ${errBody}`,
      );
    }
  } catch (err) {
    console.error(`[email-notify] fetch failed for ${tag}`, err);
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
    console.error(`[email-notify] recipient lookup failed for ${formSource}`, err);
    return [FALLBACK_TO];
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
