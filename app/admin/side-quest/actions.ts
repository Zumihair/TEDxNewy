"use server";

import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getAdminSupabase } from "@/lib/supabase-admin";

/**
 * Side Quest admin actions. All full-admin only, and all through the service
 * client because the side_quest_* tables have RLS on with no policies.
 *
 * Photo points are deliberately never touched here. Hiding or deleting a
 * photo removes it from the wall (and, for delete, from Blob storage), but
 * the completion and its points stay: a player who did the quest keeps the
 * score.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const PATH = "/admin/side-quest";

async function removeBlobs(urls: (string | null | undefined)[]) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const list = urls.filter((u): u is string => !!u);
  if (!token || list.length === 0) return;
  try {
    await del(list, { token });
  } catch (e) {
    // Not fatal: an orphaned file is harmless, the row is what matters.
    console.warn("[admin/side-quest] blob delete failed", e);
  }
}

export async function setPhotoHidden(
  id: string,
  hidden: boolean,
): Promise<ActionResult> {
  await requireFullAdmin();
  const { error } = await getAdminSupabase()
    .from("side_quest_photos")
    .update({ approved: !hidden })
    .eq("id", id);
  if (error) return { ok: false, error: "Could not update that photo." };
  revalidatePath(PATH);
  return { ok: true };
}

export async function deletePhoto(id: string): Promise<ActionResult> {
  await requireFullAdmin();
  const db = getAdminSupabase();
  const { data: row } = await db
    .from("side_quest_photos")
    .select("url, thumb_url")
    .eq("id", id)
    .maybeSingle();
  const { error } = await db.from("side_quest_photos").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete that photo." };
  await removeBlobs([row?.url, row?.thumb_url]);
  revalidatePath(PATH);
  return { ok: true };
}

export type ChallengeInput = {
  id: string;
  title: string;
  description: string;
  points: number;
  active: boolean;
  puzzlePrompt: string;
  /** Empty string keeps the stored answer unchanged. */
  puzzleAnswer: string;
};

export async function saveChallenge(
  input: ChallengeInput,
): Promise<ActionResult> {
  await requireFullAdmin();
  const title = input.title.trim();
  if (!input.id || !title) {
    return { ok: false, error: "A title is needed." };
  }
  const points = Math.round(Number(input.points));
  if (!Number.isFinite(points) || points < 0 || points > 50) {
    return { ok: false, error: "Points should be between 0 and 50." };
  }
  const db = getAdminSupabase();
  const { data: current } = await db
    .from("side_quest_challenges")
    .select("type")
    .eq("id", input.id)
    .maybeSingle();
  if (!current) return { ok: false, error: "That quest was not found." };

  const patch: Record<string, unknown> = {
    title,
    description: input.description.trim(),
    points,
    active: !!input.active,
  };
  if (current.type === "qr") {
    patch.puzzle_prompt = input.puzzlePrompt.trim();
    const answer = input.puzzleAnswer.trim();
    if (answer) patch.puzzle_answer = answer;
  }
  const { error } = await db
    .from("side_quest_challenges")
    .update(patch)
    .eq("id", input.id);
  if (error) return { ok: false, error: "Could not save that quest." };
  revalidatePath(PATH);
  return { ok: true };
}

/**
 * Wipe every session, completion, photo and attempt, ready for a fresh
 * event. Quest definitions (the seeded challenges and puzzles) are kept.
 */
export async function clearAllSessions(): Promise<ActionResult> {
  await requireFullAdmin();
  const db = getAdminSupabase();
  const { data: photos } = await db
    .from("side_quest_photos")
    .select("url, thumb_url");
  const { error } = await db
    .from("side_quest_sessions")
    .delete()
    .not("id", "is", null);
  if (error) return { ok: false, error: "Could not clear the sessions." };
  await removeBlobs(
    (photos ?? []).flatMap((p) => [p.url as string, p.thumb_url as string]),
  );
  revalidatePath(PATH);
  return { ok: true };
}
