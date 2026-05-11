/**
 * Supabase clients for the App Router. These read/write the auth session
 * via Next.js cookies, which is how /admin stays signed in across requests.
 *
 * The public/anon `getSupabase()` from lib/supabase.ts is still used for
 * unauthenticated server-only inserts (form submissions). This file is for
 * anything that needs a user session — admin pages, server actions, the
 * middleware.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

function env() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set in env",
    );
  }
  return { url, key };
}

/**
 * Server component / route handler / server action client.
 * Reads + writes auth cookies via the Next.js cookies() API.
 */
export async function getServerSupabase() {
  const { url, key } = env();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a server component during render — fine to ignore;
          // middleware refreshes the session on each request anyway.
        }
      },
    },
  });
}

/**
 * Middleware client — given the incoming NextRequest and the outgoing
 * NextResponse, lets the server refresh the session cookie on every request.
 */
export function getMiddlewareSupabase(req: NextRequest, res: NextResponse) {
  const { url, key } = env();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          req.cookies.set(name, value);
          res.cookies.set(name, value, options);
        }
      },
    },
  });
}
