"use server";

import { revalidatePath } from "next/cache";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { STANDARD_CHECKLIST, asStage, type ItemKind } from "../shared";

// The bench calls these directly (not through a <form action>), so each one
// answers with a result for a toast instead of redirecting.
export type BenchResult = { ok: true } | { ok: false; error: string };

const KINDS: ItemKind[] = ["question", "task", "budget", "link"];
const benchPath = (grantId: string) => `/admin/grants/${grantId}`;
const fail = (error: string): BenchResult => ({ ok: false, error });

export type ItemFields = {
  title?: string;
  body?: string | null;
  word_limit?: number | null;
  amount?: number | null;
  url?: string | null;
  done?: boolean;
  due_on?: string | null;
  owner?: string | null;
};

/** Only the fields an item can carry, tidied: blank strings become null. */
function clean(f: ItemFields) {
  const out: Record<string, unknown> = {};
  if (f.title !== undefined) out.title = f.title.trim();
  if (f.body !== undefined) out.body = f.body?.trim() ? f.body : null;
  if (f.word_limit !== undefined) out.word_limit = f.word_limit && f.word_limit > 0 ? Math.round(f.word_limit) : null;
  if (f.amount !== undefined) out.amount = f.amount == null || Number.isNaN(f.amount) ? null : f.amount;
  if (f.url !== undefined) out.url = f.url?.trim() || null;
  if (f.done !== undefined) out.done = f.done;
  if (f.due_on !== undefined) out.due_on = f.due_on && /^\d{4}-\d{2}-\d{2}$/.test(f.due_on) ? f.due_on : null;
  if (f.owner !== undefined) out.owner = f.owner?.trim() || null;
  return out;
}

async function nextPosition(grantId: string, kind: ItemKind): Promise<number> {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("grant_items")
    .select("position")
    .eq("grant_id", grantId)
    .eq("kind", kind)
    .order("position", { ascending: false })
    .limit(1);
  return ((data?.[0]?.position as number | undefined) ?? 0) + 1;
}

export async function addItem(grantId: string, kind: ItemKind, fields: ItemFields): Promise<BenchResult> {
  await requireFullAdmin();
  if (!KINDS.includes(kind)) return fail("Unknown item type.");
  const row = clean(fields);
  if (!row.title) return fail("Give it a name first.");
  const supabase = await getServerSupabase();
  const position = await nextPosition(grantId, kind);
  const { error } = await supabase.from("grant_items").insert({ ...row, grant_id: grantId, kind, position });
  if (error) return fail("Could not add that. Try again.");
  revalidatePath(benchPath(grantId));
  return { ok: true };
}

export async function updateItem(grantId: string, id: string, fields: ItemFields): Promise<BenchResult> {
  await requireFullAdmin();
  const row = clean(fields);
  if (row.title === "") return fail("It needs a name.");
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("grant_items")
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("grant_id", grantId)
    .select("id");
  if (error || !data?.length) return fail("Could not save that. Try again.");
  revalidatePath(benchPath(grantId));
  return { ok: true };
}

export async function deleteItem(grantId: string, id: string): Promise<BenchResult> {
  await requireFullAdmin();
  const supabase = await getServerSupabase();
  // An RLS-blocked delete returns no error and no rows, so count what went.
  const { data, error } = await supabase.from("grant_items").delete().eq("id", id).eq("grant_id", grantId).select("id");
  if (error || !data?.length) return fail("Could not remove that.");
  revalidatePath(benchPath(grantId));
  return { ok: true };
}

export async function addStandardChecklist(grantId: string): Promise<BenchResult> {
  await requireFullAdmin();
  const supabase = await getServerSupabase();
  const start = await nextPosition(grantId, "task");
  const rows = STANDARD_CHECKLIST.map((title, i) => ({ grant_id: grantId, kind: "task", title, position: start + i }));
  const { error } = await supabase.from("grant_items").insert(rows);
  if (error) return fail("Could not add the checklist.");
  revalidatePath(benchPath(grantId));
  return { ok: true };
}

export async function saveGrantNotes(grantId: string, notes: string): Promise<BenchResult> {
  await requireFullAdmin();
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("grant_applications")
    .update({ notes: notes.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", grantId);
  if (error) return fail("Could not save the notes.");
  revalidatePath(benchPath(grantId));
  return { ok: true };
}

export async function setGrantStage(grantId: string, stage: string): Promise<BenchResult> {
  await requireFullAdmin();
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("grant_applications")
    .update({ stage: asStage(stage), updated_at: new Date().toISOString() })
    .eq("id", grantId);
  if (error) return fail("Could not move the grant.");
  revalidatePath(benchPath(grantId));
  revalidatePath("/admin/grants");
  return { ok: true };
}
