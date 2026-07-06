"use server";

import { requireAdmin } from "@/lib/cms-auth";
import { batchSubscribe, mailchimpConfigured } from "@/lib/mailchimp";
import { getServerSupabase } from "@/lib/supabase-server";

/**
 * Push every active local subscriber into the Mailchimp audience. Used as a
 * one-off backfill (site signups sync automatically from then on). Only adds
 * or updates; it never unsubscribes anyone in Mailchimp.
 */
export async function syncSubscribersToMailchimp(): Promise<
  | { ok: true; sent: number; added: number; updated: number; errors: number }
  | { ok: false; error: string }
> {
  await requireAdmin();
  if (!mailchimpConfigured()) {
    return {
      ok: false,
      error:
        "Mailchimp is not configured yet. Add MAILCHIMP_API_KEY and MAILCHIMP_AUDIENCE_ID to the Vercel env vars first.",
    };
  }

  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("subscribers")
    .select("email")
    .is("unsubscribed_at", null);
  if (error) return { ok: false, error: error.message };

  const emails = Array.from(
    new Set(
      (data ?? [])
        .map((r) => String(r.email ?? "").trim().toLowerCase())
        .filter((e) => e.includes("@")),
    ),
  );
  if (emails.length === 0) {
    return { ok: true, sent: 0, added: 0, updated: 0, errors: 0 };
  }

  const res = await batchSubscribe(emails);
  return { ok: true, sent: emails.length, ...res };
}
