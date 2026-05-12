/**
 * Public-site CMS readers. These query Supabase via the anon-key client
 * (RLS lets anyone SELECT from cms_* tables) and fall back to the static
 * lib/data.ts seed if anything goes wrong, so the site never breaks if
 * Supabase is unreachable or env vars are missing.
 */
import { createClient } from "@supabase/supabase-js";
import {
  speakers as fallbackSpeakers,
  talks as fallbackTalks,
  type Speaker,
  type Talk,
} from "./data";

function publicSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Read the live talk archive. Returns the static fallback on any error,
 * so /watch always renders something even if Supabase is down.
 */
export async function getTalks(): Promise<Talk[]> {
  const client = publicSupabase();
  if (!client) return fallbackTalks;
  const { data, error } = await client
    .from("cms_talks")
    .select("*")
    .order("year", { ascending: false })
    .order("display_order", { ascending: true });
  if (error || !data) {
    if (error) console.error("[cms-content] getTalks", error);
    return fallbackTalks;
  }
  return data.map(
    (row): Talk => ({
      id: row.id,
      speaker: row.speaker,
      speakerSlug: row.speaker_slug ?? undefined,
      title: row.title,
      year: row.year,
      event: row.event,
      youtubeId: row.youtube_id,
      blurb: row.blurb ?? undefined,
    }),
  );
}

const ALLOWED_ACCENTS = ["red", "amber", "coast", "harbor"] as const;
type SpeakerAccent = (typeof ALLOWED_ACCENTS)[number];

/**
 * Read the live speaker lineup. Returns the static fallback on any error.
 */
export async function getSpeakers(): Promise<Speaker[]> {
  const client = publicSupabase();
  if (!client) return fallbackSpeakers;
  const { data, error } = await client
    .from("cms_speakers")
    .select("*")
    .order("year", { ascending: false })
    .order("display_order", { ascending: true });
  if (error || !data) {
    if (error) console.error("[cms-content] getSpeakers", error);
    return fallbackSpeakers;
  }
  return data.map((row): Speaker => {
    const accent: SpeakerAccent = ALLOWED_ACCENTS.includes(row.accent)
      ? row.accent
      : "red";
    return {
      slug: row.slug,
      name: row.name,
      title: row.title ?? "",
      talk: row.talk ?? "Talk title to be added",
      blurb: row.blurb ?? "Talk description to be added.",
      accent,
      year: row.year,
      image: row.image_url ?? undefined,
    };
  });
}

export async function getSpeakerBySlug(slug: string): Promise<Speaker | null> {
  const all = await getSpeakers();
  return all.find((s) => s.slug === slug) ?? null;
}

// ============================================================
// Team members (public /team)
// ============================================================
export type TeamMember = {
  slug: string;
  name: string;
  role: string | null;
  bio: string | null;
  imageUrl: string | null;
  email: string | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  displayOrder: number;
};

export async function getTeamMembers(): Promise<TeamMember[]> {
  const client = publicSupabase();
  if (!client) return [];
  const { data, error } = await client
    .from("cms_team_members")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error || !data) {
    if (error) console.error("[cms-content] getTeamMembers", error);
    return [];
  }
  return data.map((row): TeamMember => ({
    slug: row.slug,
    name: row.name,
    role: row.role ?? null,
    bio: row.bio ?? null,
    imageUrl: row.image_url ?? null,
    email: row.email ?? null,
    linkedinUrl: row.linkedin_url ?? null,
    instagramUrl: row.instagram_url ?? null,
    displayOrder: row.display_order,
  }));
}

// ============================================================
// Posts / Online Ideas (/ideas)
// ============================================================
export type Post = {
  slug: string;
  title: string;
  summary: string | null;
  bodyMarkdown: string;
  heroImageUrl: string | null;
  author: string | null;
  publishedAt: string | null;
};

export async function getPublishedPosts(): Promise<Post[]> {
  const client = publicSupabase();
  if (!client) return [];
  const { data, error } = await client
    .from("cms_posts")
    .select("*")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });
  if (error || !data) {
    if (error) console.error("[cms-content] getPublishedPosts", error);
    return [];
  }
  return data.map(rowToPost);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const client = publicSupabase();
  if (!client) return null;
  const { data, error } = await client
    .from("cms_posts")
    .select("*")
    .eq("slug", slug)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .single();
  if (error || !data) return null;
  return rowToPost(data);
}

function rowToPost(row: {
  slug: string;
  title: string;
  summary: string | null;
  body_markdown: string;
  hero_image_url: string | null;
  author: string | null;
  published_at: string | null;
}): Post {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    bodyMarkdown: row.body_markdown,
    heroImageUrl: row.hero_image_url,
    author: row.author,
    publishedAt: row.published_at,
  };
}
