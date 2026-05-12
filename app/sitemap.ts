import type { MetadataRoute } from "next";
import { speakers } from "@/lib/data";
import { getPublishedPosts } from "@/lib/cms-content";

const BASE = "https://tedxnewy.com.au";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes = [
    "",
    "/about",
    "/speakers",
    "/team",
    "/ideas",
    "/salons",
    "/tickets",
    "/watch",
    "/sponsors",
    "/partner",
    "/apply",
    "/nominate",
    "/contact",
    "/subscribe",
    "/privacy",
    "/terms",
    "/code-of-conduct",
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1.0 : 0.7,
  }));

  const speakerRoutes = speakers.map((s) => ({
    url: `${BASE}/speakers/${s.slug}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  // Pull live published posts so /ideas/<slug> URLs are in the sitemap
  // the moment they're published.
  const posts = await getPublishedPosts();
  const postRoutes = posts.map((p) => ({
    url: `${BASE}/ideas/${p.slug}`,
    lastModified: p.publishedAt ? new Date(p.publishedAt) : now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...speakerRoutes, ...postRoutes];
}
