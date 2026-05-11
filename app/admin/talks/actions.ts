"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";

// Accepts either a full URL or a bare 11-char video ID
function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Bare ID (11 chars, alphanumeric/-/_)
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  // youtu.be/<id> or youtube.com/watch?v=<id> or /embed/<id>
  try {
    const u = new URL(trimmed);
    if (u.hostname.endsWith("youtu.be")) {
      const id = u.pathname.slice(1);
      if (/^[A-Za-z0-9_-]{11}$/.test(id)) return id;
    }
    if (u.hostname.endsWith("youtube.com") || u.hostname.endsWith("youtube-nocookie.com")) {
      const v = u.searchParams.get("v");
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
      const m = u.pathname.match(/\/embed\/([A-Za-z0-9_-]{11})/);
      if (m) return m[1];
    }
  } catch {
    return null;
  }
  return null;
}

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
    id: String(form.get("id") ?? "").trim(),
    speaker: String(form.get("speaker") ?? "").trim(),
    speaker_slug:
      String(form.get("speaker_slug") ?? "").trim() || null,
    title: String(form.get("title") ?? "").trim(),
    year: Number(form.get("year") ?? 0),
    event: String(form.get("event") ?? "").trim(),
    youtube_input: String(form.get("youtube") ?? "").trim(),
    blurb: String(form.get("blurb") ?? "").trim() || null,
    display_order: Number(form.get("display_order") ?? 0),
  };
}

function validate(p: ReturnType<typeof readPayload>): {
  errors: FormError[];
  youtube_id: string | null;
} {
  const errors: FormError[] = [];
  if (!p.speaker) errors.push({ field: "speaker", message: "Speaker name is required." });
  if (!p.title) errors.push({ field: "title", message: "Talk title is required." });
  if (!p.year || (p.year !== 2024 && p.year !== 2025)) {
    errors.push({ field: "year", message: "Year must be 2024 or 2025." });
  }
  if (p.event !== "Reframe" && p.event !== "Beyond Boundaries") {
    errors.push({ field: "event", message: "Event must be Reframe or Beyond Boundaries." });
  }
  const youtube_id = extractYouTubeId(p.youtube_input);
  if (!youtube_id) {
    errors.push({
      field: "youtube",
      message: "Paste a YouTube URL or 11-character video ID.",
    });
  }
  return { errors, youtube_id };
}

export async function createTalk(_prev: unknown, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const p = readPayload(form);
  const { errors, youtube_id } = validate(p);
  if (errors.length || !youtube_id) return { ok: false, errors };

  const id = p.id || slugify(`${p.speaker}-${p.title}`);

  const supabase = await getServerSupabase();
  const { error } = await supabase.from("cms_talks").insert({
    id,
    speaker: p.speaker,
    speaker_slug: p.speaker_slug,
    title: p.title,
    year: p.year,
    event: p.event,
    youtube_id,
    blurb: p.blurb,
    display_order: p.display_order || 999,
  });
  if (error) {
    return {
      ok: false,
      errors: [{ message: error.message }],
    };
  }
  revalidatePath("/watch");
  revalidatePath("/admin/talks");
  redirect("/admin/talks?saved=1");
}

export async function updateTalk(_prev: unknown, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const p = readPayload(form);
  if (!p.id) {
    return { ok: false, errors: [{ message: "Missing talk id." }] };
  }
  const { errors, youtube_id } = validate(p);
  if (errors.length || !youtube_id) return { ok: false, errors };

  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("cms_talks")
    .update({
      speaker: p.speaker,
      speaker_slug: p.speaker_slug,
      title: p.title,
      year: p.year,
      event: p.event,
      youtube_id,
      blurb: p.blurb,
      display_order: p.display_order || 999,
    })
    .eq("id", p.id);
  if (error) {
    return { ok: false, errors: [{ message: error.message }] };
  }
  revalidatePath("/watch");
  revalidatePath("/admin/talks");
  redirect("/admin/talks?saved=1");
}

export async function deleteTalk(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await getServerSupabase();
  await supabase.from("cms_talks").delete().eq("id", id);
  revalidatePath("/watch");
  revalidatePath("/admin/talks");
  redirect("/admin/talks?deleted=1");
}
