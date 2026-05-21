import type { MetadataRoute } from "next";

/**
 * Robots policy. Keeps everything public-indexable by default and blocks
 * routes that have no SEO value (admin chrome, internal APIs, form
 * success redirects).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/thanks"],
    },
    sitemap: "https://tedxnewy.com.au/sitemap.xml",
    host: "https://tedxnewy.com.au",
  };
}
