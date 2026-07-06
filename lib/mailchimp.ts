/**
 * Minimal Mailchimp Marketing API client (raw fetch, matching the house style
 * of lib/email-notify.ts). Server-only: the API key must never reach the
 * browser.
 *
 * Used for the newsletter path: campaigns send through Mailchimp (the account
 * has a high-volume free plan), while transactional email (form confirmations,
 * Quick Compose, the welcome flow) stays on Resend.
 *
 * Env:
 *   MAILCHIMP_API_KEY      - key from Mailchimp; the datacenter suffix after
 *                            the last "-" (e.g. "us21") picks the API host.
 *   MAILCHIMP_AUDIENCE_ID  - the Audience (list) id to sync and send to.
 *   MAILCHIMP_WEBHOOK_SECRET - shared secret for the unsubscribe webhook.
 */
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";

type McConfig = { apiKey: string; listId: string; base: string };

function getConfig(): McConfig | null {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_AUDIENCE_ID;
  if (!apiKey || !listId) return null;
  const dc = apiKey.split("-").pop();
  if (!dc || dc === apiKey) return null;
  return { apiKey, listId, base: `https://${dc}.api.mailchimp.com/3.0` };
}

export function mailchimpConfigured(): boolean {
  return getConfig() !== null;
}

async function mc(
  cfg: McConfig,
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const res = await fetch(`${cfg.base}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`anystring:${cfg.apiKey}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // 204s (e.g. campaign send) have no body.
  }
  return { ok: res.ok, status: res.status, json };
}

function memberHash(email: string): string {
  return createHash("md5").update(email.trim().toLowerCase()).digest("hex");
}

/** Add or re-subscribe one member. Best-effort callers should catch. */
export async function upsertMember(email: string): Promise<void> {
  const cfg = getConfig();
  if (!cfg) return;
  const res = await mc(
    cfg,
    `/lists/${cfg.listId}/members/${memberHash(email)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        email_address: email.trim().toLowerCase(),
        status_if_new: "subscribed",
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`mailchimp upsert ${res.status}: ${JSON.stringify(res.json).slice(0, 300)}`);
  }
}

/** Mark one member unsubscribed. Best-effort callers should catch. */
export async function unsubscribeMember(email: string): Promise<void> {
  const cfg = getConfig();
  if (!cfg) return;
  const res = await mc(
    cfg,
    `/lists/${cfg.listId}/members/${memberHash(email)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: "unsubscribed" }),
    },
  );
  // 404 just means they were never in the audience; nothing to unsubscribe.
  if (!res.ok && res.status !== 404) {
    throw new Error(`mailchimp unsubscribe ${res.status}`);
  }
}

/** Batch-subscribe many emails (chunks of 500, update_existing). */
export async function batchSubscribe(
  emails: string[],
): Promise<{ added: number; updated: number; errors: number }> {
  const cfg = getConfig();
  if (!cfg) return { added: 0, updated: 0, errors: 0 };
  let added = 0;
  let updated = 0;
  let errors = 0;
  const CHUNK = 500; // Mailchimp batch-subscribe limit per call.
  for (let i = 0; i < emails.length; i += CHUNK) {
    const slice = emails.slice(i, i + CHUNK);
    const res = await mc(cfg, `/lists/${cfg.listId}`, {
      method: "POST",
      body: JSON.stringify({
        members: slice.map((email) => ({
          email_address: email,
          status: "subscribed",
        })),
        update_existing: true,
      }),
    });
    const j = res.json as {
      total_created?: number;
      total_updated?: number;
      error_count?: number;
    } | null;
    if (res.ok && j) {
      added += j.total_created ?? 0;
      updated += j.total_updated ?? 0;
      errors += j.error_count ?? 0;
    } else {
      errors += slice.length;
    }
  }
  return { added, updated, errors };
}

/**
 * Cached for 5 minutes: the audience count barely moves and this is read on
 * every newsletter page load, so we don't want a Mailchimp round trip each
 * time. Env access inside the cached fn is fine. Keeps the null-on-failure
 * behaviour (a transient miss just caches null until the next revalidate).
 */
const getCachedAudienceCount = unstable_cache(
  async (): Promise<number | null> => {
    const cfg = getConfig();
    if (!cfg) return null;
    try {
      const res = await mc(
        cfg,
        `/lists/${cfg.listId}?fields=stats.member_count`,
      );
      const j = res.json as { stats?: { member_count?: number } } | null;
      return res.ok ? (j?.stats?.member_count ?? null) : null;
    } catch {
      return null;
    }
  },
  ["mailchimp-audience-count"],
  { revalidate: 300 },
);

/** Live member count of the audience, or null if unavailable. Cached 5 min. */
export async function getAudienceCount(): Promise<number | null> {
  return getCachedAudienceCount();
}

/**
 * Create a regular campaign with the given HTML and send it to the whole
 * audience. Returns the Mailchimp campaign id. Throws on any failure so the
 * newsletter pipeline can surface the error instead of marking sent.
 *
 * The HTML must contain the *|UNSUB|* merge tag (and ideally *|LIST:ADDRESS|*)
 * or Mailchimp rejects the send for compliance.
 */
export async function sendCampaign(o: {
  title: string;
  subject: string;
  preheader: string;
  fromName: string;
  replyTo: string;
  html: string;
  plainText?: string;
}): Promise<string> {
  const cfg = getConfig();
  if (!cfg) throw new Error("Mailchimp is not configured");

  // 1. Create the campaign shell.
  const created = await mc(cfg, `/campaigns`, {
    method: "POST",
    body: JSON.stringify({
      type: "regular",
      recipients: { list_id: cfg.listId },
      settings: {
        title: o.title,
        subject_line: o.subject,
        preview_text: o.preheader,
        from_name: o.fromName,
        reply_to: o.replyTo,
        auto_footer: false,
      },
    }),
  });
  const campaign = created.json as { id?: string; detail?: string } | null;
  if (!created.ok || !campaign?.id) {
    throw new Error(
      `mailchimp create campaign ${created.status}: ${campaign?.detail ?? "unknown error"}`,
    );
  }

  // 2. Set the content.
  const content = await mc(cfg, `/campaigns/${campaign.id}/content`, {
    method: "PUT",
    body: JSON.stringify({
      html: o.html,
      ...(o.plainText ? { plain_text: o.plainText } : {}),
    }),
  });
  if (!content.ok) {
    const j = content.json as { detail?: string } | null;
    throw new Error(
      `mailchimp set content ${content.status}: ${j?.detail ?? "unknown error"}`,
    );
  }

  // 3. Send.
  const sent = await mc(cfg, `/campaigns/${campaign.id}/actions/send`, {
    method: "POST",
  });
  if (!sent.ok) {
    const j = sent.json as { detail?: string } | null;
    throw new Error(
      `mailchimp send ${sent.status}: ${j?.detail ?? "unknown error"}`,
    );
  }

  return campaign.id;
}
