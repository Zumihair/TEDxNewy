import type { MetadataRoute } from "next";
import { getEvents } from "@/lib/cms-content";

const BASE = "https://tedxnewy.com.au";

/**
 * The site's sitemap. Picks up:
 *   - Static public routes (homepage + every top-level page that has SEO
 *     value). Excludes /admin/*, /api/*, and /thanks.
 *   - Event pages from the live CMS.
 *
 * Speakers deliberately have no entries. Since /speakers was retired
 * (2026-08-16) a speaker is a `?speaker=<slug>` view on their event page, not
 * a page of its own, and publishing query-string variants of a URL already in
 * the sitemap is noise.
 *
 * Routes that aren't yet built (e.g. /talks/[id]) are intentionally
 * omitted until they exist.
 */
type Entry = {
  url: string;
  lastModified: Date;
  changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority: number;
};

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: Entry["changeFrequency"];
  priority: number;
}> = [
  // Homepage — highest priority. Trailing slash matches the canonical.
  { path: "/", changeFrequency: "weekly", priority: 1.0 },

  // Main editorial sections.
  { path: "/mission", changeFrequency: "monthly", priority: 0.8 },
  { path: "/team", changeFrequency: "monthly", priority: 0.6 },
  { path: "/salons", changeFrequency: "monthly", priority: 0.7 },
  { path: "/events", changeFrequency: "weekly", priority: 0.8 },
  { path: "/talks", changeFrequency: "monthly", priority: 0.85 },
  { path: "/sponsors", changeFrequency: "monthly", priority: 0.6 },
  { path: "/press", changeFrequency: "monthly", priority: 0.5 },

  // Active campaign pages — high SEO value while the date is live.
  {
    path: "/student-speaker-competition",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    path: "/60-second-talk-night",
    changeFrequency: "weekly",
    priority: 0.9,
  },

  // Conversion / action pages.
  { path: "/newcastle-2050-salon", changeFrequency: "monthly", priority: 0.75 },
  { path: "/youth-futures-lab", changeFrequency: "monthly", priority: 0.7 },
  { path: "/partner", changeFrequency: "monthly", priority: 0.6 },
  { path: "/volunteer", changeFrequency: "monthly", priority: 0.65 },
  { path: "/speak", changeFrequency: "monthly", priority: 0.65 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.55 },
  { path: "/subscribe", changeFrequency: "yearly", priority: 0.5 },

  // Legal — low priority but indexable.
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/code-of-conduct", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: Entry[] = STATIC_ROUTES.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // CMS-driven detail routes. The helper returns the fallback static list
  // if Supabase is unreachable, so we still publish a stable sitemap.
  const events = await getEvents();

  // Only events that render their own generated page belong here. Events that
  // link elsewhere (link_url set) redirect, so we skip them to avoid publishing
  // a URL that 3xx's straight away.
  const eventRoutes: Entry[] = events
    .filter((e) => !e.linkUrl)
    .map((e) => ({
      url: `${BASE}/events/${e.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  return [...staticRoutes, ...eventRoutes];
}
