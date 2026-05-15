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

/**
 * Demo team members used only in local development when Supabase env vars
 * aren't set, so designers can preview the /team layout without credentials.
 * In production a missing client still returns [] (the "Coming together"
 * empty state on /team), so this data never reaches deployed users.
 */
const demoTeamMembers: TeamMember[] = [
  {
    slug: "demo-curator",
    name: "Avery Mitchell",
    role: "Curator",
    bio: "Picks the speakers, shapes the run of show, and pushes every talk one more draft. Reformed corporate strategist, current believer in long-form conversation.",
    imageUrl: null,
    email: "hello@tedxnewy.com.au",
    linkedinUrl: "https://www.linkedin.com/",
    instagramUrl: null,
    displayOrder: 10,
  },
  {
    slug: "demo-producer",
    name: "Jordan Hale",
    role: "Producer",
    bio: "Runs the room — venue, vendors, timings, contingency. The reason the doors open at 18:00 and not 18:07.",
    imageUrl: null,
    email: null,
    linkedinUrl: "https://www.linkedin.com/",
    instagramUrl: null,
    displayOrder: 20,
  },
  {
    slug: "demo-design-lead",
    name: "Priya Raman",
    role: "Design lead",
    bio: "Owns the brand — print, stage, web. Believes the red circle deserves better treatment than a stock template.",
    imageUrl: null,
    email: null,
    linkedinUrl: null,
    instagramUrl: "https://www.instagram.com/",
    displayOrder: 30,
  },
  {
    slug: "demo-stage-manager",
    name: "Sam Okonkwo",
    role: "Stage manager",
    bio: "Cues, comms, calm. Has run a room of 500 from a single headset and a clipboard.",
    imageUrl: null,
    email: null,
    linkedinUrl: "https://www.linkedin.com/",
    instagramUrl: null,
    displayOrder: 40,
  },
  {
    slug: "demo-speaker-coach",
    name: "Eliza Chen",
    role: "Speaker coach",
    bio: "Spends the eight weeks before the event making sure every speaker says the thing they actually came to say.",
    imageUrl: null,
    email: "coach@tedxnewy.com.au",
    linkedinUrl: "https://www.linkedin.com/",
    instagramUrl: null,
    displayOrder: 50,
  },
  {
    slug: "demo-partnerships",
    name: "Marcus Webb",
    role: "Partnerships lead",
    bio: "Talks to the Novocastrian businesses who keep the lights on. Translates 'idea worth spreading' into 'thing worth backing'.",
    imageUrl: null,
    email: "partners@tedxnewy.com.au",
    linkedinUrl: "https://www.linkedin.com/",
    instagramUrl: null,
    displayOrder: 60,
  },
];

function demoTeamEnabled(): boolean {
  // Production deployments never opt into demo data, regardless of flag.
  if (process.env.NODE_ENV === "production") return false;
  const flag = process.env.DEMO_TEAM;
  return flag === "1" || flag === "true";
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  // Explicit dev-only preview switch: set DEMO_TEAM=1 in .env.local to see
  // the /team layout populated with sample crew members. Unset (or set to
  // 0) to see the real "Coming together" empty state.
  if (demoTeamEnabled()) return demoTeamMembers;

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
