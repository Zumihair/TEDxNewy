/**
 * Read-only "where has each event photo been used" feed for
 * `components/GalleryPicker.tsx`.
 *
 * A route rather than a direct browser query because the picker also runs on
 * /team-brand, which has no admin session: `social_posts` / `newsletters` are
 * admin-RLS, so a browser query there would silently come back empty. Signed-in
 * admins get the full detail (which draft, what status); everyone else gets the
 * marks alone, no draft titles.
 */
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/cms-auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { getPhotoUsage, stripUsageDetail } from "@/lib/photo-usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requesterIsAdmin(): Promise<boolean> {
  const user = await getSessionUser();
  const email = user?.email?.toLowerCase();
  if (!email) return false;
  const { data } = await getAdminSupabase()
    .from("cms_admins")
    .select("email")
    .ilike("email", email)
    .limit(1);
  return !!data && data.length > 0;
}

export async function GET() {
  try {
    const [usage, isAdmin] = await Promise.all([
      getPhotoUsage(),
      requesterIsAdmin(),
    ]);
    return NextResponse.json(
      { usage: isAdmin ? usage : stripUsageDetail(usage), detail: isAdmin },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    // Usage marks are a nicety: never let them break the picker.
    return NextResponse.json(
      { usage: {}, detail: false },
      { headers: { "cache-control": "no-store" } },
    );
  }
}
