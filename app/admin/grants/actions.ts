"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { asStage } from "./shared";

const BACK = "/admin/grants";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim() || null;

function amount(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").replace(/[^0-9.]/g, "");
  return raw ? Number(raw) || null : null;
}

function fields(formData: FormData) {
  const closes = String(formData.get("closes_on") ?? "").trim();
  return {
    name: String(formData.get("name") ?? "").trim(),
    funder: text(formData, "funder"),
    url: text(formData, "url"),
    stage: asStage(formData.get("stage")),
    project: text(formData, "project"),
    owner: text(formData, "owner"),
    amount_min: amount(formData, "amount_min"),
    amount_max: amount(formData, "amount_max"),
    amount_requested: amount(formData, "amount_requested"),
    amount_awarded: amount(formData, "amount_awarded"),
    closes_on: /^\d{4}-\d{2}-\d{2}$/.test(closes) ? closes : null,
    closes_note: text(formData, "closes_note"),
    decision_note: text(formData, "decision_note"),
    notes: text(formData, "notes"),
    updated_at: new Date().toISOString(),
  };
}

export async function saveGrant(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  const row = fields(formData);
  if (!row.name) redirect(`${BACK}?error=name`);
  const supabase = await getServerSupabase();
  const { error } = id
    ? await supabase.from("grant_applications").update(row).eq("id", id)
    : await supabase.from("grant_applications").insert(row);
  if (error) redirect(`${BACK}?error=failed`);
  revalidatePath(BACK);
  redirect(`${BACK}?saved=1`);
}

export async function deleteGrant(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  const supabase = await getServerSupabase();
  // An RLS-blocked delete returns no error and no rows, so count what went.
  const { data, error } = await supabase.from("grant_applications").delete().eq("id", id).select("id");
  if (error || !data?.length) redirect(`${BACK}?error=delete`);
  revalidatePath(BACK);
  redirect(`${BACK}?deleted=1`);
}
