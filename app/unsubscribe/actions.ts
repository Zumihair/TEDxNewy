"use server";

import { redirect } from "next/navigation";
import { unsubscribeMember } from "@/lib/mailchimp";
import { getAdminSupabase } from "@/lib/supabase-admin";

/**
 * Confirm-button unsubscribe from the /unsubscribe page. Separate from the
 * one-click POST endpoint so a mail scanner pre-fetching the link can't
 * unsubscribe someone by accident: this only fires on an explicit click.
 * Also propagates to the Mailchimp audience so campaign sends stop too.
 */
export async function confirmUnsubscribe(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  if (token) {
    try {
      const supabase = getAdminSupabase();
      const { data: sub } = await supabase
        .from("subscribers")
        .select("email")
        .eq("unsubscribe_token", token)
        .maybeSingle();
      await supabase
        .from("subscribers")
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq("unsubscribe_token", token)
        .is("unsubscribed_at", null);
      if (sub?.email) {
        await unsubscribeMember(String(sub.email)).catch((err) =>
          console.error("[unsubscribe] mailchimp sync failed", err),
        );
      }
    } catch (err) {
      console.error("[unsubscribe] confirm failed", err);
      redirect("/unsubscribe?state=error");
    }
  }
  redirect("/unsubscribe?state=done");
}
