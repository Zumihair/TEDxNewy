"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireFullAdmin } from "@/lib/cms-auth";
import { importHumanitixAttendees } from "@/lib/event-feedback";

function backWithFlash(message: string): never {
  revalidatePath("/admin/tickets");
  redirect(`/admin/tickets?flash=${encodeURIComponent(message)}`);
}

export async function importHumanitixAttendeesAction(formData: FormData) {
  await requireFullAdmin();
  const humanitixEventId = String(formData.get("humanitixEventId") ?? "");
  const cmsEventId = String(formData.get("cmsEventId") ?? "");
  if (!humanitixEventId || !cmsEventId) {
    backWithFlash("Pick an event to import into first.");
  }
  const { imported, skipped, error } = await importHumanitixAttendees(
    cmsEventId,
    humanitixEventId,
  );
  if (error) backWithFlash(`Import failed: ${error}`);
  revalidatePath(`/admin/events/${cmsEventId}/attendees`);
  backWithFlash(
    `Imported ${imported} attendee${imported === 1 ? "" : "s"} from Humanitix, skipped ${skipped} already on the list.`,
  );
}
