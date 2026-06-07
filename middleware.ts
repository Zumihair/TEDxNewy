import { NextResponse, type NextRequest } from "next/server";
import { getMiddlewareSupabase } from "@/lib/supabase-server";

/**
 * Refreshes the Supabase auth cookie on every request, and gates /admin
 * routes (everything except /admin/login and /admin/auth/*).
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });
  const supabase = getMiddlewareSupabase(req, res);

  // Refresh session cookie if needed
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const { pathname } = req.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isPublicAdminRoute =
    pathname === "/admin/login" || pathname.startsWith("/admin/auth");

  if (isAdminRoute && !isPublicAdminRoute && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  /*
   * Only run on /admin routes. The Supabase getUser() call is a network
   * round-trip, so running it on every public page (home, talks, etc.) just
   * added latency for no benefit — public pages don't use the session. The
   * admin session still refreshes on every /admin navigation, which covers
   * login, the auth callback, and staying signed in inside the CMS.
   */
  matcher: ["/admin/:path*"],
};
