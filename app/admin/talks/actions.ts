"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import {
  fetchVideoStats,
  YouTubeApiError,
  YouTubeConfigError,
} from "@/lib/youtube";

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
    event_id: String(form.get("event_id") ?? "").trim() || null,
    // Legacy year + event kept in sync for back-compat when no event is linked.
    fallback_year: Number(form.get("fallback_year") ?? 2025),
    fallback_event: String(form.get("fallback_event") ?? "Reframe").trim(),
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
  const youtube_id = extractYouTubeId(p.youtube_input);
  if (!youtube_id) {
    errors.push({
      field: "youtube",
      message: "Paste a YouTube URL or 11-character video ID.",
    });
  }
  return { errors, youtube_id };
}

type SupabaseClient = Awaited<ReturnType<typeof getServerSupabase>>;

/**
 * Resolve the back-compat `year` + `event` text columns from the linked event.
 * These columns still drive the /talks year filter and labelling, so we keep
 * them populated with valid values (the archive only supports 2024 and 2025).
 */
async function resolveLegacy(
  supabase: SupabaseClient,
  p: ReturnType<typeof readPayload>,
): Promise<{ year: number; event: string; event_id: string | null }> {
  if (!p.event_id) {
    const year = p.fallback_year === 2024 ? 2024 : 2025;
    const event =
      p.fallback_event === "Beyond Boundaries" ? "Beyond Boundaries" : "Reframe";
    return { year, event, event_id: null };
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
  const legacyYear = year <= 2024 ? 2024 : 2025;
  const legacyEvent = legacyYear === 2024 ? "Beyond Boundaries" : "Reframe";
  return { year: legacyYear, event: legacyEvent, event_id: p.event_id };
}

export async function createTalk(_prev: unknown, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const p = readPayload(form);
  const { errors, youtube_id } = validate(p);
  if (errors.length || !youtube_id) return { ok: false, errors };

  const id = p.id || slugify(`${p.speaker}-${p.title}`);

  const supabase = await getServerSupabase();
  const legacy = await resolveLegacy(supabase, p);
  const { error } = await supabase.from("cms_talks").insert({
    id,
    speaker: p.speaker,
    speaker_slug: p.speaker_slug,
    title: p.title,
    year: legacy.year,
    event: legacy.event,
    event_id: legacy.event_id,
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
  revalidatePath("/talks");
  revalidatePath("/admin/talks");
  const next = String(form.get("next") ?? "");
  if (next === "add-another") {
    redirect("/admin/talks/new?saved=1");
  }
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
  const legacy = await resolveLegacy(supabase, p);
  const { error } = await supabase
    .from("cms_talks")
    .update({
      speaker: p.speaker,
      speaker_slug: p.speaker_slug,
      title: p.title,
      year: legacy.year,
      event: legacy.event,
      event_id: legacy.event_id,
      youtube_id,
      blurb: p.blurb,
      display_order: p.display_order || 999,
    })
    .eq("id", p.id);
  if (error) {
    return { ok: false, errors: [{ message: error.message }] };
  }
  revalidatePath("/talks");
  revalidatePath("/admin/talks");
  redirect("/admin/talks?saved=1");
}

export async function deleteTalk(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await getServerSupabase();
  await supabase.from("cms_talks").delete().eq("id", id);
  revalidatePath("/talks");
  revalidatePath("/admin/talks");
  redirect("/admin/talks?deleted=1");
}

/**
 * Refresh cached YouTube view / like / comment counts for every talk that has
 * a youtube_id. One YouTube Data API call handles up to 50 videos, so this is
 * cheap — ~1-2 quota units per refresh. Upserts into cms_talk_stats.
 *
 * Reports back via query string: ?refreshed=N or ?refresh-error=<reason>.
 */
export async function refreshTalkStats(): Promise<void> {
  await requireAdmin();
  const supabase = await getServerSupabase();

  const { data: talks, error: readErr } = await supabase
    .from("cms_talks")
    .select("id, youtube_id");
  if (readErr) {
    redirect(
      `/admin/talks?refresh-error=${encodeURIComponent("Failed to read talks: " + readErr.message)}`,
    );
  }
  const ids = (talks ?? [])
    .map((t) => t.youtube_id as string | null)
    .filter((v): v is string => Boolean(v));
  if (ids.length === 0) {
    redirect(`/admin/talks?refresh-error=${encodeURIComponent("No talks with a YouTube ID.")}`);
  }

  let stats;
  try {
    stats = await fetchVideoStats(ids);
  } catch (err) {
    if (err instanceof YouTubeConfigError) {
      redirect(
        `/admin/talks?refresh-error=${encodeURIComponent("YOUTUBE_API_KEY not set in Vercel.")}`,
      );
    }
    if (err instanceof YouTubeApiError) {
      redirect(
        `/admin/talks?refresh-error=${encodeURIComponent(
          `YouTube ${err.status}: ${err.body.slice(0, 200)}`,
        )}`,
      );
    }
    throw err;
  }

  const now = new Date().toISOString();
  const rows = (talks ?? [])
    .filter((t) => t.youtube_id)
    .map((t) => {
      const s = stats.get(t.youtube_id as string);
      return {
        talk_id: t.id as string,
        youtube_id: t.youtube_id as string,
        view_count: s?.viewCount ?? null,
        like_count: s?.likeCount ?? null,
        comment_count: s?.commentCount ?? null,
        fetched_at: now,
        fetch_error: s ? null : "not returned by YouTube (private, deleted, or wrong id)",
      };
    });

  const { error: writeErr } = await supabase
    .from("cms_talk_stats")
    .upsert(rows, { onConflict: "talk_id" });
  if (writeErr) {
    redirect(
      `/admin/talks?refresh-error=${encodeURIComponent("Save failed: " + writeErr.message)}`,
    );
  }

  const filled = rows.filter((r) => r.view_count != null).length;
  revalidatePath("/talks");
  revalidatePath("/admin/talks");
  revalidatePath("/impact");
  redirect(`/admin/talks?refreshed=${filled}`);
}
