/**
 * Minimal Slack Incoming Webhook sender, for the "a social post went out"
 * notice (lib/social-slack.ts).
 *
 * Contract: never throws and never hangs. Slack being down, slow, or the URL
 * being wrong must not be able to affect anything that called this, so every
 * failure is swallowed into a boolean result and a log line that does NOT
 * include the webhook URL (the URL is the secret).
 *
 * A no-op when SLACK_SOCIAL_WEBHOOK_URL is unset, so the feature does
 * nothing until it is configured.
 */
import "server-only";

const TIMEOUT_MS = 5000;

export function slackSocialConfigured(): boolean {
  return Boolean(process.env.SLACK_SOCIAL_WEBHOOK_URL);
}

/** Posts `text` (Slack mrkdwn) to the configured webhook. Returns true only
 *  when Slack answered 2xx. */
export async function sendSlackSocial(text: string): Promise<boolean> {
  const url = process.env.SLACK_SOCIAL_WEBHOOK_URL;
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, unfurl_links: false, unfurl_media: false }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[slack] social notice failed: HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(
      `[slack] social notice failed: ${err instanceof Error ? err.name : "error"}`,
    );
    return false;
  }
}

/** Escapes the three characters Slack treats as markup. */
export function slackEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
