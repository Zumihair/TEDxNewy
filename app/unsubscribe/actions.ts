"use server";

import { redirect } from "next/navigation";
import { getAdminSupabase } from "@/lib/supabase-admin";

/**
 * Confirm-button unsubscribe from the /unsubscribe page. Separate from the
 * one-click POST endpoint so a mail scanner pre-fetching the link can't
 * unsubscribe someone by accident: this only fires on an explicit click.
 */
export async function confirmUnsubscribe(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  if (token) {
    try {
      const supabase = getAdminSupabase();
      await supabase
        .from("subscribers")
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq("unsubscribe_token", token)
        .is("unsubscribed_at", null);
    } catch (err) {
      console.error("[unsubscribe] confirm failed", err);
      redirect("/unsubscribe?state=error");
    }
  }
  redirect("/unsubscribe?state=done");
}
