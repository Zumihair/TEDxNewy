/**
 * Service-role Supabase client. Bypasses RLS, so it is ONLY imported by
 * server-only code that has no admin session of its own:
 *   - the newsletter cron route (app/api/cron/newsletter)
 *   - the unsubscribe routes (app/unsubscribe, app/api/unsubscribe)
 *   - the newsletter send pipeline (lib/newsletter-send)
 *
 * Never import this from a client component or anything reachable by the
 * browser. The key is read lazily inside the factory so a missing env var
 * only errors when a route actually runs, not at build time.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SECRET_KEY must be set for the service client",
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
