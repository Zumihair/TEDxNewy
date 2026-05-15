"use client";

/**
 * Supabase client for the browser. Reads the auth cookie set by
 * @supabase/ssr on the server, so the user's session — and therefore
 * their admin status — flows through to Storage uploads automatically.
 *
 * Singleton per browser tab.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or the non-prefixed names).",
    );
  }
  _client = createBrowserClient(url, key);
  return _client;
}

export type { SupabaseClient };
