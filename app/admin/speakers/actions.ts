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

const ALLOWED_ACCENTS = ["red", "amber", "coast", "harbor"] as const;
type Accent = (typeof ALLOWED_ACCENTS)[number];

function readPayload(form: FormData) {
  return {
    slug: String(form.get("slug") ?? "").trim(),
    original_slug: String(form.get("original_slug") ?? "").trim(),
    name: String(form.get("name") ?? "").trim(),
    title: String(form.get("title") ?? "").trim() || null,
    talk: String(form.get("talk") ?? "").trim() || null,
    blurb: String(form.get("blurb") ?? "").trim() || null,
    year: Number(form.get("year") ?? 0),
    accent: String(form.get("accent") ?? "red").trim(),
    image_url: String(form.get("image_url") ?? "").trim() || null,
    display_order: Number(form.get("display_order") ?? 999),
  };
}

function validate(p: ReturnType<typeof readPayload>): FormError[] {
  const errors: FormError[] = [];
  if (!p.name) errors.push({ field: "name", message: "Name is required." });
  if (!p.year || (p.year !== 2024 && p.year !== 2025)) {
    errors.push({ field: "year", message: "Year must be 2024 or 2025." });
  }
  if (!ALLOWED_ACCENTS.includes(p.accent as Accent)) {
    errors.push({
      field: "accent",
      message: "Accent must be red, amber, coast or harbor.",
    });
  }
  return errors;
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
  const { error } = await supabase.from("cms_speakers").insert({
    slug,
    name: p.name,
    title: p.title,
    talk: p.talk,
    blurb: p.blurb,
    year: p.year,
    accent: p.accent,
    image_url: p.image_url,
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
  const newSlug = p.slug || p.original_slug;
  const { error } = await supabase
    .from("cms_speakers")
    .update({
      slug: newSlug,
      name: p.name,
      title: p.title,
      talk: p.talk,
      blurb: p.blurb,
      year: p.year,
      accent: p.accent,
      image_url: p.image_url,
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
