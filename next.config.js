/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
};

module.exports = nextConfig;
