import type { MetadataRoute } from "next";
import { speakers } from "@/lib/data";

const BASE = "https://tedxnewy.com.au";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    "",
    "/about",
    "/speakers",
    "/salons",
    "/tickets",
    "/watch",
    "/sponsors",
    "/apply",
    "/nominate",
    "/contact",
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

  return [...staticRoutes, ...speakerRoutes];
}
