import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client. Uses the publishable key, which is safe to
 * ship in env vars — RLS policies on the form-submission tables only allow
 * inserts (no reads / updates / deletes from anon).
 *
 * Env vars:
 * - SUPABASE_URL — e.g. https://gurlrjlesdbiqxhavwil.supabase.co
 * - SUPABASE_PUBLISHABLE_KEY — sb_publishable_...
 */
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set in env",
    );
  }
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

/** Pull the visitor's IP + user-agent from a Request for logging. */
export function clientMeta(req: Request) {
  const ua = req.headers.get("user-agent") ?? null;
  // Vercel sets x-forwarded-for; first entry is the client.
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || null;
  return { ua, ip };
}
