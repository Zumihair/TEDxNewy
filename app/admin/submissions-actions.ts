"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";

/**
 * Shared delete actions for the form-submission viewers. Each one is a thin
 * wrapper so the table can call it without needing to know table names.
 */

async function deleteFrom(
  table:
    | "subscribers"
    | "applications"
    | "nominations"
    | "contact_messages"
    | "partner_enquiries"
    | "youth_futures_registrations"
    | "student_speaker_submissions",
  formData: FormData,
  redirectPath: string,
) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await getServerSupabase();
  await supabase.from(table).delete().eq("id", id);
  revalidatePath(redirectPath);
  redirect(`${redirectPath}?deleted=1`);
}

export async function deleteSubscriber(formData: FormData) {
  await deleteFrom("subscribers", formData, "/admin/subscribers");
}
export async function deleteApplication(formData: FormData) {
  await deleteFrom("applications", formData, "/admin/applications");
}
export async function deleteNomination(formData: FormData) {
  await deleteFrom("nominations", formData, "/admin/nominations");
}
export async function deleteContactMessage(formData: FormData) {
  await deleteFrom("contact_messages", formData, "/admin/contact-messages");
}
export async function deletePartnerEnquiry(formData: FormData) {
  await deleteFrom("partner_enquiries", formData, "/admin/partner-enquiries");
}
export async function deleteYouthFutures(formData: FormData) {
  await deleteFrom(
    "youth_futures_registrations",
    formData,
    "/admin/youth-futures",
  );
}
export async function deleteStudentSpeaker(formData: FormData) {
  await deleteFrom(
    "student_speaker_submissions",
    formData,
    "/admin/student-speaker-competition",
  );
}

/**
 * Mark a submission as contacted (or not). Mirrors `deleteFrom`: a thin
 * per-table wrapper keeps the table name off the client. The form posts
 * { id, contacted } where contacted is "1" for true. No redirect — the
 * table flips the checkbox optimistically; this just persists + revalidates.
 */
async function setContactedOn(
  table:
    | "applications"
    | "nominations"
    | "contact_messages"
    | "partner_enquiries"
    | "youth_futures_registrations"
    | "student_speaker_submissions",
  formData: FormData,
  redirectPath: string,
) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const contacted = formData.get("contacted") === "1";
  const supabase = await getServerSupabase();
  await supabase.from(table).update({ contacted }).eq("id", id);
  revalidatePath(redirectPath);
}

export async function setApplicationContacted(formData: FormData) {
  await setContactedOn("applications", formData, "/admin/applications");
}
export async function setNominationContacted(formData: FormData) {
  await setContactedOn("nominations", formData, "/admin/nominations");
}
export async function setContactMessageContacted(formData: FormData) {
  await setContactedOn(
    "contact_messages",
    formData,
    "/admin/contact-messages",
  );
}
export async function setPartnerEnquiryContacted(formData: FormData) {
  await setContactedOn(
    "partner_enquiries",
    formData,
    "/admin/partner-enquiries",
  );
}
export async function setYouthFuturesContacted(formData: FormData) {
  await setContactedOn(
    "youth_futures_registrations",
    formData,
    "/admin/youth-futures",
  );
}
export async function setStudentSpeakerContacted(formData: FormData) {
  await setContactedOn(
    "student_speaker_submissions",
    formData,
    "/admin/student-speaker-competition",
  );
}
