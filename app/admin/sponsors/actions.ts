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
  };
}

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
  const { error } = await supabase.from("cms_sponsors").insert({
    name: p.name,
    tier: p.tier,
    partner_type: p.partner_type,
    logo_url: p.logo_url,
    website_url: p.website_url,
    display_order: p.display_order,
  });
  if (error) return { ok: false, errors: [{ message: error.message }] };

  revalidatePath("/sponsors");
  revalidatePath("/signal");
  revalidatePath("/admin/sponsors");

  const next = String(form.get("next") ?? "");
  if (next === "add-another") redirect("/admin/sponsors/new?saved=1");
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
  const { error } = await supabase
    .from("cms_sponsors")
    .update({
      name: p.name,
      tier: p.tier,
      partner_type: p.partner_type,
      logo_url: p.logo_url,
      website_url: p.website_url,
      display_order: p.display_order,
    })
    .eq("id", p.id);
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
