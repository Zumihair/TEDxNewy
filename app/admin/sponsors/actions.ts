"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";

type FormError = { field?: string; message: string };
type ActionResult = { ok: true } | { ok: false; errors: FormError[] };

function readPayload(form: FormData) {
  return {
    id: String(form.get("id") ?? "").trim(),
    name: String(form.get("name") ?? "").trim(),
    tier: String(form.get("tier") ?? "Community").trim(),
    partner_type: String(form.get("partner_type") ?? "").trim() || null,
    logo_url: String(form.get("logo_url") ?? "").trim() || null,
    website_url: String(form.get("website_url") ?? "").trim() || null,
    display_order: Number(form.get("display_order") ?? 999),
    is_current: form.get("is_current") === "on",
  };
}

/** True when a write failed only because the roster migration has not been run yet. */
const missingColumn = (msg: string) => /is_current/i.test(msg);

function validate(p: ReturnType<typeof readPayload>): FormError[] {
  const errors: FormError[] = [];
  if (!p.name) errors.push({ field: "name", message: "Name is required." });
  return errors;
}

export async function createSponsor(
  _prev: unknown,
  form: FormData,
): Promise<ActionResult> {
  await requireFullAdmin();
  const p = readPayload(form);
  const errors = validate(p);
  if (errors.length) return { ok: false, errors };

  const supabase = await getServerSupabase();
  const row = {
    name: p.name,
    tier: p.tier,
    partner_type: p.partner_type,
    logo_url: p.logo_url,
    website_url: p.website_url,
    display_order: p.display_order,
  };
  let { error } = await supabase.from("cms_sponsors").insert({ ...row, is_current: p.is_current });
  if (error && missingColumn(error.message)) ({ error } = await supabase.from("cms_sponsors").insert(row));
  if (error) return { ok: false, errors: [{ message: error.message }] };

  revalidatePath("/sponsors");
  revalidatePath("/signal");
  revalidatePath("/admin/sponsors");
  redirect("/admin/sponsors?saved=1");
}

export async function updateSponsor(
  _prev: unknown,
  form: FormData,
): Promise<ActionResult> {
  await requireFullAdmin();
  const p = readPayload(form);
  if (!p.id) {
    return { ok: false, errors: [{ message: "Missing sponsor id." }] };
  }
  const errors = validate(p);
  if (errors.length) return { ok: false, errors };

  const supabase = await getServerSupabase();
  const row = {
    name: p.name,
    tier: p.tier,
    partner_type: p.partner_type,
    logo_url: p.logo_url,
    website_url: p.website_url,
    display_order: p.display_order,
  };
  let { error } = await supabase.from("cms_sponsors").update({ ...row, is_current: p.is_current }).eq("id", p.id);
  if (error && missingColumn(error.message)) ({ error } = await supabase.from("cms_sponsors").update(row).eq("id", p.id));
  if (error) return { ok: false, errors: [{ message: error.message }] };

  revalidatePath("/sponsors");
  revalidatePath("/signal");
  revalidatePath("/admin/sponsors");
  redirect("/admin/sponsors?saved=1");
}

export async function deleteSponsor(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await getServerSupabase();
  await supabase.from("cms_sponsors").delete().eq("id", id);
  revalidatePath("/sponsors");
  revalidatePath("/signal");
  revalidatePath("/admin/sponsors");
  redirect("/admin/sponsors?deleted=1");
}

const FILES_BUCKET = "documents";

/** Record a file the browser has already uploaded to the documents bucket (sponsors/<id>/...). */
export async function addSponsorFile(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireFullAdmin();
  const sponsorId = String(formData.get("sponsor_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "other").trim() || "other";
  const fileUrl = String(formData.get("file_url") ?? "").trim();
  const storagePath = String(formData.get("storage_path") ?? "").trim() || null;
  const size = Number(formData.get("size_bytes") ?? 0);
  if (!sponsorId || !name || !fileUrl) return { ok: false, error: "Missing details." };
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("sponsor_files").insert({
    sponsor_id: sponsorId,
    name,
    kind,
    file_url: fileUrl,
    storage_path: storagePath,
    size_bytes: Number.isFinite(size) && size > 0 ? size : null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/sponsors");
  return { ok: true };
}

export async function deleteSponsorFile(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing file." };
  const supabase = await getServerSupabase();
  const { data: row } = await supabase.from("sponsor_files").select("storage_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("sponsor_files").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (row?.storage_path) {
    await supabase.storage.from(FILES_BUCKET).remove([row.storage_path as string]);
  }
  revalidatePath("/admin/sponsors");
  return { ok: true };
}
