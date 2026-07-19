"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { CHANNELS, STATUSES, type ChannelId } from "./shared";

type FormError = { field?: string; message: string };
export type ActionResult = { ok: true } | { ok: false; errors: FormError[] };

const CHANNEL_IDS = CHANNELS.map((c) => c.id);
const STATUS_IDS = STATUSES.map((s) => s.id);

function revalidate(postId?: string) {
  revalidatePath("/admin/socials");
  if (postId) revalidatePath(`/admin/socials/${postId}`);
}

/** Creates an empty draft and jumps straight into its editor. */
export async function createPost(): Promise<void> {
  const { email } = await requireAdmin();
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("social_posts")
    .insert({ created_by: email })
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, errors: [{ message: error.message }] };

  revalidate(id);
  return { ok: true };
}

export async function setStatus(form: FormData): Promise<void> {
  const { email } = await requireAdmin();
  const id = String(form.get("id") ?? "").trim();
  const status = String(form.get("status") ?? "").trim();
  if (!id || !STATUS_IDS.includes(status as (typeof STATUS_IDS)[number])) return;

  const note = String(form.get("note") ?? "").trim() || null;
  const posted = status === "posted";
  const supabase = await getServerSupabase();
  await supabase
    .from("social_posts")
    .update({
      status,
      status_note: note,
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
