/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Headless Chromium for the admin impact-report PDF route
  // (app/api/admin/reports/[id]/pdf). These ship their own binaries and must
  // not be bundled.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // lib/og-card.tsx reads files from public/ with a runtime path, so Next's
  // file tracing pulls the whole public folder into every OG image function.
  // With videos and downloads in there that sits right at Vercel's 250 MB
  // function limit, and a handful of new photos tipped a deploy over it. These
  // folders are served as plain static files and are never read by a function,
  // so keep them out of the function bundles. (Photos and logos the cards use
  // stay traced.)
  outputFileTracingExcludes: {
    "*": [
      "./public/video/**",
      "./public/downloads/**",
      "./public/*.pdf",
      "./public/images/social/**",
      "./public/images/signal-illustrations/**",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [320, 420, 640, 768, 1024, 1280, 1536, 1920],
    qualities: [75, 80],
  },
  // Expose the same server env vars under NEXT_PUBLIC_ names so the
  // browser-side Supabase client (used for /admin uploads) can read them.
  // The publishable key is safe to ship; RLS still gates every write.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  },
  // Temporary redirects from the old slugs so existing links and bookmarks
  // keep working. Marked temporary (307) — revisit in ~30 days and either
  // make permanent (better for SEO) or remove. Query strings are preserved.
  async redirects() {
    return [
      { source: "/watch", destination: "/talks", permanent: false },
      // The brand hub moved into the admin (2026-10-16).
      { source: "/team-brand", destination: "/admin/brand", permanent: false },
      { source: "/apply", destination: "/volunteer", permanent: false },
      { source: "/nominate", destination: "/speak", permanent: false },
      { source: "/about", destination: "/mission", permanent: false },
      { source: "/tickets", destination: "/newcastle-2050-salon", permanent: false },
      // /speakers was retired 2026-08-16. Speaker bios now open in place on
      // the event page (and on /talks) via components/SpeakerLineup.tsx, so
      // there is no index to send people to. /talks is the closest equivalent:
      // it is the archive those speakers appear in.
      { source: "/speakers", destination: "/talks", permanent: false },
      { source: "/speakers/:slug", destination: "/talks", permanent: false },
      // /press became /media (2026-09-29): the page is now a media kit for
      // collaborators as much as journalists.
      { source: "/press", destination: "/media", permanent: true },
      // The email signature banner links here (2026-11-20), so the campaign it
      // points at can change without touching any signature already sent.
      // To change the target: edit `destination` below (and swap
      // public/brand/sig/banner.png) in one commit.
      { source: "/sig/banner", destination: "/subscribe", permanent: false },
    ];
  },
  async headers() {
    return [
      // Gmail and Outlook cache signature images; a short cache lets a swapped
      // banner.png refresh on new opens (sent mail can take up to a day).
      {
        source: "/brand/sig/banner.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
    ];
  },
};

module.exports = nextConfig;
