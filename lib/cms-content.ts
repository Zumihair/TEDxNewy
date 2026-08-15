/**
 * Public-site CMS readers. These query Supabase via the anon-key client
 * (RLS lets anyone SELECT from cms_* tables) and fall back to the static
 * lib/data.ts seed if anything goes wrong, so the site never breaks if
 * Supabase is unreachable or env vars are missing.
 */
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import {
  speakers as fallbackSpeakers,
  talks as fallbackTalks,
  sponsors as fallbackSponsors,
  type Speaker,
  type Talk,
  type Sponsor,
} from "./data";
import {
  NAV_FALLBACK,
  type NavConfig,
  type NavItemConfig,
} from "./nav-fallback";
import { SIGNAL_LIVE } from "./feature-flags";

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
 * so /talks always renders something even if Supabase is down.
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
  return data.map(rowToTalk);
}

function rowToTalk(row: {
  id: string;
  speaker: string;
  speaker_slug: string | null;
  title: string;
  year: number;
  event: Talk["event"];
  youtube_id: string;
  blurb: string | null;
  event_id?: string | null;
}): Talk {
  return {
    id: row.id,
    speaker: row.speaker,
    speakerSlug: row.speaker_slug ?? undefined,
    title: row.title,
    year: row.year,
    event: row.event,
    youtubeId: row.youtube_id,
    blurb: row.blurb ?? undefined,
    eventId: row.event_id ?? undefined,
  };
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
  return data.map(rowToSpeaker);
}

function rowToSpeaker(row: {
  slug: string;
  name: string;
  title: string | null;
  talk: string | null;
  blurb: string | null;
  accent: SpeakerAccent;
  year: number;
  image_url: string | null;
  talk_id: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  event_id?: string | null;
}): Speaker {
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
    talkId: row.talk_id ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    instagramUrl: row.instagram_url ?? undefined,
    eventId: row.event_id ?? undefined,
  };
}

export async function getSpeakerBySlug(slug: string): Promise<Speaker | null> {
  const all = await getSpeakers();
  return all.find((s) => s.slug === slug) ?? null;
}

export type LinkedTalk = { title: string; youtubeId: string; blurb?: string };
export type SpeakerWithTalk = Speaker & { linkedTalk?: LinkedTalk };

/**
 * Speakers, each enriched with their linked talk (by talk_id, falling back to
 * a talk that points back at the speaker). Used by /speakers so the grid +
 * modal can embed the talk video without a second fetch.
 */
export async function getSpeakersWithTalks(): Promise<SpeakerWithTalk[]> {
  const [speakers, talks] = await Promise.all([getSpeakers(), getTalks()]);
  return speakers.map((s) => {
    const t =
      talks.find((t) => s.talkId && t.id === s.talkId) ??
      talks.find((t) => t.speakerSlug === s.slug) ??
      null;
    return t
      ? {
          ...s,
          linkedTalk: { title: t.title, youtubeId: t.youtubeId, blurb: t.blurb },
        }
      : s;
  });
}

// ============================================================
// Sponsors (public /sponsors, sponsor teasers elsewhere)
// ============================================================

type SponsorRow = {
  id: string;
  name: string;
  tier: string;
  partner_type: string | null;
  logo_url: string | null;
  website_url: string | null;
  display_order: number;
};

const SPONSOR_TIERS: Sponsor["tier"][] = [
  "Presenting",
  "Platinum",
  "Gold",
  "Community",
];

function rowToSponsor(row: SponsorRow): Sponsor {
  const tier: Sponsor["tier"] = (
    SPONSOR_TIERS as string[]
  ).includes(row.tier)
    ? (row.tier as Sponsor["tier"])
    : "Community";
  return {
    name: row.name,
    tier,
    partnerType: row.partner_type ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    websiteUrl: row.website_url ?? undefined,
  };
}

/**
 * Read the live sponsor list (with logos). Returns the static fallback on
 * any error, so /sponsors and any sponsor teaser always render something.
 */
export async function getSponsors(): Promise<Sponsor[]> {
  const client = publicSupabase();
  if (!client) return fallbackSponsors;
  const { data, error } = await client
    .from("cms_sponsors")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error || !data) {
    if (error) console.error("[cms-content] getSponsors", error);
    return fallbackSponsors;
  }
  return (data as SponsorRow[]).map(rowToSponsor);
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
    bio: "Runs the room: venue, vendors, timings, contingency. The reason the doors open at 18:00 and not 18:07.",
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
    bio: "Owns the brand: print, stage, web. Believes the red circle deserves better treatment than a stock template.",
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
// Events (public /events, /salons, home spotlight) + linked lineups
// ============================================================
export type EventKind = "flagship" | "salon" | "special";
export type EventStatus = "draft" | "announced" | "past";

export type CmsEvent = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  blurb: string | null;
  kind: EventKind;
  status: EventStatus;
  startsAt: string | null;
  dateLabel: string | null;
  shortDate: string | null;
  venue: string | null;
  heroImageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  ticketUrl: string | null;
  showInNav: boolean;
  displayOrder: number;
};

/**
 * Static fallback for events, mirroring the seed rows in
 * supabase/migrations/20260709_events_nav.sql. Keeps /events, /salons and the
 * home page rendering the real season during the window before the migration is
 * applied (and if Supabase is ever unreachable).
 */
export const FALLBACK_EVENTS: CmsEvent[] = [
  {
    id: "fallback-student-speaker-competition",
    slug: "student-speaker-competition",
    title: "Student Speaker Competition",
    tagline: "The stage is set for the next generation.",
    blurb:
      "A competition for students across the Hunter to develop and deliver an idea worth spreading.",
    kind: "special",
    status: "announced",
    startsAt: "2026-09-06T08:00:00Z",
    dateLabel: "Submissions close 6 September 2026",
    shortDate: "Submissions close 6 September",
    venue: null,
    heroImageUrl: null,
    linkUrl: "/student-speaker-competition",
    linkLabel: null,
    ticketUrl: null,
    showInNav: true,
    displayOrder: 10,
  },
  {
    id: "fallback-60-second-talk-night",
    slug: "60-second-talk-night",
    title: "60-Second Talk Night",
    tagline: "One idea, one minute.",
    blurb:
      "Our second Salon of 2026: seventeen Novocastrians took The Base stage in Newcastle West to share an idea each, in just 60 seconds. Watch the recap.",
    kind: "special",
    status: "past",
    startsAt: "2026-07-16T08:00:00Z",
    dateLabel: "Thursday 16 July 2026",
    shortDate: "16 July 2026",
    venue: "The Base, Newcastle West",
    heroImageUrl: null,
    linkUrl: "/60-second-talk-night",
    linkLabel: null,
    ticketUrl: null,
    showInNav: false,
    displayOrder: 20,
  },
  {
    id: "fallback-youth-futures-lab",
    slug: "youth-futures-lab",
    title: "Youth Futures Lab",
    tagline: "Young Novocastrians shaping what comes next.",
    blurb:
      "A hands on lab for young people to explore the ideas and skills that will shape their future.",
    kind: "special",
    status: "past",
    startsAt: "2026-08-07T08:00:00Z",
    dateLabel: "Friday 7 August 2026",
    shortDate: "7 August",
    venue: "NUspace",
    heroImageUrl: null,
    linkUrl: "/youth-futures-lab",
    linkLabel: null,
    ticketUrl: null,
    showInNav: false,
    displayOrder: 30,
  },
  {
    id: "fallback-signal-2026",
    slug: "signal-2026",
    title: "Signal",
    tagline: "A full day on our biggest stage yet.",
    blurb:
      "TEDxNewy is more than a stage. It's a room full of curious people who believe one idea, one conversation or one unexpected connection can change the direction of a life. Signal is our fourth event of 2026, bringing talks and performances to the Conservatorium of Music.",
    kind: "flagship",
    status: "announced",
    startsAt: "2026-10-24T08:00:00Z",
    dateLabel: "Saturday 24 October 2026",
    shortDate: "24 October",
    venue: "Conservatorium of Music",
    heroImageUrl: null,
    linkUrl: "/signal",
    linkLabel: "Get tickets",
    ticketUrl: "https://events.humanitix.com/tedxnewy-signature-event",
    showInNav: SIGNAL_LIVE,
    displayOrder: 40,
  },
  {
    id: "fallback-newcastle-2050-salon",
    slug: "newcastle-2050-salon",
    title: "Newcastle 2050: What If?",
    tagline: "An evening of bold questions, creative thinking and new perspectives.",
    blurb:
      "The first event of the 2026 season brought Novocastrians together at the Q Building to ask one question: what can Newcastle look like in 2050? Across a packed out evening we worked through transport, health and the night economy, turning a room of strangers into a room of collaborators.",
    kind: "salon",
    status: "past",
    startsAt: "2026-04-30T08:00:00Z",
    dateLabel: "Thursday 30 April 2026",
    shortDate: "30 April 2026",
    venue: "Q Building, Honeysuckle",
    heroImageUrl: "/images/salon-whatif.jpg",
    linkUrl: "/newcastle-2050-salon",
    linkLabel: null,
    ticketUrl: null,
    showInNav: false,
    displayOrder: 50,
  },
  {
    id: "fallback-reframe-2025",
    slug: "reframe-2025",
    title: "Reframe",
    tagline: "TEDxCooksHill 2025.",
    blurb:
      "A year on from Beyond Boundaries, we moved into the Conservatorium of Music for Reframe: ten speakers, one shared instruction, look again. Where Beyond Boundaries asked what could be pushed past, Reframe asked what could be seen differently: quitting, discomfort, attention, teaching, and the stories we tell ourselves about all of them.\n\nReframe was the last flagship staged under the TEDxCooksHill name. Not long after, the licence became TEDxNewy, and the salons, talk nights and Signal that followed all carry the same instruction this stage set: look again.",
    kind: "flagship",
    status: "past",
    startsAt: "2025-10-01T08:00:00Z",
    dateLabel: "October 2025",
    shortDate: "October 2025",
    venue: "Conservatorium of Music",
    heroImageUrl: "/images/past-2025.jpg",
    linkUrl: null,
    linkLabel: null,
    ticketUrl: null,
    showInNav: false,
    displayOrder: 60,
  },
  {
    id: "fallback-beyond-boundaries-2024",
    slug: "beyond-boundaries-2024",
    title: "Beyond Boundaries",
    tagline: "TEDxCooksHill 2024.",
    blurb:
      "In October 2024, eleven speakers took the stage at The Playhouse for our first flagship event, staged under our original name, TEDxCooksHill. Beyond Boundaries asked a simple question: what happens when we stop accepting the limits we have been handed?\n\nAcross a single day the lineup moved through health, work, play and belonging, each speaker pushing on a boundary they had tested themselves, in the clinic, the workplace, the studio, the family home. It was the event that proved Newcastle had an appetite for this, and the one that set the shape for everything that has followed.",
    kind: "flagship",
    status: "past",
    startsAt: "2024-10-01T08:00:00Z",
    dateLabel: "October 2024",
    shortDate: "October 2024",
    venue: "The Playhouse",
    heroImageUrl: "/images/past-2024.jpg",
    linkUrl: null,
    linkLabel: null,
    ticketUrl: null,
    showInNav: false,
    displayOrder: 70,
  },
];

type EventRow = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  blurb: string | null;
  kind: string;
  status: string;
  starts_at: string | null;
  date_label: string | null;
  short_date: string | null;
  venue: string | null;
  hero_image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  ticket_url: string | null;
  show_in_nav: boolean;
  display_order: number;
};

const EVENT_KINDS: EventKind[] = ["flagship", "salon", "special"];
const EVENT_STATUSES: EventStatus[] = ["draft", "announced", "past"];

function rowToEvent(row: EventRow): CmsEvent {
  const kind = (EVENT_KINDS as string[]).includes(row.kind)
    ? (row.kind as EventKind)
    : "salon";
  const status = (EVENT_STATUSES as string[]).includes(row.status)
    ? (row.status as EventStatus)
    : "draft";
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline ?? null,
    blurb: row.blurb ?? null,
    kind,
    status,
    startsAt: row.starts_at ?? null,
    dateLabel: row.date_label ?? null,
    shortDate: row.short_date ?? null,
    venue: row.venue ?? null,
    heroImageUrl: row.hero_image_url ?? null,
    linkUrl: row.link_url ?? null,
    linkLabel: row.link_label ?? null,
    ticketUrl: row.ticket_url ?? null,
    showInNav: row.show_in_nav,
    displayOrder: row.display_order,
  };
}

/** starts_at descending with nulls last, then display_order ascending. */
function sortEvents(list: CmsEvent[]): CmsEvent[] {
  return [...list].sort((a, b) => {
    const at = a.startsAt ? Date.parse(a.startsAt) : null;
    const bt = b.startsAt ? Date.parse(b.startsAt) : null;
    if (at !== bt) {
      if (at === null) return 1;
      if (bt === null) return -1;
      return bt - at;
    }
    return a.displayOrder - b.displayOrder;
  });
}

export async function getEvents(opts?: {
  kind?: EventKind;
  status?: EventStatus;
}): Promise<CmsEvent[]> {
  const fromFallback = () =>
    sortEvents(
      FALLBACK_EVENTS.filter(
        (e) =>
          e.status !== "draft" &&
          (!opts?.kind || e.kind === opts.kind) &&
          (!opts?.status || e.status === opts.status),
      ),
    );

  const client = publicSupabase();
  if (!client) return fromFallback();

  let query = client.from("cms_events").select("*").neq("status", "draft");
  if (opts?.kind) query = query.eq("kind", opts.kind);
  if (opts?.status) query = query.eq("status", opts.status);

  const { data, error } = await query
    .order("starts_at", { ascending: false, nullsFirst: false })
    .order("display_order", { ascending: true });
  if (error || !data) {
    if (error) console.error("[cms-content] getEvents", error);
    return fromFallback();
  }
  return (data as EventRow[]).map(rowToEvent);
}

export async function getEventBySlug(slug: string): Promise<CmsEvent | null> {
  const fallback = () =>
    FALLBACK_EVENTS.find((e) => e.slug === slug && e.status !== "draft") ?? null;

  const client = publicSupabase();
  if (!client) return fallback();

  const { data, error } = await client
    .from("cms_events")
    .select("*")
    .eq("slug", slug)
    .neq("status", "draft")
    .maybeSingle();
  if (error) {
    // Table missing (pre-migration) or a transient failure — use the fallback
    // so the auto-generated event pages still render.
    console.error("[cms-content] getEventBySlug", error);
    return fallback();
  }
  if (!data) return null;
  return rowToEvent(data as EventRow);
}

/** Talks linked to an event (its lineup). Empty on any error. */
export async function getTalksForEvent(eventId: string): Promise<Talk[]> {
  const client = publicSupabase();
  if (!client) return [];
  const { data, error } = await client
    .from("cms_talks")
    .select("*")
    .eq("event_id", eventId)
    .order("display_order", { ascending: true });
  if (error || !data) return [];
  return data.map(rowToTalk);
}

/** Speakers linked to an event (its lineup). Empty on any error. */
export async function getSpeakersForEvent(eventId: string): Promise<Speaker[]> {
  const client = publicSupabase();
  if (!client) return [];
  const { data, error } = await client
    .from("cms_speakers")
    .select("*")
    .eq("event_id", eventId)
    .order("display_order", { ascending: true });
  if (error || !data) return [];
  return data.map(rowToSpeaker);
}

export type EventPhoto = {
  id: string;
  url: string;
  thumbUrl: string;
  width: number | null;
  height: number | null;
};

type EventPhotoRow = {
  id: string;
  url: string;
  thumb_url: string;
  width: number | null;
  height: number | null;
};

/** Photo gallery for an event, hosted on Vercel Blob. Empty on any error
 * (pre-migration, no photos catalogued yet, etc). */
export async function getPhotosForEvent(eventId: string): Promise<EventPhoto[]> {
  const client = publicSupabase();
  if (!client) return [];
  const { data, error } = await client
    .from("event_photos")
    .select("*")
    .eq("event_id", eventId)
    .order("display_order", { ascending: true });
  if (error || !data) return [];
  return (data as EventPhotoRow[]).map((row) => ({
    id: row.id,
    url: row.url,
    thumbUrl: row.thumb_url,
    width: row.width,
    height: row.height,
  }));
}

// ============================================================
// Public navigation (header mega-menu)
// ============================================================
//
// The header structure is defined in code (lib/nav-fallback.ts), not in the
// CMS: menus are edited by editing that file. The one dynamic piece is the
// "Upcoming" menu, which is filled from announced events (status = announced +
// show_in_nav) so publishing an event in /admin/events keeps the header in
// sync without touching code. Everything else is static.

/** Announced, show-in-nav events shaped into Upcoming menu items. */
function eventsToNavItems(events: EventRow[]): NavItemConfig[] {
  return events.map((e) => ({
    label: e.title,
    href: e.link_url ?? null,
    description: [e.short_date, e.venue].filter(Boolean).join(" · ") || null,
    badge: e.link_url ? null : "Coming soon",
    imageUrl: null,
    gradient: null,
    ctaLabel: null,
  }));
}

async function fetchNavConfig(): Promise<NavConfig> {
  const client = publicSupabase();

  // Pull the announced events that belong in the Upcoming menu. On any error
  // (or no client) we fall back to the static Upcoming items baked into
  // NAV_FALLBACK, so the header never disappears.
  let events: EventRow[] = [];
  if (client) {
    const { data, error } = await client
      .from("cms_events")
      .select("*")
      .eq("status", "announced")
      .eq("show_in_nav", true)
      .order("display_order", { ascending: true });
    if (error) console.error("[cms-content] getNavConfig events", error);
    else events = (data ?? []) as EventRow[];
  }

  // Signal's page isn't linked yet: show it in the live "Upcoming" menu as
  // an unclickable "Coming soon" row (eventsToNavItems badges any event with
  // no link_url that way) rather than a live link, without needing a DB edit
  // to un-gate it later.
  if (!SIGNAL_LIVE) {
    events = events.map((e) =>
      e.link_url === "/signal" ? { ...e, link_url: null } : e,
    );
  }

  if (events.length === 0) return NAV_FALLBACK;

  const eventItems = eventsToNavItems(events);
  return NAV_FALLBACK.map((group) =>
    group.key === "upcoming" ? { ...group, items: eventItems } : group,
  );
}

const cachedNavConfig = unstable_cache(fetchNavConfig, ["nav-config"], {
  tags: ["nav"],
  revalidate: 300,
});

/**
 * The public header navigation. The structure is static (lib/nav-fallback.ts);
 * only the Upcoming menu is filled from announced events, cached under the
 * "nav" tag (busted by /admin/events edits). Returns the static fallback if
 * anything goes wrong so the header never disappears.
 */
export async function getNavConfig(): Promise<NavConfig> {
  try {
    const config = await cachedNavConfig();
    return config.length > 0 ? config : NAV_FALLBACK;
  } catch (error) {
    console.error("[cms-content] getNavConfig", error);
    return NAV_FALLBACK;
  }
}
