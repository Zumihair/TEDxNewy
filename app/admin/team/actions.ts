"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { passwordPhrase } from "@/lib/password-phrase";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

type FormError = { field?: string; message: string };
type ActionResult = { ok: true; login?: { username: string; password: string } } | { ok: false; errors: FormError[] };

/**
 * The sign-in part of the team form. A member can be given a sign-in (a password is made for them and
 * shown once), have its switches changed, or have the password reset. Returns the new password when
 * one was made.
 */
async function applyLogin(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  form: FormData,
  member: { slug: string; name: string },
): Promise<{ password?: string; username?: string; error?: string }> {
  const mode = String(form.get("login_mode") ?? "");
  if (!mode) return {};
  const admin = !!form.get("is_admin");
  const canEdit = admin || !!form.get("can_edit");
  const first = member.name.split(/\s+/)[0];
  if (mode === "create") {
    for (let i = 0; i < 4; i++) {
      const password = passwordPhrase();
      const { error } = await supabase.rpc("create_admin_access", {
        p_label: member.name,
        p_password: password,
        p_can_edit: canEdit,
        p_admin: admin,
        p_team_slug: member.slug,
        p_username: first,
      });
      if (!error) return { password, username: first.toLowerCase() };
      if (!/already in use/i.test(error.message)) return { error: error.message.replace(/^.*?:\s*/, "") };
    }
    return { error: "Could not make a unique password. Try again." };
  }
  const email = String(form.get("login_email") ?? "");
  if (!email) return {};
  const reset = mode === "reset";
  const password = reset ? passwordPhrase() : null;
  const { error } = await supabase.rpc("update_admin_access", {
    p_email: email,
    p_label: member.name,
    p_can_edit: canEdit,
    p_admin: admin,
    p_password: password,
  });
  if (error) return { error: error.message.replace(/^.*?:\s*/, "") };
  return password ? { password, username: first.toLowerCase() } : {};
}

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
  await requireFullAdmin();
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
  const login = await applyLogin(supabase, form, { slug, name: p.name });
  if (login.error) return { ok: false, errors: [{ message: "Saved, but the sign-in was not made: " + login.error }] };
  if (login.password) return { ok: true, login: { username: login.username ?? "", password: login.password } };
  redirect("/admin/team?saved=1");
}

export async function updateTeamMember(
  _prev: unknown,
  form: FormData,
): Promise<ActionResult> {
  await requireFullAdmin();
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
  const login = await applyLogin(supabase, form, { slug: newSlug, name: p.name });
  if (login.error) return { ok: false, errors: [{ message: "Saved, but the sign-in was not changed: " + login.error }] };
  if (login.password) return { ok: true, login: { username: login.username ?? "", password: login.password } };
  redirect("/admin/team?saved=1");
}

export async function deleteTeamMember(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const slug = String(formData.get("slug") ?? "");
  if (!slug) return;
  const supabase = await getServerSupabase();
  await supabase.from("cms_team_members").delete().eq("slug", slug);
  revalidatePath("/team");
  revalidatePath("/admin/team");
  redirect("/admin/team?deleted=1");
}
