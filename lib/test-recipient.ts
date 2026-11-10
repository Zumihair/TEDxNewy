import "server-only";
import { getAdminSupabase } from "@/lib/supabase-admin";

/**
 * Where a "send test" email should go for the signed-in admin.
 *
 * Password logins sign in as a made-up address on the admin subdomain
 * (will@admin.tedxnewy.com.au) that has no mailbox, so a test sent there never
 * arrives. Use the real email on the linked Team profile instead. A login that
 * is already a real address (an older personal login) is used as is.
 */
const LOGIN_DOMAIN = "@admin.tedxnewy.com.au";

export async function testRecipientFor(admin: {
  email: string;
  teamSlug: string | null;
}): Promise<{ ok: true; to: string } | { ok: false; error: string }> {
  if (!admin.email.endsWith(LOGIN_DOMAIN)) return { ok: true, to: admin.email };

  if (admin.teamSlug) {
    const { data } = await getAdminSupabase()
      .from("cms_team_members")
      .select("email")
      .eq("slug", admin.teamSlug)
      .maybeSingle();
    const real = typeof data?.email === "string" ? data.email.trim() : "";
    if (real) return { ok: true, to: real };
  }

  return {
    ok: false,
    error: "Add your email to your Team profile so test emails have somewhere to go.",
  };
}
