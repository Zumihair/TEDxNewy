"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

type FormError = { field?: string; message: string };
type ActionResult = { ok: true } | { ok: false; errors: FormError[] };

function readPayload(form: FormData) {
  return {
    slug: String(form.get("slug") ?? "").trim(),
    original_slug: String(form.get("original_slug") ?? "").trim(),
    name: String(form.get("name") ?? "").trim(),
    title: String(form.get("title") ?? "").trim() || null,
    talk_id: String(form.get("talk_id") ?? "").trim() || null,
    event_id: String(form.get("event_id") ?? "").trim() || null,
    fallback_year: Number(form.get("fallback_year") ?? 2025),
    blurb: String(form.get("blurb") ?? "").trim() || null,
    image_url: String(form.get("image_url") ?? "").trim() || null,
    linkedin_url: String(form.get("linkedin_url") ?? "").trim() || null,
    instagram_url: String(form.get("instagram_url") ?? "").trim() || null,
    display_order: Number(form.get("display_order") ?? 999),
  };
}

function validate(p: ReturnType<typeof readPayload>): FormError[] {
  const errors: FormError[] = [];
  if (!p.name) errors.push({ field: "name", message: "Name is required." });
  return errors;
}

type SupabaseClient = Awaited<ReturnType<typeof getServerSupabase>>;

/**
 * Resolve the back-compat `year` column from the linked event. The /speakers
 * grid still filters and orders by year, so we keep it populated.
 */
async function resolveEvent(
  supabase: SupabaseClient,
  p: ReturnType<typeof readPayload>,
): Promise<{ year: number; event_id: string | null }> {
  if (!p.event_id) {
    return { year: p.fallback_year || 2025, event_id: null };
  }
  const { data: ev } = await supabase
    .from("cms_events")
    .select("starts_at, date_label")
    .eq("id", p.event_id)
    .maybeSingle();
  let year = p.fallback_year || 2025;
  if (ev?.starts_at) {
    const y = new Date(ev.starts_at).getFullYear();
    if (!Number.isNaN(y)) year = y;
  } else if (ev?.date_label) {
    const m = String(ev.date_label).match(/(20\d{2})/);
    if (m) year = Number(m[1]);
  }
  return { year, event_id: p.event_id };
}

export async function createSpeaker(
  _prev: unknown,
  form: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const p = readPayload(form);
  const errors = validate(p);
  if (errors.length) return { ok: false, errors };

  const slug = p.slug || slugify(p.name);
  const supabase = await getServerSupabase();
  const resolved = await resolveEvent(supabase, p);
  const { error } = await supabase.from("cms_speakers").insert({
    slug,
    name: p.name,
    title: p.title,
    talk_id: p.talk_id,
    event_id: resolved.event_id,
    blurb: p.blurb,
    year: resolved.year,
    image_url: p.image_url,
    linkedin_url: p.linkedin_url,
    instagram_url: p.instagram_url,
    display_order: p.display_order,
  });
  if (error) {
    return { ok: false, errors: [{ message: error.message }] };
  }
  revalidatePath("/speakers");
  revalidatePath("/admin/speakers");

  const next = String(form.get("next") ?? "");
  if (next === "add-another") redirect("/admin/speakers/new?saved=1");
  redirect("/admin/speakers?saved=1");
}

export async function updateSpeaker(
  _prev: unknown,
  form: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const p = readPayload(form);
  if (!p.original_slug) {
    return { ok: false, errors: [{ message: "Missing speaker slug." }] };
  }
  const errors = validate(p);
  if (errors.length) return { ok: false, errors };

  const supabase = await getServerSupabase();
  const resolved = await resolveEvent(supabase, p);
  const newSlug = p.slug || p.original_slug;
  const { error } = await supabase
    .from("cms_speakers")
    .update({
      slug: newSlug,
      name: p.name,
      title: p.title,
      talk_id: p.talk_id,
      event_id: resolved.event_id,
      blurb: p.blurb,
      year: resolved.year,
      image_url: p.image_url,
      linkedin_url: p.linkedin_url,
      instagram_url: p.instagram_url,
      display_order: p.display_order,
    })
    .eq("slug", p.original_slug);
  if (error) return { ok: false, errors: [{ message: error.message }] };

  revalidatePath("/speakers");
  revalidatePath(`/speakers/${newSlug}`);
  if (newSlug !== p.original_slug) {
    revalidatePath(`/speakers/${p.original_slug}`);
  }
  revalidatePath("/admin/speakers");
  redirect("/admin/speakers?saved=1");
}

export async function deleteSpeaker(formData: FormData): Promise<void> {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  if (!slug) return;
  const supabase = await getServerSupabase();
  await supabase.from("cms_speakers").delete().eq("slug", slug);
  revalidatePath("/speakers");
  revalidatePath(`/speakers/${slug}`);
  revalidatePath("/admin/speakers");
  redirect("/admin/speakers?deleted=1");
}
