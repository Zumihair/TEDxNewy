/**
 * Helpers for admin authentication + authorisation.
 *
 * - `requireAdmin()` returns the authenticated admin user (either access
 *   level), or redirects to /admin/login if they're not signed in or not in
 *   cms_admins.
 * - `requireFullAdmin()` additionally bounces community-access admins.
 * - `getSessionUser()` returns the current user (or null), cached per request.
 * - `getAdminAccess()` returns the level without redirecting, for the layout.
 *
 * The Supabase calls are wrapped in React `cache`, so several admin components
 * rendering in one request share a single Auth round trip and a single
 * allowlist lookup instead of each repeating them.
 */
import { cache } from "react";
import { redirect } from "next/navigation";
import { getServerSupabase } from "./supabase-server";

/** What an admin is allowed to reach. See app/admin/access.ts for the map. */
export type AdminAccess = "full" | "community";

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
 * This email's cms_admins row, or null if they're not on the allowlist.
 * Cached per request per email so a page that calls requireAdmin() more than
 * once only hits the table once.
 *
 * `select("*")` rather than naming access_level on purpose: if the migration
 * hasn't been applied yet, naming a missing column fails the whole query and
 * locks everyone out. Reading it off the row instead degrades to "full".
 */
const adminRecordFor = cache(
  async (email: string): Promise<Record<string, unknown> | null> => {
    const supabase = await getServerSupabase();
    const { data: rows } = await supabase
      .from("cms_admins")
      .select("*")
      .ilike("email", email)
      .limit(1);
    return rows?.[0] ?? null;
  },
);

function levelOf(row: Record<string, unknown> | null): AdminAccess {
  return row?.access_level === "community" ? "community" : "full";
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin/login");
  }
  const email = user.email?.toLowerCase();
  if (!email) {
    redirect("/admin/login?error=no-email");
  }
  const row = await adminRecordFor(email);
  if (!row) {
    // Signed in but not on the allowlist — sign them back out + bounce
    const supabase = await getServerSupabase();
    await supabase.auth.signOut();
    redirect("/admin/login?error=not-admin");
  }
  return { user, email, access: levelOf(row) };
}

/**
 * Guard for every admin page and action outside the Community group. A
 * community-access admin gets bounced to the dashboard with a message rather
 * than a blank page.
 */
export async function requireFullAdmin() {
  const admin = await requireAdmin();
  if (admin.access !== "full") {
    redirect("/admin?denied=1");
  }
  return admin;
}

/**
 * The signed-in admin's access level, or null if they aren't one. Does not
 * redirect: the layout renders for /admin/login too.
 */
export async function getAdminAccess(): Promise<AdminAccess | null> {
  const user = await getSessionUser();
  const email = user?.email?.toLowerCase();
  if (!email) return null;
  const row = await adminRecordFor(email);
  return row ? levelOf(row) : null;
}

export async function getCurrentAdmin() {
  return getSessionUser();
}
