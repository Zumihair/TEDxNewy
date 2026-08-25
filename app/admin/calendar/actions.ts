"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { applyDayKeepingSydneyTime, isDayKey, sydneyDateKey, todayKey } from "./dates";

/**
 * Calendar note actions.
 *
 * `requireAdmin()`, not `requireFullAdmin()`: the calendar is a Community
 * page and notes are shared planning context, so both access levels can
 * write them (see COMMUNITY_PREFIXES in app/admin/access.ts).
 *
 * Notes touch nothing else. There is no join to a social post, newsletter
 * or event, and no other reader of `calendar_notes`, so these actions can
 * never disturb something that is scheduled to go out.
 */

function clean(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export type NoteResult = { ok: true } | { ok: false; error: string };

export async function saveNote(formData: FormData): Promise<NoteResult> {
  await requireAdmin();

  const id = clean(formData.get("id"));
  const day = clean(formData.get("day"));
  const title = clean(formData.get("title"));
  const body = clean(formData.get("body"));

  if (!title) return { ok: false, error: "Give the note a title." };
  // Guard the shape here as well as in the date input: a hand-posted or
  // malformed value would otherwise reach Postgres as an invalid date and
  // surface as a raw driver error.
  if (!isDayKey(day)) return { ok: false, error: "Pick a valid date." };

  const supabase = await getServerSupabase();
  const row = { day, title, body: body || null, updated_at: new Date().toISOString() };

  const { error } = id
    ? await supabase.from("calendar_notes").update(row).eq("id", id)
    : await supabase.from("calendar_notes").insert(row);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/calendar");
  return { ok: true };
}

export type MoveKind = "note" | "social" | "newsletter";
export type MoveResult = { ok: true } | { ok: false; error: string };

/**
 * Drag-and-drop: move a calendar item to a different day, keeping its time
 * of day. A note just moves. A social post or newsletter is rescheduled —
 * `publish_at` / `scheduled_at` shift day via `applyDayKeepingSydneyTime`,
 * which is what actually changes when the post/send goes out.
 *
 * Both ends are guarded server-side, not just by the board hiding the drag
 * handle: nothing already sent/posted can move (checked against the anchor
 * field the board itself uses, `posted_at`/`sent_at`, re-read fresh so a
 * send that completed mid-drag can't be rescheduled out from under itself),
 * and nothing can land in the past.
 */
export async function moveCalendarItem(
  kind: MoveKind,
  id: string,
  newDay: string,
): Promise<MoveResult> {
  await requireAdmin();
  if (!id) return { ok: false, error: "Missing item." };
  if (!isDayKey(newDay)) return { ok: false, error: "Invalid date." };
  const today = todayKey();
  if (newDay < today) return { ok: false, error: "Can't move something into the past." };

  const supabase = await getServerSupabase();

  if (kind === "note") {
    const { data, error } = await supabase
      .from("calendar_notes")
      .update({ day: newDay, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id");
    if (error) return { ok: false, error: error.message };
    if (!data || data.length === 0) return { ok: false, error: "Note not found." };
    revalidatePath("/admin/calendar");
    return { ok: true };
  }

  const table = kind === "social" ? "social_posts" : "newsletters";
  const scheduleCol = kind === "social" ? "publish_at" : "scheduled_at";
  const terminalCol = kind === "social" ? "posted_at" : "sent_at";

  const { data: row, error: readErr } = await supabase
    .from(table)
    .select(`id, ${scheduleCol}, ${terminalCol}`)
    .eq("id", id)
    .maybeSingle();
  if (readErr) return { ok: false, error: readErr.message };
  if (!row) return { ok: false, error: "Not found." };
  const current = (row as Record<string, unknown>)[scheduleCol] as string | null;
  const terminal = (row as Record<string, unknown>)[terminalCol] as string | null;
  if (terminal) return { ok: false, error: "Already sent — can't reschedule." };
  if (!current) return { ok: false, error: "Nothing scheduled to move." };
  if (sydneyDateKey(current) < today) {
    return { ok: false, error: "Can't move something already past." };
  }

  const newIso = applyDayKeepingSydneyTime(current, newDay);
  const { error } = await supabase.from(table).update({ [scheduleCol]: newIso }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/calendar");
  return { ok: true };
}

export async function deleteNote(id: string): Promise<NoteResult> {
  await requireAdmin();
  if (!id) return { ok: false, error: "Missing note." };

  const supabase = await getServerSupabase();
  // `.select()` so we can see what was actually removed. A delete blocked by
  // RLS comes back with NO error and zero rows, which is how a previous admin
  // delete silently no-opped for weeks; reporting that as a failure is the
  // difference between noticing and not.
  const { data, error } = await supabase
    .from("calendar_notes")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return {
      ok: false,
      error: "Nothing was deleted. The note may already be gone, or the migration may not be applied.",
    };
  }

  revalidatePath("/admin/calendar");
  return { ok: true };
}
