import { type NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

/**
 * Magic-link callback. Supabase redirects here with a `?code=...` query
 * after the user clicks their email link. We exchange the code for a
 * session cookie and then redirect to wherever they were heading.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/admin";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/admin/login?error=exchange-failed`,
    );
  }

  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[admin/auth/callback] exchange error", error);
    return NextResponse.redirect(
      `${origin}/admin/login?error=exchange-failed`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
