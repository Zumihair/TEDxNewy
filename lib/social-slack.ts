/**
 * Tells the team Slack channel (#team-brand) when a social post has gone out:
 * ONE message per post, with the title, caption preview, a live link per
 * channel and the attached images. Message layout lives in
 * lib/social-slack-message.ts.
 *
 * Why a sweep on the cron rather than a call inside publishChannel: Buffer's
 * createPost returns immediately and the post only reaches the network about
 * a minute later; the live URL (`externalLink`) does not exist at publish
 * time. So publishChannel only records the Buffer post id (as it always did)
 * and this sweep, run on the same 5 minute cron, asks Buffer for the links
 * and announces. It covers cron and Publish button alike, and checks Buffer's
 * own status, so a post Buffer accepted but the network rejected is reported
 * as "not posted" rather than announced as a success.
 *
 * When a post is announced: only once EVERY channel of it has resolved, so a
 * partial message never needs a second one. A channel is resolved when it has
 * a live link, Buffer reports it errored, our own publish failed for good, or
 * 30 minutes have passed with no link (announced as "posted, no link yet").
 * Channels still to be published or retried make the whole post wait for the
 * next pass. Channels with no Buffer connection (manual run sheet) are left
 * out and never waited for.
 *
 * Guarantees:
 *  - Best effort. Nothing here can throw into the cron or touch a post's
 *    status; the worst case is a missing Slack message.
 *  - Once per publish. Every channel included in a message gets
 *    `channel_results[ch].slackNotifiedAt` BEFORE sending (an overlapping pass
 *    skips it) and cleared again if Slack fails (the next pass retries). A
 *    "Publish again" writes a fresh result without the marker, so that
 *    channel is announced again as its own message.
 *  - Only real publishes in the last LOOKBACK_MS, so switching it on or a
 *    stale post never replays history.
 *  - Images are optional: if Slack rejects the message with images (for
 *    instance it cannot fetch one) it is resent without them.
 *  - No-op when SLACK_SOCIAL_WEBHOOK_URL is unset.
 */
import "server-only";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { getPostLinks } from "@/lib/buffer-social";
import { sendSlackSocial, slackSocialConfigured } from "@/lib/slack-notify";
import {
  buildSlackPostMessage,
  slackFriendlyImage,
  type ChannelOutcome,
} from "@/lib/social-slack-message";
import {
  CHANNELS,
  autopublishActionable,
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

export type SlackSweepSummary = { announced: number; waiting: number };

type Included = { channel: ChannelId; result: ChannelResult };

function labelOf(channel: ChannelId): string {
  return CHANNELS.find((c) => c.id === channel)?.label ?? channel;
}

export async function announcePublishedPosts(): Promise<SlackSweepSummary> {
  const summary: SlackSweepSummary = { announced: 0, waiting: 0 };
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

  // Nothing touched in the last 3 hours (the usual state): stop here, so a
  // quiet pass costs one query and never reaches Buffer.
  if (!data || data.length === 0) return summary;

  const { data: connRows } = await supabase
    .from("social_connections")
    .select("channel, status, external_account_id");
  const connected = new Set(
    (connRows ?? [])
      .filter((c) => c.status === "connected" && c.external_account_id)
      .map((c) => c.channel as ChannelId),
  );

  // Pass 1: decide, per post, which channels are up for announcement and
  // whether anything is still pending.
  type Plan = { post: SocialPostRow; included: Included[] };
  const plans: Plan[] = [];
  for (const post of (data ?? []) as SocialPostRow[]) {
    const included: Included[] = [];
    let pending = false;
    const done = Boolean((post as unknown as { autopublish_done_at: string | null }).autopublish_done_at);
    for (const channel of post.channels ?? []) {
      const r = post.channel_results?.[channel];
      const recent = r ? now - Date.parse(r.postedAt) < LOOKBACK_MS : false;
      if (!r) {
        // Not attempted yet. The cron will do it if the post is scheduled and
        // the channel is connected; anything else is a manual channel.
        if (connected.has(channel) && post.status === "scheduled" && !done) pending = true;
        continue;
      }
      if (r.slackNotifiedAt || !recent) continue;
      if (r.status === "posted" && r.bufferPostId) {
        included.push({ channel, result: r });
      } else if (r.status === "failed") {
        const terminal =
          !autopublishActionable(r, connected.has(channel)) ||
          post.status !== "scheduled" ||
          done;
        if (terminal) included.push({ channel, result: r });
        else pending = true;
      }
    }
    if (included.length === 0) continue;
    if (pending) {
      summary.waiting += 1;
      continue;
    }
    plans.push({ post, included });
  }
  if (plans.length === 0) return summary;

  const bufferIds = plans.flatMap((p) =>
    p.included
      .filter((i) => i.result.status === "posted")
      .map((i) => i.result.bufferPostId as string),
  );
  const links = await getPostLinks(bufferIds);

  // Pass 2: resolve each channel against Buffer; send when all are resolved.
  for (const { post, included } of plans) {
    const outcomes: ChannelOutcome[] = [];
    let unresolved = false;
    for (const { channel, result } of included) {
      const label = labelOf(channel);
      if (result.status === "failed") {
        outcomes.push({ channel, label, state: "failed", link: null });
        continue;
      }
      const info = links.get(result.bufferPostId as string);
      const link = info?.externalLink ?? null;
      if (info?.status === "error") {
        outcomes.push({ channel, label, state: "failed", link: null });
      } else if (link) {
        outcomes.push({ channel, label, state: "live", link });
      } else if (now - Date.parse(result.postedAt) >= LINK_GIVE_UP_MS) {
        outcomes.push({ channel, label, state: "nolink", link: null });
      } else {
        unresolved = true;
        break;
      }
    }
    if (unresolved) {
      summary.waiting += 1;
      continue;
    }

    const claimed = await setNotified(post.id, included, new Date().toISOString());
    if (!claimed) continue;

    const input = {
      title: post.title,
      caption: post.caption,
      adminUrl: `${SITE}/admin/socials/${post.id}`,
      outcomes,
      imageUrls: await imagesFor(post.id),
    };
    let ok = await sendSlackSocial(buildSlackPostMessage(input));
    if (!ok && input.imageUrls.length > 1) {
      // Carousel refused: resend the older stacked image blocks.
      ok = await sendSlackSocial(buildSlackPostMessage(input, { layout: "stacked" }));
    }
    if (!ok && input.imageUrls.length > 0) {
      // Slack may have refused an image it could not fetch. Send without.
      ok = await sendSlackSocial(buildSlackPostMessage(input, { layout: "none" }));
    }
    if (ok) summary.announced += 1;
    else await setNotified(post.id, included, null);
  }
  return summary;
}

/** Attached images, in display order, filtered to ones Slack can show. Reads
 *  nothing beyond the media table and never throws. */
async function imagesFor(postId: string): Promise<string[]> {
  try {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from("social_post_media")
      .select("image_url, media_type, display_order")
      .eq("post_id", postId)
      .order("display_order", { ascending: true });
    return (data ?? [])
      .filter((m) => m.media_type !== "video")
      .map((m) => m.image_url as string)
      .filter(slackFriendlyImage);
  } catch {
    return [];
  }
}

/** Writes slackNotifiedAt for every included channel in one update, merged
 *  into the freshest channel_results so a concurrent publish on another
 *  channel is kept. Claiming (value set) only succeeds if every channel is
 *  still unclaimed and still the same publish. Never touches status or the
 *  scheduler columns. */
async function setNotified(
  postId: string,
  included: Included[],
  value: string | null,
): Promise<boolean> {
  try {
    const supabase = getAdminSupabase();
    const { data: fresh } = await supabase
      .from("social_posts")
      .select("channel_results")
      .eq("id", postId)
      .maybeSingle();
    const results = (fresh?.channel_results ?? {}) as SocialPostRow["channel_results"];
    const next = { ...results };
    for (const { channel, result } of included) {
      const current = results[channel];
      if (!current) return false;
      if (value && (current.slackNotifiedAt || current.postedAt !== result.postedAt)) {
        return false;
      }
      next[channel] = { ...current, slackNotifiedAt: value };
    }
    const { error } = await supabase
      .from("social_posts")
      .update({ channel_results: next })
      .eq("id", postId);
    return !error;
  } catch {
    return false;
  }
}
