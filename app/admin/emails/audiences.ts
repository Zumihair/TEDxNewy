import { getServerSupabase } from "@/lib/supabase-server";

/**
 * Saved audiences for Quick Compose. Each is a named list of email addresses
 * pulled live from a submission table, so the admin can drop a whole group
 * into the To field with one click and still edit it before sending.
 *
 * These are convenience fills, not the source of truth: the To field stays
 * editable and `sendComposedEmail` re-validates every address, so nothing
 * here changes the send path.
 */
export type Audience = {
  id: string;
  label: string;
  hint: string;
  emails: string[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lowercase, trim, drop invalid, dedupe. */
function clean(values: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const v of values) {
    if (!v) continue;
    const e = String(v).trim().toLowerCase();
    if (e && EMAIL_RE.test(e)) seen.add(e);
  }
  return [...seen];
}

export async function getComposeAudiences(): Promise<Audience[]> {
  const supabase = await getServerSupabase();

  const [
    subscribers,
    talkNight,
    youthFutures,
    studentSpeaker,
    nominations,
    applications,
  ] = await Promise.all([
    supabase.from("subscribers").select("email"),
    supabase
      .from("talk_night_registrations")
      .select("email, guest_email, status"),
    supabase.from("youth_futures_registrations").select("email"),
    supabase.from("student_speaker_submissions").select("email"),
    supabase.from("nominations").select("nominator_email"),
    supabase.from("applications").select("email"),
  ]);

  const tnRows = talkNight.data ?? [];
  const tnAccepted = clean(
    tnRows.filter((r) => r.status === "accepted").map((r) => r.email),
  );
  const tnAll = clean([
    ...tnRows.map((r) => r.email),
    ...tnRows.map((r) => r.guest_email),
  ]);

  const audiences: Audience[] = [
    {
      id: "subscribers",
      label: "Subscribers",
      hint: "The newsletter list",
      emails: clean((subscribers.data ?? []).map((r) => r.email)),
    },
    {
      id: "talk-night-accepted",
      label: "Talk Night: accepted",
      hint: "Accepted for the 60-second Talk Night",
      emails: tnAccepted,
    },
    {
      id: "talk-night-all",
      label: "Talk Night: everyone",
      hint: "Everyone who registered interest, guests included",
      emails: tnAll,
    },
    {
      id: "youth-futures",
      label: "Youth Futures EOIs",
      hint: "School contacts who lodged an EOI",
      emails: clean((youthFutures.data ?? []).map((r) => r.email)),
    },
    {
      id: "student-speaker",
      label: "Student Speaker entrants",
      hint: "Student Speaker Competition entrants",
      emails: clean((studentSpeaker.data ?? []).map((r) => r.email)),
    },
    {
      id: "nominations",
      label: "Speaker nominators",
      hint: "People who nominated a speaker",
      emails: clean((nominations.data ?? []).map((r) => r.nominator_email)),
    },
    {
      id: "volunteers",
      label: "Volunteers",
      hint: "Volunteer applications",
      emails: clean((applications.data ?? []).map((r) => r.email)),
    },
  ];

  // Only surface audiences that actually have someone in them.
  return audiences.filter((a) => a.emails.length > 0);
}
