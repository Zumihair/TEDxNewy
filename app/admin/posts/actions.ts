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
  const action = String(form.get("action") ?? "save").trim();
  const publishedAtRaw = String(form.get("published_at") ?? "").trim();
  return {
    slug: String(form.get("slug") ?? "").trim(),
    original_slug: String(form.get("original_slug") ?? "").trim(),
    title: String(form.get("title") ?? "").trim(),
    summary: String(form.get("summary") ?? "").trim() || null,
    body_markdown: String(form.get("body_markdown") ?? ""),
    hero_image_url: String(form.get("hero_image_url") ?? "").trim() || null,
    author: String(form.get("author") ?? "").trim() || null,
    published_at: publishedAtRaw ? new Date(publishedAtRaw).toISOString() : null,
    action,
  };
}

function validate(p: ReturnType<typeof readPayload>): FormError[] {
  const errors: FormError[] = [];
  if (!p.title) errors.push({ field: "title", message: "Title is required." });
  if (!p.body_markdown.trim()) {
    errors.push({ field: "body_markdown", message: "Body can't be empty." });
  }
  return errors;
}

export async function createPost(
  _prev: unknown,
  form: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const p = readPayload(form);
  const errors = validate(p);
  if (errors.length) return { ok: false, errors };

  // publish-now overrides any explicit published_at
  const publishedAt =
    p.action === "publish-now"
      ? new Date().toISOString()
      : p.action === "save-draft"
        ? null
        : p.published_at;

  const slug = p.slug || slugify(p.title);

  const supabase = await getServerSupabase();
  const { error } = await supabase.from("cms_posts").insert({
    slug,
    title: p.title,
    summary: p.summary,
    body_markdown: p.body_markdown,
    hero_image_url: p.hero_image_url,
    author: p.author,
    published_at: publishedAt,
  });
  if (error) return { ok: false, errors: [{ message: error.message }] };

  revalidatePath("/ideas");
  revalidatePath(`/ideas/${slug}`);
  revalidatePath("/admin/posts");
  redirect("/admin/posts?saved=1");
}

export async function updatePost(
  _prev: unknown,
  form: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const p = readPayload(form);
  if (!p.original_slug) {
    return { ok: false, errors: [{ message: "Missing post slug." }] };
  }
  const errors = validate(p);
  if (errors.length) return { ok: false, errors };

  const publishedAt =
    p.action === "publish-now"
      ? new Date().toISOString()
      : p.action === "save-draft"
        ? null
        : p.published_at;

  const supabase = await getServerSupabase();
  const newSlug = p.slug || p.original_slug;
  const { error } = await supabase
    .from("cms_posts")
    .update({
      slug: newSlug,
      title: p.title,
      summary: p.summary,
      body_markdown: p.body_markdown,
      hero_image_url: p.hero_image_url,
      author: p.author,
      published_at: publishedAt,
    })
    .eq("slug", p.original_slug);
  if (error) return { ok: false, errors: [{ message: error.message }] };

  revalidatePath("/ideas");
  revalidatePath(`/ideas/${newSlug}`);
  if (newSlug !== p.original_slug) {
    revalidatePath(`/ideas/${p.original_slug}`);
  }
  revalidatePath("/admin/posts");
  redirect("/admin/posts?saved=1");
}

export async function deletePost(formData: FormData): Promise<void> {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  if (!slug) return;
  const supabase = await getServerSupabase();
  await supabase.from("cms_posts").delete().eq("slug", slug);
  revalidatePath("/ideas");
  revalidatePath(`/ideas/${slug}`);
  revalidatePath("/admin/posts");
  redirect("/admin/posts?deleted=1");
}
