"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { syncChannels as bufferSyncChannels } from "@/lib/buffer-social";
import { publishChannel } from "@/lib/social-publish";
import { asStage } from "../stages";
import {
  CHANNELS,
  STATUSES,
  mediaAddError,
  statusFor,
  type ChannelId,
  type MediaType,
} from "./shared";

type FormError = { field?: string; message: string };
export type ActionResult = { ok: true } | { ok: false; errors: FormError[] };

const CHANNEL_IDS = CHANNELS.map((c) => c.id);
const STATUS_IDS = STATUSES.map((s) => s.id);

function revalidate(postId?: string) {
  revalidatePath("/admin/socials");
  if (postId) revalidatePath(`/admin/socials/${postId}`);
}

/** Creates an empty draft (all channels on) and jumps straight into its editor. */
export async function createPost(): Promise<void> {
  const { email } = await requireAdmin();
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("social_posts")
    .insert({ created_by: email, channels: CHANNEL_IDS })
    .select("id")
    .single();
  if (error || !data) redirect("/admin/socials?error=create");
  revalidate();
  redirect(`/admin/socials/${data.id}`);
}

export async function updatePost(
  _prev: unknown,
  form: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(form.get("id") ?? "").trim();
  if (!id) return { ok: false, errors: [{ message: "Missing post id." }] };

  const title = String(form.get("title") ?? "").trim();
  if (!title) {
    return { ok: false, errors: [{ field: "title", message: "Give the post a title." }] };
  }

  const channels = form
    .getAll("channels")
    .map(String)
    .filter((c): c is ChannelId => (CHANNEL_IDS as string[]).includes(c));

  const channelCaptions: Partial<Record<ChannelId, string>> = {};
  for (const c of CHANNEL_IDS) {
    const v = String(form.get(`caption_${c}`) ?? "").trim();
    if (v) channelCaptions[c] = v;
  }

  const publishAt = String(form.get("publish_at") ?? "").trim() || null;
  if (publishAt && Number.isNaN(Date.parse(publishAt))) {
    return {
      ok: false,
      errors: [{ field: "publish_at", message: "That date and time is not valid." }],
    };
  }

  const supabase = await getServerSupabase();

  // Status follows the date, so saving a post is what moves it between the
  // Drafts and Scheduled tabs. Posted is terminal and never reopened here.
  const { data: current } = await supabase
    .from("social_posts")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  const status = statusFor({
    publishAt,
    posted: current?.status === "posted",
  });

  const { error } = await supabase
    .from("social_posts")
    .update({
      title,
      caption: String(form.get("caption") ?? ""),
      channel_captions: channelCaptions,
      channels,
      publish_at: publishAt,
      status,
      status_note: String(form.get("notes") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, errors: [{ message: error.message }] };

  // Let the scheduler look at this post again. It settles a post it can do
  // no more with (lib/social-publish.ts), and an edit is exactly what can
  // make it actionable again: a new date, a channel added, a caption trimmed
  // under the limit.
  //
  // Two things about this being its own statement rather than a field on the
  // save above. It is best-effort: 20260818c_social_autopublish.sql is
  // applied by hand, so between deploying and running it this column does
  // not exist, and an admin must still be able to save a post. And the
  // in-flight claim is deliberately NOT cleared: a save landing mid-publish
  // would hand the post to the next pass while Buffer was still being
  // called, which is the one window that could double-post.
  await supabase
    .from("social_posts")
    .update({ autopublish_done_at: null })
    .eq("id", id);

  revalidate(id);
  return { ok: true };
}

/** Sets the editorial stage (early / polish / ready). Nothing else moves:
 * the lifecycle status still follows the planned date. */
export async function setStage(form: FormData): Promise<void> {
  await requireAdmin();
  const id = String(form.get("id") ?? "").trim();
  if (!id) return;
  const stage = asStage(form.get("stage"));
  const supabase = await getServerSupabase();
  await supabase
    .from("social_posts")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidate(id);
}

/**
 * Wipes the schedule date off a post, putting it straight back in Drafts.
 *
 * Status stays derived (`statusFor`) rather than hardcoded, so this can't
 * drift from what saving the form would produce. Posted is terminal: clearing
 * a date must never reopen a post that has already gone out.
 */
export async function clearSchedule(form: FormData): Promise<void> {
  await requireAdmin();
  const id = String(form.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await getServerSupabase();
  const { data: current } = await supabase
    .from("social_posts")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (current?.status === "posted") return;

  await supabase
    .from("social_posts")
    .update({
      publish_at: null,
      status: statusFor({ publishAt: null, posted: false }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidate(id);
}

/** Sets the lifecycle status directly. Only "Mark as posted" uses this now;
 * draft vs scheduled is derived from the planned date in updatePost. Leaves
 * status_note alone — notes are edited from the main Post form. */
export async function setStatus(form: FormData): Promise<void> {
  const { email } = await requireAdmin();
  const id = String(form.get("id") ?? "").trim();
  const status = String(form.get("status") ?? "").trim();
  if (!id || !STATUS_IDS.includes(status as (typeof STATUS_IDS)[number])) return;

  const posted = status === "posted";
  const supabase = await getServerSupabase();
  await supabase
    .from("social_posts")
    .update({
      status,
      posted_at: posted ? new Date().toISOString() : null,
      posted_by: posted ? email : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidate(id);
}

/**
 * Copies a post (title, caption, per-channel overrides, channels and media)
 * into a brand-new draft, with no schedule date and stage reset to "early".
 * The usual route out of a posted item: reuse it for a re-run rather than
 * editing the original, which is locked once it has gone out.
 */
export async function duplicatePost(form: FormData): Promise<void> {
  const { email } = await requireAdmin();
  const id = String(form.get("id") ?? "").trim();
  if (!id) redirect("/admin/socials");

  const supabase = await getServerSupabase();
  const { data: src, error } = await supabase
    .from("social_posts")
    .select("title, caption, channel_captions, channels")
    .eq("id", id)
    .maybeSingle();
  if (error || !src) redirect("/admin/socials");

  const { data: created, error: insErr } = await supabase
    .from("social_posts")
    .insert({
      title: `Copy of ${src.title ?? "Untitled post"}`,
      caption: src.caption ?? "",
      channel_captions: src.channel_captions ?? {},
      channels: src.channels ?? CHANNEL_IDS,
      created_by: email,
    })
    .select("id")
    .single();
  if (insErr || !created) redirect("/admin/socials");

  const { data: media } = await supabase
    .from("social_post_media")
    .select("display_order, image_url, media_type, source_image_url, spec")
    .eq("post_id", id)
    .order("display_order", { ascending: true });
  if (media && media.length > 0) {
    await supabase
      .from("social_post_media")
      .insert(media.map((m) => ({ ...m, post_id: created.id })));
  }

  revalidate();
  redirect(`/admin/socials/${created.id}`);
}

export async function deletePost(form: FormData): Promise<void> {
  await requireAdmin();
  const id = String(form.get("id") ?? "").trim();
  if (!id) return;
  const supabase = await getServerSupabase();
  await supabase.from("social_posts").delete().eq("id", id);
  revalidate();
  redirect("/admin/socials?deleted=1");
}

/**
 * Records an already-uploaded image or video against a post. The upload itself
 * happens client-side (browser Supabase client into the cms-uploads bucket,
 * like ImageUploadField); this just writes the row.
 *
 * Refuses a video alongside images, and a second video, because that is what
 * the platforms accept (see `mediaAddError`). Checked here rather than only in
 * the editor, so the rule holds however the action is called.
 */
export async function addMedia(form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const postId = String(form.get("post_id") ?? "").trim();
  const imageUrl = String(form.get("image_url") ?? "").trim();
  const kind: MediaType =
    String(form.get("media_type") ?? "") === "video" ? "video" : "image";
  if (!postId || !imageUrl) {
    return { ok: false, errors: [{ message: "Missing media details." }] };
  }

  let spec: unknown = null;
  const rawSpec = String(form.get("spec") ?? "").trim();
  if (rawSpec) {
    try {
      spec = JSON.parse(rawSpec);
    } catch {
      return { ok: false, errors: [{ message: "Bad design data." }] };
    }
  }

  const supabase = await getServerSupabase();
  // select("*") so a missing media_type column (migration not applied yet)
  // can't fail the read; mediaAddError treats those rows as images.
  const { data: existing } = await supabase
    .from("social_post_media")
    .select("*")
    .eq("post_id", postId)
    .order("display_order", { ascending: false });

  const clash = mediaAddError(existing ?? [], kind);
  if (clash) return { ok: false, errors: [{ message: clash }] };

  const nextOrder = (existing?.[0]?.display_order ?? 0) + 10;

  const { error } = await supabase.from("social_post_media").insert({
    post_id: postId,
    display_order: nextOrder,
    image_url: imageUrl,
    media_type: kind,
    source_image_url:
      String(form.get("source_image_url") ?? "").trim() || null,
    spec,
  });
  if (error) return { ok: false, errors: [{ message: error.message }] };

  revalidate(postId);
  return { ok: true };
}

/** Overwrites a media row after re-editing its design in the studio. */
export async function updateMedia(form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(form.get("media_id") ?? "").trim();
  const postId = String(form.get("post_id") ?? "").trim();
  const imageUrl = String(form.get("image_url") ?? "").trim();
  if (!id || !postId || !imageUrl) {
    return { ok: false, errors: [{ message: "Missing image details." }] };
  }

  let spec: unknown = null;
  const rawSpec = String(form.get("spec") ?? "").trim();
  if (rawSpec) {
    try {
      spec = JSON.parse(rawSpec);
    } catch {
      return { ok: false, errors: [{ message: "Bad design data." }] };
    }
  }

  const patch: Record<string, unknown> = { image_url: imageUrl, spec };
  const sourceUrl = String(form.get("source_image_url") ?? "").trim();
  if (sourceUrl) patch.source_image_url = sourceUrl;

  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("social_post_media")
    .update(patch)
    .eq("id", id);
  if (error) return { ok: false, errors: [{ message: error.message }] };

  revalidate(postId);
  return { ok: true };
}

/**
 * Copies a media row so a second graphic can start from the same baseline.
 * The copy shares the same files (render, source photo) and spec; editing the
 * copy in the studio re-renders and uploads fresh files, so the two diverge
 * from there.
 */
export async function duplicateMedia(form: FormData): Promise<void> {
  await requireAdmin();
  const id = String(form.get("media_id") ?? "").trim();
  const postId = String(form.get("post_id") ?? "").trim();
  if (!id || !postId) return;

  const supabase = await getServerSupabase();
  const { data: row } = await supabase
    .from("social_post_media")
    .select("post_id, image_url, source_image_url, spec")
    .eq("id", id)
    .maybeSingle();
  if (!row) return;

  const { data: last } = await supabase
    .from("social_post_media")
    .select("display_order")
    .eq("post_id", postId)
    .order("display_order", { ascending: false })
    .limit(1);
  const nextOrder = (last?.[0]?.display_order ?? 0) + 10;

  await supabase
    .from("social_post_media")
    .insert({ ...row, display_order: nextOrder });
  revalidate(postId);
}

export async function deleteMedia(form: FormData): Promise<void> {
  await requireAdmin();
  const id = String(form.get("media_id") ?? "").trim();
  const postId = String(form.get("post_id") ?? "").trim();
  if (!id) return;
  const supabase = await getServerSupabase();
  await supabase.from("social_post_media").delete().eq("id", id);
  revalidate(postId);
}

/** Moves a media item one step up or down in the carousel order. */
export async function moveMedia(form: FormData): Promise<void> {
  await requireAdmin();
  const id = String(form.get("media_id") ?? "").trim();
  const postId = String(form.get("post_id") ?? "").trim();
  const dir = String(form.get("dir") ?? "");
  if (!id || !postId || (dir !== "up" && dir !== "down")) return;

  const supabase = await getServerSupabase();
  const { data: rows } = await supabase
    .from("social_post_media")
    .select("id")
    .eq("post_id", postId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (!rows || rows.length < 2) return;

  const idx = rows.findIndex((r) => r.id === id);
  const swapWith = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapWith < 0 || swapWith >= rows.length) return;

  const order = rows.map((r) => r.id);
  [order[idx], order[swapWith]] = [order[swapWith], order[idx]];
  for (let i = 0; i < order.length; i++) {
    await supabase
      .from("social_post_media")
      .update({ display_order: (i + 1) * 10 })
      .eq("id", order[i]);
  }
  revalidate(postId);
}

// ---- Buffer connections ----
//
// Channels are connected inside Buffer's own dashboard, not here — this just
// reads Buffer's channel list back and matches each to instagram/facebook/
// linkedin. No OAuth redirect or polling needed since it's a synchronous API
// call, unlike the old Composio flow.

export type SyncChannelResults = Partial<
  Record<ChannelId, "connected" | "needs_pick" | "missing">
>;

export type SyncChannelsResult =
  | { ok: true; results: SyncChannelResults }
  | { ok: false; error: string };

export async function syncChannels(): Promise<SyncChannelsResult> {
  const { email } = await requireAdmin();
  try {
    const synced = await bufferSyncChannels();
    const supabase = await getServerSupabase();
    const results: SyncChannelResults = {};

    for (const channel of CHANNEL_IDS) {
      const outcome = synced[channel];
      if (!outcome || outcome.status === "missing") {
        // Not (or no longer) connected in Buffer — clear any stale row
        // instead of leaving whatever status was there before.
        await supabase.from("social_connections").upsert({
          channel,
          status: "disconnected",
          external_account_id: null,
          external_account_name: null,
          pending_candidates: null,
        });
        results[channel] = "missing";
        continue;
      }
      if (outcome.status === "needsPick") {
        await supabase.from("social_connections").upsert({
          channel,
          status: "needs_pick",
          pending_candidates: outcome.candidates,
        });
        results[channel] = "needs_pick";
        continue;
      }
      await supabase.from("social_connections").upsert({
        channel,
        status: "connected",
        external_account_id: outcome.externalAccountId,
        external_account_name: outcome.externalAccountName,
        pending_candidates: null,
        connected_at: new Date().toISOString(),
        connected_by: email,
      });
      results[channel] = "connected";
    }
    revalidatePath("/admin/socials");
    return { ok: true, results };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not sync from Buffer.",
    };
  }
}

export type PickAccountResult = { ok: true } | { ok: false; error: string };

/** Finishes a needs_pick connection once the admin has chosen which
 * Page/org from pending_candidates is TEDxNewy's. */
export async function pickConnectionAccount(
  channel: ChannelId,
  accountId: string,
): Promise<PickAccountResult> {
  const { email } = await requireAdmin();
  const supabase = await getServerSupabase();
  const { data: row } = await supabase
    .from("social_connections")
    .select("pending_candidates")
    .eq("channel", channel)
    .maybeSingle();
  const candidates = (row?.pending_candidates ?? []) as Array<{
    id: string;
    name: string | null;
  }>;
  const picked = candidates.find((c) => c.id === accountId);
  if (!picked) return { ok: false, error: "That option is no longer available." };

  await supabase
    .from("social_connections")
    .update({
      status: "connected",
      external_account_id: picked.id,
      external_account_name: picked.name,
      pending_candidates: null,
      connected_at: new Date().toISOString(),
      connected_by: email,
    })
    .eq("channel", channel);
  revalidatePath("/admin/socials");
  return { ok: true };
}

// ---- publishing ----

export type PublishActionResult =
  | { ok: true; permalink: string | null }
  | { ok: false; error: string };

/**
 * Publishes one channel of a post for real, via Buffer, because somebody
 * pressed the button.
 *
 * The work itself lives in lib/social-publish.ts, shared with the cron that
 * sends scheduled posts. All this adds is the admin session: who is asking,
 * and the RLS-bound client they get to use.
 *
 * `skipIfPosted` is deliberately not set. The editor offers "Publish again"
 * on a channel that already went out, and that stays a thing a human can
 * choose to do; it is only the scheduler that must never repeat itself.
 */
export async function publishToChannel(
  postId: string,
  channel: ChannelId,
): Promise<PublishActionResult> {
  const { email } = await requireAdmin();
  const supabase = await getServerSupabase();

  const result = await publishChannel({
    supabase,
    postId,
    channel,
    actor: email,
    via: "manual",
  });

  revalidate(postId);
  return result;
}
