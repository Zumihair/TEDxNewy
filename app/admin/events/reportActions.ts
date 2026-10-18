"use server";

import { revalidatePath } from "next/cache";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";

/**
 * An event's report is whatever file or link you attach: a PDF, a deck, a web page. Stored on the event
 * (cms_events.report_url and report_title, migration 20261019_access_permissions.sql). Returns an error
 * message, or null when it worked.
 */
export async function setEventReport(eventId: string, title: string, url: string): Promise<string | null> {
  await requireFullAdmin();
  const cleanUrl = url.trim();
  if (!eventId || !/^https?:\/\//i.test(cleanUrl)) return "Add a link that starts with https://";
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("cms_events")
    .update({ report_url: cleanUrl, report_title: title.trim() || "Report" })
    .eq("id", eventId);
  if (error) return /report_url|report_title/.test(error.message) ? "The database update for reports has not been run yet." : error.message;
  revalidatePath("/admin/events");
  return null;
}

export async function clearEventReport(eventId: string): Promise<string | null> {
  await requireFullAdmin();
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("cms_events").update({ report_url: null, report_title: null }).eq("id", eventId);
  if (error) return error.message;
  revalidatePath("/admin/events");
  return null;
}
