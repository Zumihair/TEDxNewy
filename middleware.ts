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
  matcher: [
    /*
     * Match all routes except static files + Next internals.
     * The session refresh runs on every page (cheap) so the admin
     * stays signed in even after navigating away.
     */
    "/((?!_next/static|_next/image|favicon.ico|brand/|images/|video/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mov|webm|woff2?|ttf|otf|ico)$).*)",
  ],
};
