/**
 * Helpers for admin authentication + authorisation.
 *
 * - `requireAdmin()` returns the authenticated admin user, or redirects
 *   to /admin/login if they're not signed in or not in cms_admins.
 * - `getSessionUser()` returns the current user (or null), cached per request.
 *
 * The Supabase calls are wrapped in React `cache`, so several admin components
 * rendering in one request share a single Auth round trip and a single
 * allowlist lookup instead of each repeating them.
 */
import { cache } from "react";
import { redirect } from "next/navigation";
import { getServerSupabase } from "./supabase-server";

/**
 * The authenticated user for this request, or null if there is none. Cached
 * so the layout and page share one `getUser()` round trip.
 */
export const getSessionUser = cache(async () => {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

/**
 * Is this email on the cms_admins allowlist? Cached per request per email so a
 * page that calls requireAdmin() more than once only hits the table once.
 */
const isEmailAdmin = cache(async (email: string): Promise<boolean> => {
  const supabase = await getServerSupabase();
  const { data: rows } = await supabase
    .from("cms_admins")
    .select("email")
    .ilike("email", email)
    .limit(1);
  return !!rows && rows.length > 0;
});

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin/login");
  }
  const email = user.email?.toLowerCase();
  if (!email) {
    redirect("/admin/login?error=no-email");
  }
  const allowed = await isEmailAdmin(email);
  if (!allowed) {
    // Signed in but not on the allowlist — sign them back out + bounce
    const supabase = await getServerSupabase();
    await supabase.auth.signOut();
    redirect("/admin/login?error=not-admin");
  }
  return { user, email };
}

export async function getCurrentAdmin() {
  return getSessionUser();
}
