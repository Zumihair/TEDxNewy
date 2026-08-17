"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { isDayKey } from "./dates";

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
