"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { sydneyToday } from "../shared";
import type { BenchResult } from "../[id]/actions";
import { LIBRARY_BUCKET, asFileKind, asLetterStatus, asLetterType } from "./shared";

const BACK = "/admin/grants/library";
const UUID = /^[0-9a-f-]{36}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim() || null;
const date = (formData: FormData, key: string) => {
  const v = String(formData.get(key) ?? "").trim();
  return DATE.test(v) ? v : null;
};
const fail = (error: string): BenchResult => ({ ok: false, error });

/** Every page that shows letters or files: the library, the board and each bench. */
function refresh() {
  revalidatePath(BACK);
  revalidatePath("/admin/grants");
  revalidatePath("/admin/grants/[id]", "page");
}

type LinkTable = "grant_letter_links" | "grant_file_links";

/** Make the set of grants linked to a letter or file match what the form ticked. */
async function syncLinks(table: LinkTable, col: "letter_id" | "file_id", ownerId: string, ticked: FormDataEntryValue[]) {
  const supabase = await getServerSupabase();
  const wanted = Array.from(new Set(ticked.map(String).filter((g) => UUID.test(g))));
  const { data: have } = await supabase.from(table).select("grant_id").eq(col, ownerId);
  const haveIds = new Set((have ?? []).map((r) => r.grant_id as string));
  const add = wanted.filter((g) => !haveIds.has(g));
  const drop = Array.from(haveIds).filter((g) => !wanted.includes(g));
  if (add.length) await supabase.from(table).insert(add.map((grant_id) => ({ grant_id, [col]: ownerId })));
  if (drop.length) await supabase.from(table).delete().eq(col, ownerId).in("grant_id", drop);
}

// ---- Reference letters ----

export async function saveLetter(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  const today = sydneyToday();
  const status = asLetterStatus(formData.get("status"));
  const row = {
    referee: String(formData.get("referee") ?? "").trim(),
    role: text(formData, "role"),
    letter_type: asLetterType(formData.get("letter_type")),
    status,
    asked_on: date(formData, "asked_on") ?? (status === "asked" || status === "drafting" ? today : null),
    due_on: date(formData, "due_on"),
    received_on: status === "received" ? (date(formData, "received_on") ?? today) : null,
    file_url: text(formData, "file_url"),
    file_name: text(formData, "file_name"),
    storage_path: text(formData, "storage_path"),
    notes: text(formData, "notes"),
    updated_at: new Date().toISOString(),
  };
  if (!row.referee) redirect(`${BACK}?error=name`);

  const supabase = await getServerSupabase();
  let letterId = id;
  if (id) {
    const { data, error } = await supabase.from("grant_letters").update(row).eq("id", id).select("id");
    if (error || !data?.length) redirect(`${BACK}?error=failed`);
  } else {
    const { data, error } = await supabase.from("grant_letters").insert(row).select("id").single();
    if (error || !data) redirect(`${BACK}?error=failed`);
    letterId = data.id as string;
  }
  await syncLinks("grant_letter_links", "letter_id", letterId, formData.getAll("grant_id"));
  refresh();
  redirect(`${BACK}?saved=1`);
}

export async function deleteLetter(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) redirect(`${BACK}?error=delete`);
  const supabase = await getServerSupabase();
  const { data: row } = await supabase.from("grant_letters").select("storage_path").eq("id", id).maybeSingle();
  // An RLS-blocked delete returns no error and no rows, so count what went.
  const { data, error } = await supabase.from("grant_letters").delete().eq("id", id).select("id");
  if (error || !data?.length) redirect(`${BACK}?error=delete`);
  // The row is gone; an orphaned file is harmless if this fails.
  if (row?.storage_path) await supabase.storage.from(LIBRARY_BUCKET).remove([row.storage_path as string]);
  refresh();
  redirect(`${BACK}?deleted=1`);
}

/** Move a letter along (To ask, Asked, Drafting, Received), stamping the dates the board shows. */
export async function setLetterStatus(letterId: string, status: string): Promise<BenchResult> {
  await requireFullAdmin();
  if (!UUID.test(letterId)) return fail("Could not find that letter.");
  const next = asLetterStatus(status);
  const today = sydneyToday();
  const supabase = await getServerSupabase();
  const { data: current } = await supabase.from("grant_letters").select("asked_on, received_on").eq("id", letterId).maybeSingle();
  if (!current) return fail("Could not find that letter.");
  const patch: Record<string, unknown> = { status: next, updated_at: new Date().toISOString() };
  if ((next === "asked" || next === "drafting") && !current.asked_on) patch.asked_on = today;
  patch.received_on = next === "received" ? (current.received_on ?? today) : null;
  const { data, error } = await supabase.from("grant_letters").update(patch).eq("id", letterId).select("id");
  if (error || !data?.length) return fail("Could not change that. Try again.");
  refresh();
  return { ok: true };
}

// ---- Evidence files ----

export async function saveFile(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  const row = {
    title: String(formData.get("title") ?? "").trim(),
    kind: asFileKind(formData.get("kind")),
    file_url: text(formData, "file_url"),
    file_name: text(formData, "file_name"),
    storage_path: text(formData, "storage_path"),
    dated_on: date(formData, "dated_on"),
    expires_on: date(formData, "expires_on"),
    notes: text(formData, "notes"),
    updated_at: new Date().toISOString(),
  };
  if (!row.title) redirect(`${BACK}?error=name`);

  const supabase = await getServerSupabase();
  let fileId = id;
  if (id) {
    const { data, error } = await supabase.from("grant_files").update(row).eq("id", id).select("id");
    if (error || !data?.length) redirect(`${BACK}?error=failed`);
  } else {
    const { data, error } = await supabase.from("grant_files").insert(row).select("id").single();
    if (error || !data) redirect(`${BACK}?error=failed`);
    fileId = data.id as string;
  }
  await syncLinks("grant_file_links", "file_id", fileId, formData.getAll("grant_id"));
  refresh();
  redirect(`${BACK}?saved=1`);
}

export async function deleteFile(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) redirect(`${BACK}?error=delete`);
  const supabase = await getServerSupabase();
  const { data: row } = await supabase.from("grant_files").select("storage_path").eq("id", id).maybeSingle();
  const { data, error } = await supabase.from("grant_files").delete().eq("id", id).select("id");
  if (error || !data?.length) redirect(`${BACK}?error=delete`);
  if (row?.storage_path) await supabase.storage.from(LIBRARY_BUCKET).remove([row.storage_path as string]);
  refresh();
  redirect(`${BACK}?deleted=1`);
}

// ---- Attaching to a grant, from its bench ----

async function link(table: LinkTable, col: "letter_id" | "file_id", grantId: string, ownerId: string): Promise<BenchResult> {
  await requireFullAdmin();
  if (!UUID.test(grantId) || !UUID.test(ownerId)) return fail("Could not attach that.");
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from(table)
    .upsert({ grant_id: grantId, [col]: ownerId }, { onConflict: `grant_id,${col}`, ignoreDuplicates: true });
  if (error) return fail("Could not attach that. Try again.");
  refresh();
  return { ok: true };
}

async function unlink(table: LinkTable, col: "letter_id" | "file_id", grantId: string, ownerId: string): Promise<BenchResult> {
  await requireFullAdmin();
  if (!UUID.test(grantId) || !UUID.test(ownerId)) return fail("Could not remove that.");
  const supabase = await getServerSupabase();
  // An RLS-blocked delete returns no error and no rows, so count what went.
  const { data, error } = await supabase.from(table).delete().eq("grant_id", grantId).eq(col, ownerId).select("grant_id");
  if (error || !data?.length) return fail("Could not remove that.");
  refresh();
  return { ok: true };
}

export async function attachLetter(grantId: string, letterId: string): Promise<BenchResult> {
  return link("grant_letter_links", "letter_id", grantId, letterId);
}
export async function detachLetter(grantId: string, letterId: string): Promise<BenchResult> {
  return unlink("grant_letter_links", "letter_id", grantId, letterId);
}
export async function attachFile(grantId: string, fileId: string): Promise<BenchResult> {
  return link("grant_file_links", "file_id", grantId, fileId);
}
export async function detachFile(grantId: string, fileId: string): Promise<BenchResult> {
  return unlink("grant_file_links", "file_id", grantId, fileId);
}
