"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { getSupabase } from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Bulk-import subscriber emails (e.g. a Mailchimp export). Admin-gated. Counts
 * which addresses are new versus already on the list (via the admin client,
 * which can read), then inserts the new ones through the anon client, exactly
 * the path the public signup form uses, so the RLS insert policy is satisfied
 * without needing a service key.
 *
 * Existing rows are left untouched: anyone who previously unsubscribed stays
 * unsubscribed, so an import can never silently re-subscribe someone.
 */
export async function importSubscribers(
  emails: string[],
): Promise<{ added: number; existing: number; total: number }> {
  await requireFullAdmin();

  const cleaned = Array.from(
    new Set(
      (Array.isArray(emails) ? emails : [])
        .map((e) => String(e).trim().toLowerCase())
        .filter((e) => EMAIL_RE.test(e)),
    ),
  );
  if (cleaned.length === 0) return { added: 0, existing: 0, total: 0 };

  const CHUNK = 200;
  const admin = await getServerSupabase();
  const existing = new Set<string>();
  for (let i = 0; i < cleaned.length; i += CHUNK) {
    const slice = cleaned.slice(i, i + CHUNK);
    const { data } = await admin
      .from("subscribers")
      .select("email")
      .in("email", slice);
    for (const r of data ?? []) existing.add(String(r.email).toLowerCase());
  }

  const toInsert = cleaned.filter((e) => !existing.has(e));
  if (toInsert.length > 0) {
    const anon = getSupabase();
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const slice = toInsert.slice(i, i + CHUNK);
      // Plain insert: already filtered against existing rows, and an
      // ON CONFLICT upsert errors until the unique email index exists.
      await anon
        .from("subscribers")
        .insert(slice.map((email) => ({ email, source: "mailchimp-import" })));
    }
  }

  revalidatePath("/admin/subscribers");
  return { added: toInsert.length, existing: existing.size, total: cleaned.length };
}

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
    | "student_speaker_submissions"
    | "talk_night_registrations",
  formData: FormData,
  redirectPath: string,
) {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await getServerSupabase();
  // `count: "exact"` lets us tell a real delete from a silent RLS no-op.
  // Without a delete policy on the table, RLS removes zero rows yet returns
  // no error, so the only signal that nothing happened is count === 0.
  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .eq("id", id);
  if (error || !count) {
    redirect(`${redirectPath}?error=delete`);
  }
  revalidatePath(redirectPath);
  redirect(`${redirectPath}?deleted=1`);
}

export async function deleteSubscriber(formData: FormData) {
  await deleteFrom("subscribers", formData, "/admin/subscribers");
}
export async function deleteApplication(formData: FormData) {
  await deleteFrom("applications", formData, "/admin/forms/volunteers");
}
export async function deleteNomination(formData: FormData) {
  await deleteFrom("nominations", formData, "/admin/forms/nominations");
}
export async function deleteContactMessage(formData: FormData) {
  await deleteFrom("contact_messages", formData, "/admin/forms/contact");
}
export async function deletePartnerEnquiry(formData: FormData) {
  await deleteFrom("partner_enquiries", formData, "/admin/forms/sponsors");
}
export async function deleteYouthFutures(formData: FormData) {
  await deleteFrom(
    "youth_futures_registrations",
    formData,
    "/admin/forms/youth-futures",
  );
}
export async function deleteStudentSpeaker(formData: FormData) {
  await deleteFrom(
    "student_speaker_submissions",
    formData,
    "/admin/forms/student-speaker",
  );
}
/** Same delete, different redirect target: the Submissions chip on
 *  /admin/events renders this same table's rows inside a modal there
 *  (app/admin/events/page.tsx), so a delete from that context needs to land
 *  back on the Events page, not the Forms hub tab this table also lives on. */
export async function deleteStudentSpeakerFromEvents(formData: FormData) {
  await deleteFrom(
    "student_speaker_submissions",
    formData,
    "/admin/events",
  );
}
export async function deleteTalkNight(formData: FormData) {
  await deleteFrom(
    "talk_night_registrations",
    formData,
    "/admin/forms/talk-night",
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
    | "student_speaker_submissions"
    | "talk_night_registrations",
  formData: FormData,
  redirectPath: string,
) {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const contacted = formData.get("contacted") === "1";
  const supabase = await getServerSupabase();
  await supabase.from(table).update({ contacted }).eq("id", id);
  revalidatePath(redirectPath);
}

export async function setApplicationContacted(formData: FormData) {
  await setContactedOn("applications", formData, "/admin/forms/volunteers");
}
export async function setNominationContacted(formData: FormData) {
  await setContactedOn("nominations", formData, "/admin/forms/nominations");
}
export async function setContactMessageContacted(formData: FormData) {
  await setContactedOn(
    "contact_messages",
    formData,
    "/admin/forms/contact",
  );
}
export async function setPartnerEnquiryContacted(formData: FormData) {
  await setContactedOn(
    "partner_enquiries",
    formData,
    "/admin/forms/sponsors",
  );
}
export async function setYouthFuturesContacted(formData: FormData) {
  await setContactedOn(
    "youth_futures_registrations",
    formData,
    "/admin/forms/youth-futures",
  );
}
export async function setStudentSpeakerContacted(formData: FormData) {
  await setContactedOn(
    "student_speaker_submissions",
    formData,
    "/admin/forms/student-speaker",
  );
}
export async function setTalkNightContacted(formData: FormData) {
  await setContactedOn(
    "talk_night_registrations",
    formData,
    "/admin/forms/talk-night",
  );
}

/**
 * Talk Night applicant pipeline. The form posts { id, status } where status
 * is one of new / accepted / declined. No redirect — the table flips the
 * badge optimistically; this persists + revalidates. Status is whitelisted
 * here so the client can never write an off-pipeline value.
 */
const TALK_NIGHT_STATUSES = ["new", "accepted", "declined"] as const;

export async function setTalkNightStatus(formData: FormData) {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id) return;
  if (!(TALK_NIGHT_STATUSES as readonly string[]).includes(status)) return;
  const supabase = await getServerSupabase();
  await supabase
    .from("talk_night_registrations")
    .update({ status })
    .eq("id", id);
  revalidatePath("/admin/forms/talk-night");
}

/**
 * Bulk delete. The form posts { ids } as a comma-separated list. Mirrors
 * `deleteFrom`: `count: "exact"` distinguishes a real delete from a silent
 * RLS no-op. Reports how many rows actually went, so a partial RLS failure
 * still surfaces rather than reading as a clean sweep.
 */
async function bulkDeleteFrom(
  table: Parameters<typeof deleteFrom>[0],
  formData: FormData,
  redirectPath: string,
) {
  await requireFullAdmin();
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length === 0) {
    redirect(redirectPath);
  }
  const supabase = await getServerSupabase();
  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .in("id", ids);
  if (error || !count) {
    redirect(`${redirectPath}?error=delete`);
  }
  revalidatePath(redirectPath);
  redirect(`${redirectPath}?deleted=${count}`);
}

/**
 * Bulk set the contacted flag. The form posts { ids, contacted }. No
 * redirect — the table updates optimistically, this persists + revalidates.
 */
async function bulkSetContactedOn(
  table: Parameters<typeof setContactedOn>[0],
  formData: FormData,
  redirectPath: string,
) {
  await requireFullAdmin();
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length === 0) return;
  const contacted = formData.get("contacted") === "1";
  const supabase = await getServerSupabase();
  await supabase.from(table).update({ contacted }).in("id", ids);
  revalidatePath(redirectPath);
}

export async function bulkDeleteSubscribers(formData: FormData) {
  await bulkDeleteFrom("subscribers", formData, "/admin/subscribers");
}
export async function bulkDeleteApplications(formData: FormData) {
  await bulkDeleteFrom("applications", formData, "/admin/forms/volunteers");
}
export async function bulkDeleteNominations(formData: FormData) {
  await bulkDeleteFrom("nominations", formData, "/admin/forms/nominations");
}
export async function bulkDeleteContactMessages(formData: FormData) {
  await bulkDeleteFrom(
    "contact_messages",
    formData,
    "/admin/forms/contact",
  );
}
export async function bulkDeletePartnerEnquiries(formData: FormData) {
  await bulkDeleteFrom(
    "partner_enquiries",
    formData,
    "/admin/forms/sponsors",
  );
}
export async function bulkDeleteYouthFutures(formData: FormData) {
  await bulkDeleteFrom(
    "youth_futures_registrations",
    formData,
    "/admin/forms/youth-futures",
  );
}
export async function bulkDeleteStudentSpeaker(formData: FormData) {
  await bulkDeleteFrom(
    "student_speaker_submissions",
    formData,
    "/admin/forms/student-speaker",
  );
}
/** Events-page-modal counterpart of `bulkDeleteStudentSpeaker`, see
 *  `deleteStudentSpeakerFromEvents` for why this needs its own redirect. */
export async function bulkDeleteStudentSpeakerFromEvents(formData: FormData) {
  await bulkDeleteFrom(
    "student_speaker_submissions",
    formData,
    "/admin/events",
  );
}
export async function bulkDeleteTalkNight(formData: FormData) {
  await bulkDeleteFrom(
    "talk_night_registrations",
    formData,
    "/admin/forms/talk-night",
  );
}

export async function bulkSetApplicationsContacted(formData: FormData) {
  await bulkSetContactedOn("applications", formData, "/admin/forms/volunteers");
}
export async function bulkSetNominationsContacted(formData: FormData) {
  await bulkSetContactedOn("nominations", formData, "/admin/forms/nominations");
}
export async function bulkSetContactMessagesContacted(formData: FormData) {
  await bulkSetContactedOn(
    "contact_messages",
    formData,
    "/admin/forms/contact",
  );
}
export async function bulkSetPartnerEnquiriesContacted(formData: FormData) {
  await bulkSetContactedOn(
    "partner_enquiries",
    formData,
    "/admin/forms/sponsors",
  );
}
export async function bulkSetYouthFuturesContacted(formData: FormData) {
  await bulkSetContactedOn(
    "youth_futures_registrations",
    formData,
    "/admin/forms/youth-futures",
  );
}
export async function bulkSetStudentSpeakerContacted(formData: FormData) {
  await bulkSetContactedOn(
    "student_speaker_submissions",
    formData,
    "/admin/forms/student-speaker",
  );
}
export async function bulkSetTalkNightContacted(formData: FormData) {
  await bulkSetContactedOn(
    "talk_night_registrations",
    formData,
    "/admin/forms/talk-night",
  );
}
