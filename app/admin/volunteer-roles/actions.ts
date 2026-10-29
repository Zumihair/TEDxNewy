"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { GENERAL_ROLE } from "@/lib/volunteer-roles";

type FormError = { field?: string; message: string };
type ActionResult = { ok: true } | { ok: false; errors: FormError[] };

const STATUSES = ["open", "draft", "closed"] as const;

/** One item per line; blank lines and stray bullets dropped. */
const lines = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);

function readPayload(form: FormData) {
  const status = String(form.get("status") ?? "draft");
  return {
    id: String(form.get("id") ?? "").trim(),
    title: String(form.get("title") ?? "").trim(),
    crew: String(form.get("crew") ?? "").trim(),
    time_commitment: String(form.get("time_commitment") ?? "").trim(),
    location: String(form.get("location") ?? "").trim(),
    summary: String(form.get("summary") ?? "").trim(),
    does: lines(form.get("does")),
    helps: lines(form.get("helps")),
    status: (STATUSES as readonly string[]).includes(status) ? status : "draft",
    display_order: Number(form.get("display_order") ?? 100) || 100,
  };
}

/** The writable columns (everything but the id, which only addresses the row). */
const toRow = (p: ReturnType<typeof readPayload>) => ({
  title: p.title,
  crew: p.crew,
  time_commitment: p.time_commitment,
  location: p.location,
  summary: p.summary,
  does: p.does,
  helps: p.helps,
  status: p.status,
  display_order: p.display_order,
});

function validate(p: ReturnType<typeof readPayload>): FormError[] {
  const errors: FormError[] = [];
  if (!p.title) errors.push({ field: "title", message: "Give the role a title." });
  if (!p.summary) errors.push({ field: "summary", message: "Add a short summary." });
  if (p.status === "open" && p.does.length === 0) {
    errors.push({ field: "does", message: "Add at least one thing they'd do before opening the role." });
  }
  return errors;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "role";

function revalidate() {
  revalidatePath("/volunteer");
  revalidatePath("/admin/volunteer-roles");
}

export async function createRole(_prev: unknown, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const p = readPayload(form);
  const errors = validate(p);
  if (errors.length) return { ok: false, errors };

  const supabase = await getServerSupabase();
  // The slug is the role's public link (?role=<slug>), so it is set once here
  // and kept when the title is edited later.
  const base = slugify(p.title);
  const { data: taken } = await supabase.from("volunteer_roles").select("slug").like("slug", `${base}%`);
  const used = new Set([GENERAL_ROLE.slug, ...(taken ?? []).map((r) => r.slug as string)]);
  let slug = base;
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;

  const { error } = await supabase.from("volunteer_roles").insert({ ...toRow(p), slug });
  if (error) return { ok: false, errors: [{ message: error.message }] };

  revalidate();
  redirect("/admin/volunteer-roles?saved=1");
}

export async function updateRole(_prev: unknown, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const p = readPayload(form);
  if (!p.id) return { ok: false, errors: [{ message: "Missing role id." }] };
  const errors = validate(p);
  if (errors.length) return { ok: false, errors };

  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("volunteer_roles")
    .update({ ...toRow(p), updated_at: new Date().toISOString() })
    .eq("id", p.id)
    .select("id");
  if (error) return { ok: false, errors: [{ message: error.message }] };
  // An RLS-blocked update returns no error and no rows.
  if (!data?.length) return { ok: false, errors: [{ message: "Not saved: you may not have access to change roles." }] };

  revalidate();
  redirect("/admin/volunteer-roles?saved=1");
}

export async function deleteRole(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await getServerSupabase();
  await supabase.from("volunteer_roles").delete().eq("id", id);
  revalidate();
  redirect("/admin/volunteer-roles?deleted=1");
}
