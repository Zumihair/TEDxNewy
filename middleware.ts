import { NextResponse, type NextRequest } from "next/server";
import { getMiddlewareSupabase } from "@/lib/supabase-server";
import { EVENT_TOOLS_LIVE } from "@/lib/feature-flags";

/**
 * Refreshes the Supabase auth cookie on every request, and gates /admin
 * routes (everything except /admin/login and /admin/auth/*).
 */
export async function middleware(req: NextRequest) {
  // Event-day tools are switched off between events (see EVENT_TOOLS_LIVE).
  const path = req.nextUrl.pathname;
  if (
    !EVENT_TOOLS_LIVE &&
    (path.startsWith("/signal/links") ||
      path.startsWith("/door") ||
      path.startsWith("/api/door") ||
      path.startsWith("/api/side-quest"))
  ) {
    if (path.startsWith("/signal/links")) {
      // Old QR codes land on the recap instead of an error.
      const res = NextResponse.redirect(new URL("/signal", req.url), 307);
      res.headers.set("X-Robots-Tag", "noindex, nofollow");
      return res;
    }
    return new NextResponse("Not found", {
      status: 404,
      headers: { "X-Robots-Tag": "noindex, nofollow" },
    });
  }

  // Stamp the path so server code can tell which workspace a request is for
  // (requireFullAdmin reads it, including for server actions).
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  requestHeaders.set("x-method", req.method);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  const supabase = getMiddlewareSupabase(req, res);

  // Refresh session cookie if needed
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) return res;
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
  matcher: [
    "/admin/:path*",
    "/signal/links/:path*",
    "/door/:path*",
    "/api/door/:path*",
    "/api/side-quest/:path*",
  ],
};
