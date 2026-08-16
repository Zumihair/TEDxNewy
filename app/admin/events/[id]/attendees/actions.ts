"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireFullAdmin } from "@/lib/cms-auth";
import {
  importTalkNightAttendees,
  importAttendeesFromCsv,
  sendFeedbackRequests,
} from "@/lib/event-feedback";

function pathFor(id: string) {
  return `/admin/events/${encodeURIComponent(id)}/attendees`;
}

function backWithFlash(id: string, message: string): never {
  revalidatePath(pathFor(id));
  redirect(`${pathFor(id)}?flash=${encodeURIComponent(message)}`);
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
  );
}
