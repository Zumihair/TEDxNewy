/**
 * Publishing a social post, for both callers: the Publish button in
 * /admin/socials and the cron that sends scheduled posts when their time
 * arrives.
 *
 * Why this exists as its own module rather than living in the socials
 * actions: the action runs as a signed-in admin and reaches Supabase through
 * that session, while the cron has no session at all and has to use the
 * service client. The publishing itself is identical, so it takes the client
 * as an argument and each caller supplies its own.
 *
 * Server-only, and it is one of the few places allowed to touch the service
 * client (see lib/supabase-admin.ts).
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { publish } from "@/lib/buffer-social";
import {
  captionFor,
  mediaType,
  type ChannelId,
  type ChannelResult,
  type SocialMediaRow,
  type SocialPostRow,
  autopublishActionable,
} from "@/app/admin/socials/shared";

/** How long a claim is honoured before another run may take the post. Only
 *  reached if a run dies between claiming and releasing. */
const CLAIM_STALE_MS = 10 * 60 * 1000;

/**
 * "Nobody is working on this post." The claim column is NOT NULL defaulting
 * to -infinity (see the migration), so releasing a post means putting the
 * sentinel back rather than nulling it. That keeps the claim itself a single
 * comparison against a cutoff, which matches a never-claimed post and a
 * stale one with the same filter.
 */
const UNCLAIMED = "-infinity";

/** Posts one pass will take on. Each one can mean up to three Buffer calls,
 *  and the pass shares its 300s budget with the newsletter and flow sends,
 *  so the queue drains over several passes rather than one long one. */
const MAX_POSTS_PER_RUN = 10;

export type PublishOutcome =
  | { ok: true; permalink: string | null }
  | { ok: false; error: string };

type PublishChannelInput = {
  supabase: SupabaseClient;
  postId: string;
  channel: ChannelId;
  /** Admin email for a manual publish; null when the cron did it. Recorded
   *  on the post so "who posted this" has an answer either way. */
  actor: string | null;
  via: "manual" | "cron";
  /** The cron sets this: a channel that has already gone out must never be
   *  published twice, however many times the post is reconsidered. The
   *  button leaves it off, because "Publish again" is a real thing a human
   *  may want. */
  skipIfPosted?: boolean;
};

/**
 * Publishes one channel of one post and records what happened.
 *
 * The post is re-read here rather than passed in, which matters when several
 * channels go out in sequence: each write merges into the channel_results
 * that the previous one just saved, instead of overwriting it from a stale
 * copy.
 */
export async function publishChannel({
  supabase,
  postId,
  channel,
  actor,
  via,
  skipIfPosted = false,
}: PublishChannelInput): Promise<PublishOutcome> {
  const { data: connection } = await supabase
    .from("social_connections")
    .select("external_account_id, status")
    .eq("channel", channel)
    .maybeSingle();
  if (
    !connection ||
    connection.status !== "connected" ||
    !connection.external_account_id
  ) {
    return { ok: false, error: `${channel} isn't connected yet.` };
  }

  const { data: postRow } = await supabase
    .from("social_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();
  if (!postRow) return { ok: false, error: "Post not found." };
  const post = postRow as SocialPostRow;

  const previous = post.channel_results?.[channel] ?? null;
  if (skipIfPosted && previous?.status === "posted") {
    return { ok: true, permalink: previous.permalink };
  }

  const { data: mediaRows } = await supabase
    .from("social_post_media")
    .select("*")
    .eq("post_id", postId)
    .order("display_order", { ascending: true });
  const media = ((mediaRows ?? []) as SocialMediaRow[]).map((m) => ({
    url: m.image_url,
    kind: mediaType(m),
  }));

  const result = await publish({
    channelId: connection.external_account_id,
    channel,
    caption: captionFor(post, channel),
    media,
  });

  const channelResult: ChannelResult = result.ok
    ? {
        status: "posted",
        permalink: result.permalink,
        postedAt: new Date().toISOString(),
        error: null,
        attempts: (previous?.attempts ?? 0) + 1,
        via,
      }
    : {
        status: "failed",
        permalink: null,
        postedAt: new Date().toISOString(),
        error: result.error,
        attempts: (previous?.attempts ?? 0) + 1,
        via,
      };

  const nextResults = { ...post.channel_results, [channel]: channelResult };
  const allPosted = (post.channels ?? []).every(
    (c) => nextResults[c]?.status === "posted",
  );

  const patch: Record<string, unknown> = {
    channel_results: nextResults,
    updated_at: new Date().toISOString(),
  };
  if (allPosted) {
    patch.status = "posted";
    patch.posted_at = new Date().toISOString();
    patch.posted_by = actor;
  }
  await supabase.from("social_posts").update(patch).eq("id", postId);

  // Scheduler bookkeeping, kept to its own best-effort statement so that a
  // post which has genuinely gone out is always recorded as Posted above.
  // 20260818c_social_autopublish.sql is applied by hand, so between deploying
  // and running it these columns do not exist and this write fails; that must
  // not cost us the record of a real publish, and it costs nothing else,
  // since a post already marked Posted can never match the due query.
  if (allPosted) {
    await supabase
      .from("social_posts")
      .update({
        autopublish_done_at: new Date().toISOString(),
        autopublish_claimed_at: UNCLAIMED,
      })
      .eq("id", postId);
  }

  return result.ok
    ? { ok: true, permalink: result.permalink }
    : { ok: false, error: result.error };
}

// ---- the scheduler ----

export type ScheduledRunSummary = {
  considered: number;
  published: number;
  failed: number;
  settled: number;
};

/**
 * Sends every scheduled post whose time has come. Called from
 * /api/cron/newsletter, which runs every 5 minutes, so "scheduled for 6pm"
 * means "goes out by about 6:05".
 *
 * The rules, all of them:
 *
 *  - A post goes out because it is Scheduled and its date has passed. The
 *    editorial stage is NOT consulted. Setting a date is the instruction to
 *    publish, and this matches how a scheduled newsletter behaves; a second
 *    hidden condition is how a post ends up sitting there unsent with
 *    nothing on screen explaining why, which is the bug this whole module
 *    exists to fix.
 *  - Only channels connected through Buffer are published. An unconnected
 *    channel keeps the manual run sheet it has always had.
 *  - A channel that already succeeded is never published again, no matter
 *    how many passes look at the post.
 *  - A post is claimed before any of that, so two overlapping passes cannot
 *    both publish it.
 */
export async function processScheduledPosts(): Promise<ScheduledRunSummary> {
  const supabase = getAdminSupabase();
  const nowIso = new Date().toISOString();
  const staleIso = new Date(Date.now() - CLAIM_STALE_MS).toISOString();
  const summary: ScheduledRunSummary = {
    considered: 0,
    published: 0,
    failed: 0,
    settled: 0,
  };

  const { data: due, error } = await supabase
    .from("social_posts")
    .select("id")
    .eq("status", "scheduled")
    .lte("publish_at", nowIso)
    .is("autopublish_done_at", null)
    .order("publish_at", { ascending: true })
    .limit(MAX_POSTS_PER_RUN);
  if (error) {
    console.error("[socials] due query failed", error);
    return summary;
  }

  // Which channels can be published at all. Read once for the whole pass:
  // it is three rows and it does not change mid-run.
  const { data: connRows } = await supabase
    .from("social_connections")
    .select("channel, status, external_account_id");
  const connected = new Set(
    (connRows ?? [])
      .filter((c) => c.status === "connected" && c.external_account_id)
      .map((c) => c.channel as ChannelId),
  );

  for (const row of due ?? []) {
    const postId = row.id as string;

    // Claim. The status and staleness conditions are part of the UPDATE, so
    // Postgres decides the winner under a row lock: a second pass arriving
    // here at the same moment matches zero rows and moves on.
    const { data: claimedRow } = await supabase
      .from("social_posts")
      .update({ autopublish_claimed_at: nowIso })
      .eq("id", postId)
      .eq("status", "scheduled")
      .is("autopublish_done_at", null)
      .lt("autopublish_claimed_at", staleIso)
      .select("*")
      .maybeSingle();
    if (!claimedRow) continue;

    const post = claimedRow as SocialPostRow;
    summary.considered += 1;

    const selected = post.channels ?? [];
    let attempted = false;

    for (const channel of selected) {
      const previous = post.channel_results?.[channel] ?? null;
      if (!autopublishActionable(previous, connected.has(channel))) continue;

      attempted = true;
      const outcome = await publishChannel({
        supabase,
        postId,
        channel,
        actor: null,
        via: "cron",
        skipIfPosted: true,
      });
      if (outcome.ok) summary.published += 1;
      else {
        summary.failed += 1;
        console.error(`[socials] ${channel} failed on ${postId}: ${outcome.error}`);
      }
    }

    // Re-read: publishChannel may have flipped the post to posted, and the
    // channel_results it wrote are what decides whether anything is left.
    const { data: afterRow } = await supabase
      .from("social_posts")
      .select("*")
      .eq("id", postId)
      .maybeSingle();
    const after = (afterRow ?? post) as SocialPostRow;

    // Is there anything a future pass could usefully do? Only a connected
    // channel that has not gone out and still has attempts left. If not, the
    // post is settled: either it is fully posted, or what remains is a
    // manual channel or an exhausted one, and both of those need a human.
    // Without this the post would be re-claimed every 5 minutes forever.
    const retryable = (after.channels ?? []).some((c) =>
      autopublishActionable(after.channel_results?.[c] ?? null, connected.has(c)),
    );

    if (after.status === "posted") {
      // publishChannel already settled and released it.
      summary.settled += 1;
    } else if (retryable && attempted) {
      // Something transient. Release the claim and let the next pass try.
      await supabase
        .from("social_posts")
        .update({ autopublish_claimed_at: UNCLAIMED })
        .eq("id", postId);
    } else {
      await supabase
        .from("social_posts")
        .update({
          autopublish_claimed_at: UNCLAIMED,
          autopublish_done_at: new Date().toISOString(),
        })
        .eq("id", postId);
      summary.settled += 1;
    }
  }

  return summary;
}
