/**
 * Tells the team Slack channel (#team-brand) when a social post has gone out,
 * with the live link.
 *
 * Why a sweep on the cron rather than a call inside publishChannel: Buffer's
 * createPost returns immediately and the post only reaches the network about
 * a minute later; the live URL (`externalLink`) does not exist at publish
 * time. So publishChannel only records the Buffer post id (as it always did)
 * and this sweep, run on the same 5 minute cron, asks Buffer for the link and
 * announces it once. It also means posts published by the Publish button are
 * covered by the same path, and Buffer's own status is checked, so a post
 * Buffer accepted but the network rejected is reported as a failure rather
 * than announced as success.
 *
 * Guarantees:
 *  - Best effort. Nothing here can throw into the cron or touch a post's
 *    status; the worst case is a missing Slack message.
 *  - Once per publish. `channel_results[ch].slackNotifiedAt` is claimed
 *    before sending (so an overlapping pass skips it) and released again if
 *    Slack fails (so the next pass retries).
 *  - Only real publishes: it only looks at channel results with status
 *    "posted" and a Buffer post id. Drafts, edits and failures never match.
 *  - Recent only: results older than LOOKBACK_MS are ignored, so switching the
 *    webhook on does not replay history.
 *  - No-op when SLACK_SOCIAL_WEBHOOK_URL is unset.
 */
import "server-only";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { getPostLinks } from "@/lib/buffer-social";
import { sendSlackSocial, slackEscape, slackSocialConfigured } from "@/lib/slack-notify";
import {
  CHANNELS,
  captionFor,
  type ChannelId,
  type ChannelResult,
  type SocialPostRow,
} from "@/app/admin/socials/shared";

const LOOKBACK_MS = 3 * 60 * 60 * 1000;
/** After this long without a live link, announce without one rather than
 *  waiting forever. */
const LINK_GIVE_UP_MS = 30 * 60 * 1000;
const MAX_POSTS = 30;
const SITE = "https://tedxnewy.com.au";

export type SlackSweepSummary = { announced: number; skipped: number };

type Candidate = { post: SocialPostRow; channel: ChannelId; result: ChannelResult };

function snippet(caption: string): string {
  const flat = caption.replace(/\s+/g, " ").trim();
  return flat.length > 140 ? `${flat.slice(0, 137)}...` : flat;
}

function message(c: Candidate, link: string | null, buffer: string | null): string {
  const label = CHANNELS.find((x) => x.id === c.channel)?.label ?? c.channel;
  const adminUrl = `${SITE}/admin/socials/${c.post.id}`;
  const how = c.result.via === "cron" ? "Published on schedule" : "Published from the admin";
  const caption = snippet(captionFor(c.post, c.channel));
  if (buffer === "error") {
    return [
      `:warning: Buffer reports the ${label} post failed to go out: *${slackEscape(c.post.title)}*`,
      `Check it here: <${adminUrl}|open in the admin>`,
    ].join("\n");
  }
  const lines = [
    link
      ? `:mega: New post on ${label}: <${link}|view it live>`
      : `:mega: New post on ${label} (no live link from Buffer yet): <${adminUrl}|open in the admin>`,
    `*${slackEscape(c.post.title)}*`,
  ];
  if (caption) lines.push(`> ${slackEscape(caption)}`);
  lines.push(`${how}. <${adminUrl}|Admin>`);
  return lines.join("\n");
}

export async function announcePublishedPosts(): Promise<SlackSweepSummary> {
  const summary: SlackSweepSummary = { announced: 0, skipped: 0 };
  if (!slackSocialConfigured()) return summary;

  const supabase = getAdminSupabase();
  const now = Date.now();
  const since = new Date(now - LOOKBACK_MS).toISOString();

  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .gte("updated_at", since)
    .order("updated_at", { ascending: false })
    .limit(MAX_POSTS);
  if (error) {
    console.error("[slack] sweep query failed", error);
    return summary;
  }

  const candidates: Candidate[] = [];
  for (const row of (data ?? []) as SocialPostRow[]) {
    for (const channel of row.channels ?? []) {
      const result = row.channel_results?.[channel];
      if (
        result?.status === "posted" &&
        result.bufferPostId &&
        !result.slackNotifiedAt &&
        now - Date.parse(result.postedAt) < LOOKBACK_MS
      ) {
        candidates.push({ post: row, channel, result });
      }
    }
  }
  if (candidates.length === 0) return summary;

  const links = await getPostLinks(candidates.map((c) => c.result.bufferPostId as string));

  for (const c of candidates) {
    const info = links.get(c.result.bufferPostId as string);
    const age = now - Date.parse(c.result.postedAt);
    const buffer = info?.status ?? null;
    const link = info?.externalLink ?? null;
    // Not out yet and not overdue: leave it for the next pass.
    if (!link && buffer !== "error" && age < LINK_GIVE_UP_MS) {
      summary.skipped += 1;
      continue;
    }

    const claimed = await setNotified(c, new Date().toISOString());
    if (!claimed) continue;
    const ok = await sendSlackSocial(message(c, link, buffer));
    if (ok) summary.announced += 1;
    else await setNotified(c, null);
  }
  return summary;
}

/** Writes slackNotifiedAt for one channel, merged into the freshest
 *  channel_results so a concurrent publish on another channel is kept.
 *  Claiming (value set) only succeeds if the channel is still unclaimed and
 *  is still the same publish. Never touches status or scheduler columns. */
async function setNotified(c: Candidate, value: string | null): Promise<boolean> {
  try {
    const supabase = getAdminSupabase();
    const { data: fresh } = await supabase
      .from("social_posts")
      .select("channel_results")
      .eq("id", c.post.id)
      .maybeSingle();
    const results = (fresh?.channel_results ?? {}) as SocialPostRow["channel_results"];
    const current = results[c.channel];
    if (!current) return false;
    if (value && (current.slackNotifiedAt || current.bufferPostId !== c.result.bufferPostId)) {
      return false;
    }
    const next = { ...results, [c.channel]: { ...current, slackNotifiedAt: value } };
    const { error } = await supabase
      .from("social_posts")
      .update({ channel_results: next })
      .eq("id", c.post.id);
    return !error;
  } catch {
    return false;
  }
}
