"use server";

import { revalidatePath } from "next/cache";
import { randomInt } from "node:crypto";
import { del } from "@vercel/blob";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { isNotSetUp, namesReady } from "@/lib/side-quest";

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

// ------------------------------------------------------------- prize draw

export type DrawWinner = {
  /** Full name when last names are collected, otherwise the first name. */
  name: string;
};

export type DrawResult =
  | { ok: true; winner: DrawWinner; remaining: number }
  | { ok: false; error: string };

/**
 * Draw one winner at random from the eligible players (10 or more points),
 * using the server's cryptographic randomness. Anyone already drawn, winner
 * or skipped, is excluded, so a redraw can never hand back the same person.
 *
 * `skipCurrent` is the redraw: the current winner is marked skipped (they
 * have left, say) before the next draw. The history lives in
 * `side_quest_draws`, so it survives a page reload.
 */
export async function drawWinner(skipCurrent: boolean): Promise<DrawResult> {
  await requireFullAdmin();
  const db = getAdminSupabase();

  const drawn = await db.from("side_quest_draws").select("id, session_id, status");
  if (isNotSetUp(drawn.error)) {
    return {
      ok: false,
      error: "The draw needs the database update (20261007_side_quest_round2.sql).",
    };
  }
  if (drawn.error) return { ok: false, error: "Could not read the draw history." };

  if (skipCurrent) {
    const { error } = await db
      .from("side_quest_draws")
      .update({ status: "skipped" })
      .eq("status", "winner");
    if (error) return { ok: false, error: "Could not skip the current winner." };
  }

  const excluded = new Set((drawn.data ?? []).map((d) => d.session_id as string));
  type Eligible = {
    id: string;
    first_name: string;
    last_name?: string;
    score: number;
    eligible_at: string | null;
  };
  const hasNames = await namesReady();
  const pool: Eligible[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("side_quest_sessions")
      .select(
        hasNames
          ? "id, first_name, last_name, score, eligible_at"
          : "id, first_name, score, eligible_at",
      )
      .eq("prize_eligible", true)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) return { ok: false, error: "Could not read the eligible players." };
    for (const row of (data ?? []) as unknown as Eligible[]) {
      if (!excluded.has(row.id)) pool.push(row);
    }
    if (!data || data.length < PAGE) break;
  }
  if (pool.length === 0) {
    revalidatePath(PATH);
    return { ok: false, error: "Nobody is left to draw." };
  }

  const pick = pool[randomInt(pool.length)];
  const record: Record<string, unknown> = {
    session_id: pick.id,
    first_name: pick.first_name,
    score: pick.score,
    eligible_at: pick.eligible_at,
    status: "winner",
  };
  if (hasNames) record.last_name = pick.last_name ?? "";
  const { error: insertError } = await db
    .from("side_quest_draws")
    .insert(record);
  if (insertError) return { ok: false, error: "Could not record the draw." };

  revalidatePath(PATH);
  return {
    ok: true,
    winner: {
      name: [pick.first_name, pick.last_name].filter(Boolean).join(" "),
    },
    remaining: pool.length - 1,
  };
}

/** Forget every draw, so everyone eligible is back in the pool. */
export async function resetDraws(): Promise<ActionResult> {
  await requireFullAdmin();
  const { error } = await getAdminSupabase()
    .from("side_quest_draws")
    .delete()
    .gt("id", 0);
  if (error) return { ok: false, error: "Could not reset the draw history." };
  revalidatePath(PATH);
  return { ok: true };
}
