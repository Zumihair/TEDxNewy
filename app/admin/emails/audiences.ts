import { getServerSupabase } from "@/lib/supabase-server";

/**
 * Saved audiences for Quick Compose. Each is a named group whose emails are
 * pulled live from a submission table, so the admin can drop a whole list into
 * the To field with one click and still edit it before sending.
 *
 * These are convenience fills, not the source of truth: the To field stays
 * editable and `sendComposedEmail` re-validates every address, so nothing
 * here changes the send path.
 *
 * The page loads only the counts up front (cheap head queries), and the full
 * email list for a single audience is fetched on demand when its chip is
 * clicked, so opening Compose no longer reads every recipient of every table.
 */
export type Audience = {
  id: string;
  label: string;
  hint: string;
  emails: string[];
};

/** What the chips render before any list is fetched: the label and a count. */
export type AudienceSummary = {
  id: string;
  label: string;
  hint: string;
  count: number;
};

type AudienceDef = { id: string; label: string; hint: string };

const AUDIENCE_DEFS: AudienceDef[] = [
  { id: "subscribers", label: "Subscribers", hint: "The newsletter list" },
  {
    id: "talk-night-accepted",
    label: "Talk Night: accepted",
    hint: "Accepted for the 60-second Talk Night",
  },
  {
    id: "talk-night-all",
    label: "Talk Night: everyone",
    hint: "Everyone who registered interest, guests included",
  },
  {
    id: "youth-futures",
    label: "Youth Futures EOIs",
    hint: "School contacts who lodged an EOI",
  },
  {
    id: "student-speaker",
    label: "Student Speaker entrants",
    hint: "Student Speaker Competition entrants",
  },
  {
    id: "nominations",
    label: "Speaker nominators",
    hint: "People who nominated a speaker",
  },
  { id: "volunteers", label: "Volunteers", hint: "Volunteer applications" },
];

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

/**
 * Counts only, via head queries in parallel: no recipient lists are read here.
 * "talk-night-all" counts registration rows; the accurate merged list
 * (including guest emails) is produced when the chip is actually fetched.
 */
export async function getComposeAudienceSummaries(): Promise<AudienceSummary[]> {
  const supabase = await getServerSupabase();

  const [
    subscribers,
    tnAccepted,
    tnAll,
    youthFutures,
    studentSpeaker,
    nominations,
    applications,
  ] = await Promise.all([
    supabase.from("subscribers").select("email", { count: "exact", head: true }),
    supabase
      .from("talk_night_registrations")
      .select("email", { count: "exact", head: true })
      .eq("status", "accepted"),
    supabase
      .from("talk_night_registrations")
      .select("email", { count: "exact", head: true }),
    supabase
      .from("youth_futures_registrations")
      .select("email", { count: "exact", head: true }),
    supabase
      .from("student_speaker_submissions")
      .select("email", { count: "exact", head: true }),
    supabase
      .from("nominations")
      .select("nominator_email", { count: "exact", head: true }),
    supabase.from("applications").select("email", { count: "exact", head: true }),
  ]);

  const counts: Record<string, number> = {
    subscribers: subscribers.count ?? 0,
    "talk-night-accepted": tnAccepted.count ?? 0,
    "talk-night-all": tnAll.count ?? 0,
    "youth-futures": youthFutures.count ?? 0,
    "student-speaker": studentSpeaker.count ?? 0,
    nominations: nominations.count ?? 0,
    volunteers: applications.count ?? 0,
  };

  return AUDIENCE_DEFS.map((d) => ({ ...d, count: counts[d.id] ?? 0 })).filter(
    (a) => a.count > 0,
  );
}

/**
 * The full, cleaned, deduped email list for a single audience. Run on demand
 * when a chip is clicked, so only the group the admin wants is ever read.
 */
export async function getAudienceEmails(id: string): Promise<string[]> {
  const supabase = await getServerSupabase();

  switch (id) {
    case "subscribers": {
      const { data } = await supabase.from("subscribers").select("email");
      return clean((data ?? []).map((r) => r.email));
    }
    case "talk-night-accepted": {
      const { data } = await supabase
        .from("talk_night_registrations")
        .select("email, status");
      return clean(
        (data ?? []).filter((r) => r.status === "accepted").map((r) => r.email),
      );
    }
    case "talk-night-all": {
      const { data } = await supabase
        .from("talk_night_registrations")
        .select("email, guest_email");
      const rows = data ?? [];
      return clean([
        ...rows.map((r) => r.email),
        ...rows.map((r) => r.guest_email),
      ]);
    }
    case "youth-futures": {
      const { data } = await supabase
        .from("youth_futures_registrations")
        .select("email");
      return clean((data ?? []).map((r) => r.email));
    }
    case "student-speaker": {
      const { data } = await supabase
        .from("student_speaker_submissions")
        .select("email");
      return clean((data ?? []).map((r) => r.email));
    }
    case "nominations": {
      const { data } = await supabase
        .from("nominations")
        .select("nominator_email");
      return clean((data ?? []).map((r) => r.nominator_email));
    }
    case "volunteers": {
      const { data } = await supabase.from("applications").select("email");
      return clean((data ?? []).map((r) => r.email));
    }
    default:
      return [];
  }
}
