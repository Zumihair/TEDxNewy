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
    | "partner_enquiries",
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
