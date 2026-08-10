"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { publish, syncChannels as bufferSyncChannels } from "@/lib/buffer-social";
import {
  CHANNELS,
  STATUSES,
  captionFor,
  type ChannelId,
  type ChannelResult,
  type SocialPostRow,
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
  const { error } = await supabase
    .from("social_posts")
    .update({
      title,
      caption: String(form.get("caption") ?? ""),
      channel_captions: channelCaptions,
      channels,
      publish_at: publishAt,
      status_note: String(form.get("notes") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, errors: [{ message: error.message }] };

  revalidate(id);
  return { ok: true };
}

/** Toggles between statuses (draft/scheduled/posted). Leaves status_note
 * alone — notes are edited from the main Post form (updatePost) now,
 * independent of the status workflow. */
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
 * Records an already-uploaded image against a post. The upload itself happens
 * client-side (browser Supabase client into the cms-uploads bucket, like
 * ImageUploadField); this just writes the row.
 */
export async function addMedia(form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const postId = String(form.get("post_id") ?? "").trim();
  const imageUrl = String(form.get("image_url") ?? "").trim();
  if (!postId || !imageUrl) {
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

  const supabase = await getServerSupabase();
  const { data: rows } = await supabase
    .from("social_post_media")
    .select("display_order")
    .eq("post_id", postId)
    .order("display_order", { ascending: false })
    .limit(1);
  const nextOrder = (rows?.[0]?.display_order ?? 0) + 10;

  const { error } = await supabase.from("social_post_media").insert({
    post_id: postId,
    display_order: nextOrder,
    image_url: imageUrl,
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

/** Publishes one channel of a post for real, via Buffer. Records the
 * outcome in channel_results and flips the post to Posted once every
 * selected channel has succeeded. */
export async function publishToChannel(
  postId: string,
  channel: ChannelId,
): Promise<PublishActionResult> {
  const { email } = await requireAdmin();
  const supabase = await getServerSupabase();

  const { data: connection } = await supabase
    .from("social_connections")
    .select("external_account_id, status")
    .eq("channel", channel)
    .maybeSingle();
  if (!connection || connection.status !== "connected" || !connection.external_account_id) {
    return { ok: false, error: `${channel} isn't connected yet.` };
  }

  const { data: postRow } = await supabase
    .from("social_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();
  if (!postRow) return { ok: false, error: "Post not found." };
  const post = postRow as SocialPostRow;

  const { data: mediaRows } = await supabase
    .from("social_post_media")
    .select("image_url")
    .eq("post_id", postId)
    .order("display_order", { ascending: true });
  const imageUrls = (mediaRows ?? []).map((m) => m.image_url as string);

  const result = await publish({
    channelId: connection.external_account_id,
    caption: captionFor(post, channel),
    imageUrls,
  });

  const channelResult: ChannelResult = result.ok
    ? {
        status: "posted",
        permalink: result.permalink,
        postedAt: new Date().toISOString(),
        error: null,
      }
    : {
        status: "failed",
        permalink: null,
        postedAt: new Date().toISOString(),
        error: result.error,
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
    patch.posted_by = email;
  }
  await supabase.from("social_posts").update(patch).eq("id", postId);

  revalidate(postId);
  return result.ok
    ? { ok: true, permalink: result.permalink }
    : { ok: false, error: result.error };
}
