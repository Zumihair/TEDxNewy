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
    role: String(form.get("role") ?? "").trim() || null,
    bio: String(form.get("bio") ?? "").trim() || null,
    image_url: String(form.get("image_url") ?? "").trim() || null,
    email: String(form.get("email") ?? "").trim() || null,
    linkedin_url: String(form.get("linkedin_url") ?? "").trim() || null,
    instagram_url: String(form.get("instagram_url") ?? "").trim() || null,
    display_order: Number(form.get("display_order") ?? 999),
    is_active: form.get("is_active") === "on",
  };
}

function validate(p: ReturnType<typeof readPayload>): FormError[] {
  const errors: FormError[] = [];
  if (!p.name) errors.push({ field: "name", message: "Name is required." });
  return errors;
}

export async function createTeamMember(
  _prev: unknown,
  form: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const p = readPayload(form);
  const errors = validate(p);
  if (errors.length) return { ok: false, errors };

  const slug = p.slug || slugify(p.name);
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("cms_team_members").insert({
    slug,
    name: p.name,
    role: p.role,
    bio: p.bio,
    image_url: p.image_url,
    email: p.email,
    linkedin_url: p.linkedin_url,
    instagram_url: p.instagram_url,
    display_order: p.display_order,
    is_active: p.is_active,
  });
  if (error) return { ok: false, errors: [{ message: error.message }] };

  revalidatePath("/team");
  revalidatePath("/admin/team");

  const next = String(form.get("next") ?? "");
  if (next === "add-another") redirect("/admin/team/new?saved=1");
  redirect("/admin/team?saved=1");
}

export async function updateTeamMember(
  _prev: unknown,
  form: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const p = readPayload(form);
  if (!p.original_slug) {
    return { ok: false, errors: [{ message: "Missing team member slug." }] };
  }
  const errors = validate(p);
  if (errors.length) return { ok: false, errors };

  const supabase = await getServerSupabase();
  const newSlug = p.slug || p.original_slug;
  const { error } = await supabase
    .from("cms_team_members")
    .update({
      slug: newSlug,
      name: p.name,
      role: p.role,
      bio: p.bio,
      image_url: p.image_url,
      email: p.email,
      linkedin_url: p.linkedin_url,
      instagram_url: p.instagram_url,
      display_order: p.display_order,
      is_active: p.is_active,
    })
    .eq("slug", p.original_slug);
  if (error) return { ok: false, errors: [{ message: error.message }] };

  revalidatePath("/team");
  revalidatePath("/admin/team");
  redirect("/admin/team?saved=1");
}

export async function deleteTeamMember(formData: FormData): Promise<void> {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  if (!slug) return;
  const supabase = await getServerSupabase();
  await supabase.from("cms_team_members").delete().eq("slug", slug);
  revalidatePath("/team");
  revalidatePath("/admin/team");
  redirect("/admin/team?deleted=1");
}
