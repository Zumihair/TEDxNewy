"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireFullAdmin } from "@/lib/cms-auth";
import {
  importTalkNightAttendees,
  importYouthFuturesAttendees,
  importAttendeesFromCsv,
  sendFeedbackRequests,
} from "@/lib/event-feedback";
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
  const { sent, failed } = await sendFeedbackRequests(id);
  backWithFlash(
    returnPath(formData, id),
    `Sent ${sent} feedback request${sent === 1 ? "" : "s"}${
      failed ? `, ${failed} failed` : ""
    }.`,
    failed ? "warning" : "success",
  );
}
