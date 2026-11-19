/**
 * Minimal Slack Web API client for the huddle bot (bot token, not the
 * Incoming Webhook). Never throws for API-level errors: returns the parsed
 * response so callers can check `ok`. Never logs the token.
 */
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export type SlackResponse = { ok: boolean; error?: string; [k: string]: unknown };

export function slackBotConfigured(): boolean {
  return Boolean(process.env.SLACK_BOT_TOKEN && process.env.SLACK_SIGNING_SECRET);
}

export async function slackApi(method: string, body: Record<string, unknown>): Promise<SlackResponse> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return { ok: false, error: "no_token" };
  try {
    const res = await fetch(`https://slack.com/api/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json()) as SlackResponse;
    if (!json.ok) {
      const detail = (json.response_metadata as { messages?: string[] } | undefined)?.messages?.join("; ") ?? "";
      console.error(`[slack-api] ${method} failed: ${json.error} ${detail}`.trim());
    }
    return json;
  } catch (err) {
    console.error(`[slack-api] ${method} threw: ${err instanceof Error ? err.name : "error"}`);
    return { ok: false, error: "request_failed" };
  }
}

/** GET-style Slack methods that take query params (users.list, lookupByEmail). */
export async function slackGet(method: string, params: Record<string, string>): Promise<SlackResponse> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return { ok: false, error: "no_token" };
  try {
    const res = await fetch(`https://slack.com/api/${method}?${new URLSearchParams(params)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json()) as SlackResponse;
    if (!json.ok) console.error(`[slack-api] ${method} failed: ${json.error}`);
    return json;
  } catch {
    return { ok: false, error: "request_failed" };
  }
}

/** Verifies Slack's request signature (v0) and that the timestamp is fresh. */
export function verifySlackSignature(rawBody: string, timestamp: string | null, signature: string | null): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret || !timestamp || !signature) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 60 * 5) return false;
  const expected = `v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${rawBody}`).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
