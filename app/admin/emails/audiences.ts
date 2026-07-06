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
 * The count on each chip is derived from the exact same list that gets sent
 * (`getAudienceEmails`), so the number shown is always the number of distinct
 * inboxes the audience will email: guest addresses included, blanks/invalids
 * dropped, duplicates collapsed. A plain `COUNT(*)` head query cannot match
 * that (it counts rows, misses guest emails, and never dedupes), which is why
 * the "Talk Night" chips previously read low. The trade-off is that opening
 * Compose reads the email columns of each table rather than just counting rows;
 * for these community-sized lists that cost is negligible and worth exact counts.
 */
export async function getComposeAudienceSummaries(): Promise<AudienceSummary[]> {
  const lists = await Promise.all(
    AUDIENCE_DEFS.map((d) => getAudienceEmails(d.id)),
  );

  return AUDIENCE_DEFS.map((d, i) => ({ ...d, count: lists[i].length })).filter(
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
        .select("email, guest_email, status");
      // A guest shares the row's single status, so an accepted registration
      // covers the +1 too. Include both, mirroring "talk-night-all".
      const rows = (data ?? []).filter((r) => r.status === "accepted");
      return clean([
        ...rows.map((r) => r.email),
        ...rows.map((r) => r.guest_email),
      ]);
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
