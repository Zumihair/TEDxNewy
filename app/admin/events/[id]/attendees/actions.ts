"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireFullAdmin } from "@/lib/cms-auth";
import {
  importTalkNightAttendees,
  importYouthFuturesAttendees,
  importAttendeesFromCsv,
  sendFeedbackRequests,
  importHumanitixAttendees,
} from "@/lib/event-feedback";
import { listHumanitixEvents, humanitixMatches } from "@/lib/humanitix";
import { archiveHumanitixTickets } from "@/lib/ticket-archive";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { getCheckedInEmails } from "@/lib/door";
import { flashUrl, type ToastTone } from "../../../flash";

function pathFor(id: string) {
  return `/admin/events/${encodeURIComponent(id)}/attendees`;
}

/**
 * Where to land after the action completes. `AttendeesContent.tsx` is
 * rendered both on its own standalone page AND inside the Events list's
 * Attendees chip modal (app/admin/events/page.tsx), each of its forms
 * carries a hidden `returnTo` field so a submit lands back wherever it was
 * opened from, rather than always the standalone page. Falls back to the
 * standalone page's own path if a caller ever omits it.
 */
function returnPath(formData: FormData, id: string): string {
  return String(formData.get("returnTo") ?? "").trim() || pathFor(id);
}

function backWithFlash(
  path: string,
  message: string,
  tone: ToastTone = "success",
): never {
  revalidatePath(path);
  redirect(flashUrl(path, message, tone));
}

export async function importTalkNightAction(formData: FormData) {
  await requireFullAdmin();
  const id = String(formData.get("eventId") ?? "");
  if (!id) return;
  const { imported, skipped } = await importTalkNightAttendees(id);
  backWithFlash(
    returnPath(formData, id),
    `Imported ${imported} from Talk Night registrations, skipped ${skipped} already on the list.`,
  );
}

export async function importYouthFuturesAction(formData: FormData) {
  await requireFullAdmin();
  const id = String(formData.get("eventId") ?? "");
  if (!id) return;
  const { imported, skipped } = await importYouthFuturesAttendees(id);
  backWithFlash(
    returnPath(formData, id),
    `Imported ${imported} from Youth Futures Lab EOIs, skipped ${skipped} already on the list.`,
  );
}

export async function importCsvAction(formData: FormData) {
  await requireFullAdmin();
  const id = String(formData.get("eventId") ?? "");
  const csv = String(formData.get("csv") ?? "");
  if (!id || !csv.trim()) return;
  const { imported, skipped } = await importAttendeesFromCsv(id, csv);
  backWithFlash(returnPath(formData, id), `Imported ${imported} from CSV, skipped ${skipped}.`);
}

export async function sendFeedbackRequestsAction(formData: FormData) {
  await requireFullAdmin();
  const id = String(formData.get("eventId") ?? "");
  if (!id) return;
  const { sent, queued, failed, deferred } = await sendFeedbackRequests(id);
  backWithFlash(
    returnPath(formData, id),
    `Sent ${sent} feedback request${sent === 1 ? "" : "s"}${
      queued ? `, ${queued} held for Resend and sent automatically` : ""
    }${deferred ? `, ${deferred} more will go out automatically over the next days` : ""}${
      failed ? `, ${failed} failed` : ""
    }.`,
    failed ? "warning" : "success",
  );
}

/** Signal: send the feedback request only to people who were scanned in on the day. */
export async function sendFeedbackToCheckedInAction(formData: FormData) {
  await requireFullAdmin();
  const id = String(formData.get("eventId") ?? "");
  if (!id) return;
  const came = await getCheckedInEmails();
  if (!came.ok) {
    backWithFlash(returnPath(formData, id), `Could not read check-ins: ${came.error}`, "warning");
  }
  const { sent, queued, failed, deferred } = await sendFeedbackRequests(id, came.emails);
  backWithFlash(
    returnPath(formData, id),
    `Sent ${sent} feedback request${sent === 1 ? "" : "s"} to people who checked in${
      queued ? `, ${queued} held for Resend and sent automatically` : ""
    }${deferred ? `, ${deferred} more will go out automatically over the next days` : ""}${
      failed ? `, ${failed} failed` : ""
    }.`,
    failed ? "warning" : "success",
  );
}

async function cmsEvent(id: string) {
  const { data } = await getAdminSupabase()
    .from("cms_events")
    .select("id, slug, title")
    .eq("id", id)
    .single();
  return data as { id: string; slug: string; title: string } | null;
}

/** Pull this event's ticket holders from Humanitix onto the list now, rather than waiting for the hourly sync. */
export async function syncFromHumanitixAction(formData: FormData) {
  await requireFullAdmin();
  const id = String(formData.get("eventId") ?? "");
  const event = id ? await cmsEvent(id) : null;
  if (!event) return;
  const back = returnPath(formData, id);
  const hx = await listHumanitixEvents();
  if (!hx.ok) backWithFlash(back, `Humanitix said: ${hx.error}`, "warning");
  const match = hx.data.find((h) => humanitixMatches(event, h));
  if (!match) {
    backWithFlash(back, `No Humanitix listing matches "${event.title}".`, "warning");
  }
  const res = await importHumanitixAttendees(id, match.id);
  if (res.error) backWithFlash(back, `Humanitix said: ${res.error}`, "warning");
  backWithFlash(
    back,
    `Synced from "${match.name}": added ${res.imported}, ${res.skipped} already on the list.`,
  );
}

/** Copy every ticket (raw) from Humanitix into our own database. */
export async function archiveTicketsAction(formData: FormData) {
  await requireFullAdmin();
  const id = String(formData.get("eventId") ?? "");
  const event = id ? await cmsEvent(id) : null;
  if (!event) return;
  const res = await archiveHumanitixTickets(event);
  backWithFlash(
    returnPath(formData, id),
    res.error
      ? `Archived ${res.archived} tickets, then stopped: ${res.error}`
      : `Saved ${res.archived} tickets to our own database.`,
    res.error ? "warning" : "success",
  );
}
