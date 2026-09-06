"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";

type FormError = { field?: string; message: string };
type ActionResult = { ok: true } | { ok: false; errors: FormError[] };

const KINDS = ["flagship", "salon", "special"];
const STATUSES = ["draft", "announced", "past"];

function readPayload(form: FormData) {
  return {
    id: String(form.get("id") ?? "").trim(),
    slug: String(form.get("slug") ?? "").trim(),
    title: String(form.get("title") ?? "").trim(),
    tagline: String(form.get("tagline") ?? "").trim() || null,
    blurb: String(form.get("blurb") ?? "").trim() || null,
    kind: String(form.get("kind") ?? "").trim(),
    status: String(form.get("status") ?? "").trim(),
    // Client converts the datetime-local value to a UTC ISO string first.
    starts_at: String(form.get("starts_at") ?? "").trim() || null,
    date_label: String(form.get("date_label") ?? "").trim() || null,
    short_date: String(form.get("short_date") ?? "").trim() || null,
    venue: String(form.get("venue") ?? "").trim() || null,
    hero_image_url: String(form.get("hero_image_url") ?? "").trim() || null,
    link_url: String(form.get("link_url") ?? "").trim() || null,
    link_label: String(form.get("link_label") ?? "").trim() || null,
    ticket_url: String(form.get("ticket_url") ?? "").trim() || null,
    show_in_nav: String(form.get("show_in_nav") ?? "") === "true",
    display_order: Number(form.get("display_order") ?? 999),
  };
}

function validate(p: ReturnType<typeof readPayload>): FormError[] {
  const errors: FormError[] = [];
  if (!p.title) errors.push({ field: "title", message: "Title is required." });
  if (!KINDS.includes(p.kind)) {
    errors.push({ field: "kind", message: "Pick a valid event type." });
  }
  if (!STATUSES.includes(p.status)) {
    errors.push({ field: "status", message: "Pick a valid status." });
  }
  if (p.starts_at && Number.isNaN(Date.parse(p.starts_at))) {
    errors.push({ field: "starts_at", message: "That date and time is not valid." });
  }
  return errors;
}

function rowFrom(p: ReturnType<typeof readPayload>) {
  return {
    title: p.title,
    tagline: p.tagline,
    blurb: p.blurb,
    kind: p.kind,
    status: p.status,
    starts_at: p.starts_at,
    date_label: p.date_label,
    short_date: p.short_date,
    venue: p.venue,
    hero_image_url: p.hero_image_url,
    link_url: p.link_url,
    link_label: p.link_label,
    ticket_url: p.ticket_url,
    show_in_nav: p.show_in_nav,
    display_order: Number.isFinite(p.display_order) ? p.display_order : 999,
    updated_at: new Date().toISOString(),
  };
}

function revalidateEverywhere() {
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/salons");
  revalidatePath("/admin/events");
  revalidateTag("nav", "max");
}

export async function updateEvent(
  _prev: unknown,
  form: FormData,
): Promise<ActionResult> {
  await requireFullAdmin();
  const p = readPayload(form);
  if (!p.id) return { ok: false, errors: [{ message: "Missing event id." }] };
  const errors = validate(p);
  if (errors.length) return { ok: false, errors };

  const supabase = await getServerSupabase();
  const patch = rowFrom(p);
  const row = p.slug ? { slug: p.slug, ...patch } : patch;
  const { error } = await supabase
    .from("cms_events")
    .update(row)
    .eq("id", p.id);
  if (error) return { ok: false, errors: [{ message: error.message }] };

  revalidateEverywhere();
  redirect("/admin/events?saved=1");
}

export async function deleteEvent(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await getServerSupabase();
  await supabase.from("cms_events").delete().eq("id", id);
  revalidateEverywhere();
  redirect("/admin/events?deleted=1");
}
