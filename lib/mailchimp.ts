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

export type AudienceMember = {
  email: string;
  /** Mailchimp status: subscribed, unsubscribed, cleaned, pending, ... */
  status: string;
  /** When they opted in (ISO), falling back to Mailchimp's last-changed. */
  optedInAt: string | null;
};

/**
 * Every member of the audience, paginated. Used by the two-way sync so the
 * admin subscriber list can mirror Mailchimp. Throws on failure so the
 * caller can surface a clear error instead of half-syncing.
 */
export async function listAudienceMembers(): Promise<AudienceMember[]> {
  const cfg = getConfig();
  if (!cfg) throw new Error("Mailchimp is not configured");
  const out: AudienceMember[] = [];
  const COUNT = 1000; // Mailchimp page-size max.
  for (let offset = 0; ; offset += COUNT) {
    const fields =
      "members.email_address,members.status," +
      "members.timestamp_opt,members.timestamp_signup," +
      "members.last_changed,total_items";
    const res = await mc(
      cfg,
      `/lists/${cfg.listId}/members?count=${COUNT}&offset=${offset}&fields=${fields}`,
    );
    const j = res.json as {
      members?: {
        email_address?: string;
        status?: string;
        timestamp_opt?: string;
        timestamp_signup?: string;
        last_changed?: string;
      }[];
      total_items?: number;
    } | null;
    if (!res.ok || !j?.members) {
      throw new Error(`mailchimp list members ${res.status}`);
    }
    for (const m of j.members) {
      const email = String(m.email_address ?? "").trim().toLowerCase();
      if (!email) continue;
      out.push({
        email,
        status: m.status ?? "",
        optedInAt:
          m.timestamp_opt || m.timestamp_signup || m.last_changed || null,
      });
    }
    if (out.length >= (j.total_items ?? 0) || j.members.length < COUNT) break;
  }
  return out;
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

export type CampaignReport = {
  id: string;
  subject: string;
  campaignTitle: string;
  sendTime: string | null;
  emailsSent: number;
  hardBounces: number;
  softBounces: number;
  delivered: number;
  uniqueOpens: number;
  openRate: number;
  uniqueClicks: number;
  /** Distinct people who clicked at least once (Mailchimp's unique_subscriber_clicks). `uniqueClicks` counts per link, so it can exceed the number of people. */
  uniqueSubscriberClicks: number;
  /** Share of the people who opened that also clicked, 0 to 1. */
  clickToOpenRate: number;
  clickRate: number;
  unsubscribed: number;
  abuseReports: number;
};

/**
 * The last N sent campaigns with their report stats. Uses the /reports endpoint
 * so we get delivery, opens, clicks and unsubscribes in one call.
 * Returns [] on any failure so the caller can render "unavailable" gracefully.
 */
export async function listRecentCampaigns(
  limit = 10,
): Promise<CampaignReport[]> {
  const cfg = getConfig();
  if (!cfg) return [];
  try {
    const res = await mc(
      cfg,
      `/reports?count=${limit}&sort_field=send_time&sort_dir=DESC`,
    );
    const j = res.json as {
      reports?: Array<{
        id?: string;
        campaign_title?: string;
        subject_line?: string;
        send_time?: string;
        emails_sent?: number;
        abuse_reports?: number;
        unsubscribed?: number;
        bounces?: {
          hard_bounces?: number;
          soft_bounces?: number;
          syntax_errors?: number;
        };
        opens?: {
          unique_opens?: number;
          open_rate?: number;
        };
        clicks?: {
          unique_clicks?: number;
          unique_subscriber_clicks?: number;
          click_rate?: number;
        };
      }>;
    } | null;
    if (!res.ok || !j?.reports) return [];
    return j.reports.map((r) => {
      const sent = r.emails_sent ?? 0;
      const hb = r.bounces?.hard_bounces ?? 0;
      const sb = r.bounces?.soft_bounces ?? 0;
      const opens = r.opens?.unique_opens ?? 0;
      // People, not link clicks: unique_clicks counts each link per person.
      const clickers = r.clicks?.unique_subscriber_clicks ?? r.clicks?.unique_clicks ?? 0;
      return {
        id: r.id ?? "",
        subject: r.subject_line ?? "(no subject)",
        campaignTitle: r.campaign_title ?? r.subject_line ?? "",
        sendTime: r.send_time ?? null,
        emailsSent: sent,
        hardBounces: hb,
        softBounces: sb,
        delivered: Math.max(0, sent - hb - sb),
        uniqueOpens: r.opens?.unique_opens ?? 0,
        openRate: r.opens?.open_rate ?? 0,
        uniqueClicks: r.clicks?.unique_clicks ?? 0,
        uniqueSubscriberClicks: clickers,
        clickToOpenRate: opens > 0 ? Math.min(1, clickers / opens) : 0,
        clickRate: r.clicks?.click_rate ?? 0,
        unsubscribed: r.unsubscribed ?? 0,
        abuseReports: r.abuse_reports ?? 0,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Keep a saved "Ticket holders" segment in Mailchimp in step with the given
 * emails, so ticket holders get Mailchimp's deliverability and tracking.
 *
 * Ticket buyers agreed to join the mailing list at checkout, so anyone not yet
 * on the audience is added as subscribed. Anyone already on it as
 * unsubscribed or cleaned is left exactly as is: this never re-subscribes
 * someone who opted out. Idempotent, safe to run before every ticket send.
 */
export async function syncTicketHolderSegment(
  emails: string[],
  segmentName = "Ticket holders",
): Promise<{ added: number; removed: number; inSegment: number; optedOut: number; segmentId: number }> {
  const cfg = getConfig();
  if (!cfg) throw new Error("Mailchimp is not configured");
  // An empty list is far more likely a failed Humanitix lookup than zero
  // ticket holders; never let that wipe the segment.
  if (emails.length === 0) throw new Error("no ticket holder emails to sync");

  const existing = new Map(
    (await listAudienceMembers()).map((m) => [m.email, m.status] as const),
  );
  const toAdd = emails.filter((e) => !existing.has(e));
  const optedOut = emails.filter((e) => {
    const st = existing.get(e);
    return st !== undefined && st !== "subscribed" && st !== "pending";
  }).length;

  if (toAdd.length > 0) {
    const r = await batchSubscribe(toAdd);
    if (r.errors > 0) {
      throw new Error(`mailchimp could not add ${r.errors} ticket holder(s) to the audience`);
    }
  }

  // Find the saved segment by name, or create it.
  const found = await mc(
    cfg,
    `/lists/${cfg.listId}/segments?type=static&count=1000&fields=segments.id,segments.name`,
  );
  const segs = (found.json as { segments?: { id: number; name: string }[] } | null)?.segments;
  if (!found.ok || !segs) throw new Error(`mailchimp list segments ${found.status}`);
  let segmentId = segs.find((x) => x.name === segmentName)?.id;
  if (!segmentId) {
    const made = await mc(cfg, `/lists/${cfg.listId}/segments`, {
      method: "POST",
      body: JSON.stringify({ name: segmentName, static_segment: [] }),
    });
    segmentId = (made.json as { id?: number } | null)?.id;
    if (!made.ok || !segmentId) throw new Error(`mailchimp create segment ${made.status}`);
  }

  // Only subscribed members can be segmented for a send; add them in chunks.
  const eligible = emails.filter((e) => {
    const st = existing.get(e);
    return st === undefined || st === "subscribed" || st === "pending";
  });
  const CHUNK = 500;
  for (let i = 0; i < eligible.length; i += CHUNK) {
    const res = await mc(cfg, `/lists/${cfg.listId}/segments/${segmentId}`, {
      method: "POST",
      body: JSON.stringify({ members_to_add: eligible.slice(i, i + CHUNK) }),
    });
    if (!res.ok) throw new Error(`mailchimp segment add ${res.status}`);
  }

  // Refunded or cancelled tickets drop out of Humanitix's list, so take them
  // out of the segment too. They stay on the audience as ordinary subscribers.
  const want = new Set(eligible);
  const stale: string[] = [];
  const COUNT = 1000;
  for (let offset = 0; ; offset += COUNT) {
    const res = await mc(
      cfg,
      `/lists/${cfg.listId}/segments/${segmentId}/members?count=${COUNT}&offset=${offset}&fields=members.email_address,total_items`,
    );
    const j = res.json as { members?: { email_address?: string }[]; total_items?: number } | null;
    if (!res.ok || !j?.members) throw new Error(`mailchimp segment members ${res.status}`);
    for (const m of j.members) {
      const e = String(m.email_address ?? "").trim().toLowerCase();
      if (e && !want.has(e)) stale.push(e);
    }
    if (offset + j.members.length >= (j.total_items ?? 0) || j.members.length < COUNT) break;
  }
  for (let i = 0; i < stale.length; i += CHUNK) {
    const res = await mc(cfg, `/lists/${cfg.listId}/segments/${segmentId}`, {
      method: "POST",
      body: JSON.stringify({ members_to_remove: stale.slice(i, i + CHUNK) }),
    });
    if (!res.ok) throw new Error(`mailchimp segment remove ${res.status}`);
  }
  return { added: toAdd.length, removed: stale.length, inSegment: eligible.length, optedOut, segmentId };
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
  /**
   * When set, the campaign targets only these addresses instead of the
   * whole audience, via a throwaway Mailchimp static segment built here.
   * Mailchimp only ever actually sends to addresses that are already
   * subscribed members of the list — an email in this array that isn't a
   * member (or is unsubscribed) is silently excluded by Mailchimp itself,
   * which is exactly the compliance behaviour a marketing send needs.
   */
  segmentEmails?: string[];
}): Promise<{ campaignId: string; memberCount: number | null }> {
  const cfg = getConfig();
  if (!cfg) throw new Error("Mailchimp is not configured");

  // 0. Build the static segment first, if this is a segmented send, so a
  //    segment-creation failure (or an empty resulting segment) never gets
  //    as far as creating a campaign shell.
  let segmentId: number | undefined;
  let memberCount: number | null = null;
  if (o.segmentEmails) {
    if (o.segmentEmails.length === 0) {
      throw new Error("this segment has no recipients to send to");
    }
    const segRes = await mc(cfg, `/lists/${cfg.listId}/segments`, {
      method: "POST",
      body: JSON.stringify({
        name: `Quick segment ${new Date().toISOString()}`,
        static_segment: o.segmentEmails,
      }),
    });
    const seg = segRes.json as
      | { id?: number; member_count?: number; detail?: string }
      | null;
    if (!segRes.ok || !seg?.id) {
      throw new Error(
        `mailchimp create segment ${segRes.status}: ${seg?.detail ?? "unknown error"}`,
      );
    }
    segmentId = seg.id;
    memberCount = seg.member_count ?? null;
    if (memberCount === 0) {
      // None of these addresses are actual Mailchimp list members (or all
      // are unsubscribed) — clean up the empty segment and fail clearly
      // rather than "sending" a campaign that reaches nobody.
      await mc(cfg, `/lists/${cfg.listId}/segments/${segmentId}`, {
        method: "DELETE",
      }).catch(() => {});
      throw new Error(
        "none of this segment's addresses are subscribed on Mailchimp",
      );
    }
  }

  // 1. Create the campaign shell.
  const created = await mc(cfg, `/campaigns`, {
    method: "POST",
    body: JSON.stringify({
      type: "regular",
      recipients: {
        list_id: cfg.listId,
        ...(segmentId ? { segment_opts: { saved_segment_id: segmentId } } : {}),
      },
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

  // A one-off static segment has no further use once the campaign is sent.
  // Best-effort cleanup: a leftover segment is cosmetic Mailchimp-UI
  // clutter, not a functional problem, so a failure here doesn't matter.
  if (segmentId) {
    await mc(cfg, `/lists/${cfg.listId}/segments/${segmentId}`, {
      method: "DELETE",
    }).catch(() => {});
  }

  return { campaignId: campaign.id, memberCount };
}

export type MemberActivity = {
  status: string | null;
  joinedAt: string | null;
  rating: number | null;
  openRate: number | null;
  clickRate: number | null;
  items: { at: string | null; action: string; title: string | null; url: string | null }[];
};

/**
 * One member's audience status and recent newsletter activity (sends, opens,
 * clicks, bounces), for the People profile. Returns null when Mailchimp is not
 * configured, the address is not in the audience, or the call fails. Parsing
 * is defensive: the newer activity-feed endpoint and the older activity one
 * name their fields differently.
 */
export async function getMemberActivity(email: string): Promise<MemberActivity | null> {
  const cfg = getConfig();
  if (!cfg) return null;
  const hash = memberHash(email);
  const base = `/lists/${cfg.listId}/members/${hash}`;
  const timeout = () => AbortSignal.timeout(6000);
  try {
    const member = await mc(cfg, base, { signal: timeout() });
    if (!member.ok) return null;
    const m = (member.json ?? {}) as Record<string, unknown>;
    const stats = (m.stats ?? {}) as Record<string, unknown>;
    const num = (v: unknown) => (typeof v === "number" ? v : null);
    const str = (v: unknown) => (typeof v === "string" && v ? v : null);

    let raw: Record<string, unknown>[] = [];
    const feed = await mc(cfg, `${base}/activity-feed?count=50`, { signal: timeout() });
    if (feed.ok) {
      raw = (((feed.json ?? {}) as Record<string, unknown>).activity ?? []) as Record<string, unknown>[];
    } else {
      const old = await mc(cfg, `${base}/activity`, { signal: timeout() });
      if (old.ok) raw = (((old.json ?? {}) as Record<string, unknown>).activity ?? []) as Record<string, unknown>[];
    }

    const items = (Array.isArray(raw) ? raw : []).map((a) => ({
      at: str(a.created_at_timestamp) ?? str(a.timestamp),
      action: str(a.activity_type) ?? str(a.action) ?? "activity",
      title: str(a.campaign_title) ?? str(a.title),
      url: str(a.link_clicked) ?? str(a.url),
    }));

    return {
      status: str(m.status),
      joinedAt: str(m.timestamp_opt) ?? str(m.timestamp_signup),
      rating: num(m.member_rating),
      openRate: num(stats.avg_open_rate),
      clickRate: num(stats.avg_click_rate),
      items,
    };
  } catch {
    return null;
  }
}
