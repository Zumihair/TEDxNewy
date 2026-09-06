"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireFullAdmin } from "@/lib/cms-auth";
import {
  importTalkNightAttendees,
  importYouthFuturesAttendees,
  importStudentSpeakerAttendees,
  importAttendeesFromCsv,
  sendFeedbackRequests,
} from "@/lib/event-feedback";
import { flashUrl, type ToastTone } from "../../../flash";

function pathFor(id: string) {
  return `/admin/events/${encodeURIComponent(id)}/attendees`;
}

function backWithFlash(
  id: string,
  message: string,
  tone: ToastTone = "success",
): never {
  revalidatePath(pathFor(id));
  redirect(flashUrl(pathFor(id), message, tone));
}

export async function importTalkNightAction(formData: FormData) {
  await requireFullAdmin();
  const id = String(formData.get("eventId") ?? "");
  if (!id) return;
  const { imported, skipped } = await importTalkNightAttendees(id);
  backWithFlash(
    id,
    `Imported ${imported} from Talk Night registrations, skipped ${skipped} already on the list.`,
  );
}

export async function importYouthFuturesAction(formData: FormData) {
  await requireFullAdmin();
  const id = String(formData.get("eventId") ?? "");
  if (!id) return;
  const { imported, skipped } = await importYouthFuturesAttendees(id);
  backWithFlash(
    id,
    `Imported ${imported} from Youth Futures Lab EOIs, skipped ${skipped} already on the list.`,
  );
}

export async function importStudentSpeakerAction(formData: FormData) {
  await requireFullAdmin();
  const id = String(formData.get("eventId") ?? "");
  if (!id) return;
  const { imported, skipped } = await importStudentSpeakerAttendees(id);
  backWithFlash(
    id,
    `Imported ${imported} from Student Speaker Competition entries, skipped ${skipped} already on the list.`,
  );
}

export async function importCsvAction(formData: FormData) {
  await requireFullAdmin();
  const id = String(formData.get("eventId") ?? "");
  const csv = String(formData.get("csv") ?? "");
  if (!id || !csv.trim()) return;
  const { imported, skipped } = await importAttendeesFromCsv(id, csv);
  backWithFlash(id, `Imported ${imported} from CSV, skipped ${skipped}.`);
}

export async function sendFeedbackRequestsAction(formData: FormData) {
  await requireFullAdmin();
  const id = String(formData.get("eventId") ?? "");
  if (!id) return;
  const { sent, failed } = await sendFeedbackRequests(id);
  backWithFlash(
    id,
    `Sent ${sent} feedback request${sent === 1 ? "" : "s"}${
      failed ? `, ${failed} failed` : ""
    }.`,
    failed ? "warning" : "success",
  );
}
