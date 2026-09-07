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
import { publish, listSentPosts, bufferConfigured } from "@/lib/buffer-social";
import {
  captionFor,
  mediaType,
  needsBufferBackfill,
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
        bufferPostId: result.bufferPostId,
        postedAt: new Date().toISOString(),
        error: null,
        attempts: (previous?.attempts ?? 0) + 1,
        via,
      }
    : {
        status: "failed",
        permalink: null,
        // A failed attempt created no new Buffer post; keep whatever an
        // earlier successful attempt on this channel recorded rather than
        // clobbering it with null.
        bufferPostId: previous?.bufferPostId ?? null,
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

// ---- backfilling ids for posts that predate metrics tracking ----

export type BackfillSkip = { title: string; channel: ChannelId; reason: string };
export type BackfillOutcome = { matched: number; skipped: BackfillSkip[] };

/** How far either side of when we recorded a channel as posted a Buffer
 *  "sent" entry may sit and still be trusted as the same post. Generous
 *  enough to absorb clock drift and Buffer's own queueing delay, tight
 *  enough that two unrelated posts a week apart can't be confused. */
const BACKFILL_TOLERANCE_MS = 48 * 60 * 60 * 1000;

/**
 * Retroactively fills in `bufferPostId` for channels that went out through
 * Buffer before this codebase captured that id (see the comment on
 * ChannelResult.bufferPostId in shared.ts and getPostMetrics in
 * lib/buffer-social.ts). Triggered by hand from the Posted tab
 * ("Backfill from Buffer" in PostsList.tsx), not run automatically: it's a
 * one-time catch-up, not an ongoing job.
 *
 * Matching is deliberately conservative. The only signal available is the
 * exact caption text `publish()` would have sent, plus roughly when we
 * recorded the channel as posted, against Buffer's own history of what it
 * actually sent on that channel. Anything short of a confident single match
 * is skipped and named in the result rather than guessed at: attaching the
 * wrong post's numbers would misreport that post's performance for good,
 * silently, which is worse than just not having metrics for it yet.
 */
export async function backfillBufferPostIds(
  supabase: SupabaseClient,
): Promise<BackfillOutcome> {
  const outcome: BackfillOutcome = { matched: 0, skipped: [] };
  if (!bufferConfigured()) return outcome;

  const { data: rows } = await supabase
    .from("social_posts")
    .select("*")
    .eq("status", "posted");
  const candidates = ((rows ?? []) as SocialPostRow[]).filter(needsBufferBackfill);
  if (candidates.length === 0) return outcome;

  type Need = { post: SocialPostRow; channel: ChannelId; text: string; anchor: number };
  const needs: Need[] = [];
  for (const post of candidates) {
    for (const channel of post.channels ?? []) {
      const result = post.channel_results?.[channel];
      if (result?.status !== "posted" || result.bufferPostId) continue;
      needs.push({
        post,
        channel,
        text: captionFor(post, channel),
        anchor: new Date(result.postedAt).getTime(),
      });
    }
  }

  const { data: connRows } = await supabase
    .from("social_connections")
    .select("channel, external_account_id, status");
  const externalIdFor = new Map(
    (
      (connRows ?? []) as {
        channel: ChannelId;
        external_account_id: string | null;
        status: string;
      }[]
    )
      .filter((c) => c.status === "connected" && c.external_account_id)
      .map((c) => [c.channel, c.external_account_id as string]),
  );

  const byChannel = new Map<ChannelId, Need[]>();
  for (const need of needs) {
    const list = byChannel.get(need.channel) ?? [];
    list.push(need);
    byChannel.set(need.channel, list);
  }

  // One Buffer history fetch per channel, covering every post on it that
  // needs backfilling, rather than one fetch per post.
  for (const [channel, list] of byChannel) {
    const externalAccountId = externalIdFor.get(channel);
    if (!externalAccountId) {
      for (const n of list) {
        outcome.skipped.push({
          title: n.post.title,
          channel,
          reason: `${channel} isn't connected right now, so its Buffer history can't be searched.`,
        });
      }
      continue;
    }

    const earliest = Math.min(...list.map((n) => n.anchor));
    const sinceIso = new Date(earliest - BACKFILL_TOLERANCE_MS).toISOString();
    let sent: Awaited<ReturnType<typeof listSentPosts>>;
    try {
      sent = await listSentPosts(externalAccountId, sinceIso);
    } catch (err) {
      const reason =
        err instanceof Error ? err.message : "Could not read Buffer's post history.";
      for (const n of list) outcome.skipped.push({ title: n.post.title, channel, reason });
      continue;
    }

    for (const need of list) {
      const textMatches = sent.filter((s) => s.text === need.text);
      if (textMatches.length === 0) {
        outcome.skipped.push({
          title: need.post.title,
          channel,
          reason: "No matching caption found in Buffer's history.",
        });
        continue;
      }
      const byCloseness = textMatches
        .map((m) => ({
          match: m,
          delta: m.sentAt ? Math.abs(new Date(m.sentAt).getTime() - need.anchor) : Infinity,
        }))
        .sort((a, b) => a.delta - b.delta);
      const best = byCloseness[0];
      if (best.delta > BACKFILL_TOLERANCE_MS) {
        outcome.skipped.push({
          title: need.post.title,
          channel,
          reason: "Found a matching caption, but not close enough in time to trust it.",
        });
        continue;
      }
      // Two sends of the same caption within tolerance and no clear time
      // winner: rather than risk wiring this post's metrics to the wrong
      // one, leave it for a human to sort out.
      const runnerUp = byCloseness[1];
      if (runnerUp && runnerUp.delta - best.delta < 5 * 60 * 1000) {
        outcome.skipped.push({
          title: need.post.title,
          channel,
          reason: "That caption matched more than one Buffer post around the same time.",
        });
        continue;
      }

      // Re-read right before writing: this can run minutes after the scan
      // above, and must never clobber a result that changed in the meantime
      // (a retry, a fresh publish) with a stale copy.
      const { data: currentRow } = await supabase
        .from("social_posts")
        .select("channel_results")
        .eq("id", need.post.id)
        .maybeSingle();
      const currentResults = (currentRow?.channel_results ?? {}) as Partial<
        Record<ChannelId, ChannelResult>
      >;
      const existing = currentResults[channel];
      if (!existing || existing.bufferPostId) continue;
      await supabase
        .from("social_posts")
        .update({
          channel_results: {
            ...currentResults,
            [channel]: { ...existing, bufferPostId: best.match.id },
          },
        })
        .eq("id", need.post.id);
      outcome.matched += 1;
    }
  }

  return outcome;
}
