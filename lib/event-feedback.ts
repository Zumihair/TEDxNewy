import "server-only";
import { randomUUID } from "crypto";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  sendBulkEmailPersonalized,
  getResendFrom,
  type BulkMessage,
} from "@/lib/email-notify";
import {
  feedbackRequestEmail,
  feedbackReminderEmail,
  TALK_NIGHT_FEEDBACK_EXTRAS,
  SITE,
  type FeedbackEmailExtras,
} from "@/lib/email-templates";

/** Event-specific follow-up extras (recap plug + partner thank-yous). */
function feedbackExtrasForSlug(slug: string): FeedbackEmailExtras | undefined {
  if (slug === "60-second-talk-night") return TALK_NIGHT_FEEDBACK_EXTRAS;
  return undefined;
}

/**
 * Per-event attendees + feedback. Generic across events (keyed on cms_events),
 * so any event can list attendees, collect feedback on a tokenised per-person
 * link, chase non-responders, and export. All access is service-role and
 * server-only (RLS denies anon/authenticated on these tables), so this module
 * is `import "server-only"` and callers go through these helpers.
 */

export const FEEDBACK_REMINDER_AFTER_DAYS = 3;

export type AttendeeRole = "attendee" | "speaker" | "guest";

export type EventAttendee = {
  id: string;
  eventId: string;
  fullName: string;
  email: string;
  role: AttendeeRole;
  details: Record<string, unknown>;
  source: string | null;
  feedbackToken: string | null;
  feedbackRequestedAt: string | null;
  feedbackRemindedAt: string | null;
  feedbackCompletedAt: string | null;
  createdAt: string;
};

export type FeedbackResponse = {
  id: string;
  eventId: string;
  attendeeId: string | null;
  beenBefore: boolean | null;
  metSomeone: boolean | null;
  newIdeas: boolean | null;
  overallRating: number | null;
  highlight: string | null;
  improve: string | null;
  returnLikelihood: string | null;
  testimonial: string | null;
  testimonialConsent: boolean;
  submittedAt: string;
};

type AttendeeRow = {
  id: string;
  event_id: string;
  full_name: string;
  email: string;
  role: string;
  details: Record<string, unknown> | null;
  source: string | null;
  feedback_token: string | null;
  feedback_requested_at: string | null;
  feedback_reminded_at: string | null;
  feedback_completed_at: string | null;
  created_at: string;
};

const ROLES: AttendeeRole[] = ["attendee", "speaker", "guest"];

function rowToAttendee(r: AttendeeRow): EventAttendee {
  return {
    id: r.id,
    eventId: r.event_id,
    fullName: r.full_name,
    email: r.email,
    role: (ROLES as string[]).includes(r.role)
      ? (r.role as AttendeeRole)
      : "attendee",
    details: r.details ?? {},
    source: r.source,
    feedbackToken: r.feedback_token,
    feedbackRequestedAt: r.feedback_requested_at,
    feedbackRemindedAt: r.feedback_reminded_at,
    feedbackCompletedAt: r.feedback_completed_at,
    createdAt: r.created_at,
  };
}

function newToken(): string {
  return randomUUID().replace(/-/g, "");
}

function feedbackUrl(slug: string, token: string): string {
  return `${SITE}/feedback/${encodeURIComponent(slug)}?t=${token}`;
}

// ------------------------------------------------------------------ reads

export async function getEventAttendees(
  eventId: string,
): Promise<EventAttendee[]> {
  const sb = getAdminSupabase();
  const { data, error } = await sb
    .from("event_attendees")
    .select("*")
    .eq("event_id", eventId)
    .order("full_name", { ascending: true });
  if (error) {
    console.error("[event-feedback] getEventAttendees", error);
    return [];
  }
  return (data as AttendeeRow[]).map(rowToAttendee);
}

type ResponseRow = {
  id: string;
  event_id: string;
  attendee_id: string | null;
  been_before: boolean | null;
  met_someone: boolean | null;
  new_ideas: boolean | null;
  overall_rating: number | null;
  highlight: string | null;
  improve: string | null;
  return_likelihood: string | null;
  testimonial: string | null;
  testimonial_consent: boolean;
  submitted_at: string;
};

/**
 * Which events have at least one native feedback response — one cheap query
 * across every event, so the Events page can decide whether to show a
 * Feedback chip without a per-event round trip. Used alongside
 * `lib/imported-feedback.ts`'s static archive check: a Feedback chip shows
 * for either reason, with no per-event hardcoding needed.
 */
export async function getEventIdsWithFeedback(): Promise<Set<string>> {
  const sb = getAdminSupabase();
  const { data, error } = await sb
    .from("event_feedback_responses")
    .select("event_id");
  if (error) {
    console.error("[event-feedback] getEventIdsWithFeedback", error);
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.event_id as string));
}

export async function getEventFeedback(
  eventId: string,
): Promise<FeedbackResponse[]> {
  const sb = getAdminSupabase();
  const { data, error } = await sb
    .from("event_feedback_responses")
    .select("*")
    .eq("event_id", eventId)
    .order("submitted_at", { ascending: false });
  if (error) {
    console.error("[event-feedback] getEventFeedback", error);
    return [];
  }
  return (data as ResponseRow[]).map((r) => ({
    id: r.id,
    eventId: r.event_id,
    attendeeId: r.attendee_id,
    beenBefore: r.been_before,
    metSomeone: r.met_someone,
    newIdeas: r.new_ideas,
    overallRating: r.overall_rating,
    highlight: r.highlight,
    improve: r.improve,
    returnLikelihood: r.return_likelihood,
    testimonial: r.testimonial,
    testimonialConsent: r.testimonial_consent,
    submittedAt: r.submitted_at,
  }));
}

// --------------------------------------------------------------- populate

type NewAttendee = {
  full_name: string;
  email: string;
  role: AttendeeRole;
  details: Record<string, unknown>;
  source: string;
};

/**
 * Insert the given people as attendees of an event, skipping any whose email
 * is already on the event. Emails are lowercased; each new row gets a feedback
 * token. Returns how many were added vs skipped.
 */
async function insertAttendees(
  eventId: string,
  people: NewAttendee[],
): Promise<{ imported: number; skipped: number }> {
  const sb = getAdminSupabase();

  // Dedupe within the batch by email (first wins).
  const byEmail = new Map<string, NewAttendee>();
  for (const p of people) {
    const email = p.email.trim().toLowerCase();
    if (!email || !email.includes("@")) continue;
    if (!byEmail.has(email)) byEmail.set(email, { ...p, email });
  }

  const { data: existing, error: exErr } = await sb
    .from("event_attendees")
    .select("email")
    .eq("event_id", eventId);
  if (exErr) {
    console.error("[event-feedback] insertAttendees existing", exErr);
    return { imported: 0, skipped: 0 };
  }
  const have = new Set(
    (existing as { email: string }[]).map((e) => e.email.toLowerCase()),
  );

  const rows = [...byEmail.values()]
    .filter((p) => !have.has(p.email))
    .map((p) => ({
      event_id: eventId,
      full_name: p.full_name.trim() || p.email,
      email: p.email,
      role: p.role,
      details: p.details,
      source: p.source,
      feedback_token: newToken(),
    }));

  const skipped = byEmail.size - rows.length;
  if (rows.length === 0) return { imported: 0, skipped };

  const { error } = await sb.from("event_attendees").insert(rows);
  if (error) {
    console.error("[event-feedback] insertAttendees insert", error);
    return { imported: 0, skipped: byEmail.size };
  }
  return { imported: rows.length, skipped };
}

/** Import the 60-Second Talk Night registrations (and their guests). */
export async function importTalkNightAttendees(
  eventId: string,
): Promise<{ imported: number; skipped: number }> {
  const sb = getAdminSupabase();
  const { data, error } = await sb
    .from("talk_night_registrations")
    .select("*");
  if (error || !data) {
    console.error("[event-feedback] importTalkNightAttendees read", error);
    return { imported: 0, skipped: 0 };
  }

  const people: NewAttendee[] = [];
  for (const r of data as Record<string, string | null>[]) {
    const email = (r.email ?? "").trim().toLowerCase();
    if (email) {
      people.push({
        full_name: r.full_name ?? "",
        email,
        role: r.attendance_type === "speak" ? "speaker" : "attendee",
        details: {
          attendance_type: r.attendance_type,
          idea: r.idea,
          reason: r.reason,
          phone: r.phone,
        },
        source: "talk_night_registrations",
      });
    }
    const guestEmail = (r.guest_email ?? "").trim().toLowerCase();
    if (r.guest_name && guestEmail) {
      people.push({
        full_name: r.guest_name,
        email: guestEmail,
        role: "guest",
        details: {
          attendance_type: r.guest_attendance_type,
          idea: r.guest_idea,
          reason: r.guest_reason,
          guest_of: r.full_name,
        },
        source: "talk_night_registrations",
      });
    }
  }
  return insertAttendees(eventId, people);
}

/**
 * Import the Youth Futures Lab EOIs as attendees: one row per school, the
 * teacher/contact as the named attendee. Registrations closed once the form
 * was retired (2026-08-25, see FORM_REGISTRY), so this is how the schools
 * that registered become feedback-form recipients without re-keying them.
 */
export async function importYouthFuturesAttendees(
  eventId: string,
): Promise<{ imported: number; skipped: number }> {
  const sb = getAdminSupabase();
  const { data, error } = await sb
    .from("youth_futures_registrations")
    .select("*");
  if (error || !data) {
    console.error("[event-feedback] importYouthFuturesAttendees read", error);
    return { imported: 0, skipped: 0 };
  }

  const people: NewAttendee[] = (data as Record<string, string | number | null>[])
    .filter((r) => (r.email as string | null)?.trim())
    .map((r) => ({
      full_name: (r.contact_name as string) || (r.school_name as string) || "",
      email: String(r.email).trim().toLowerCase(),
      role: "attendee",
      details: {
        school_name: r.school_name,
        suburb: r.suburb,
        contact_role: r.contact_role,
        phone: r.phone,
        student_count: r.student_count,
        year_levels: r.year_levels,
      },
      source: "youth_futures_registrations",
    }));
  return insertAttendees(eventId, people);
}

/**
 * Import attendees from pasted/uploaded CSV. Expected columns (header row
 * optional, order flexible when a header is present): full_name (or name),
 * email, role. Without a header, columns are read as name,email,role.
 */
export async function importAttendeesFromCsv(
  eventId: string,
  csv: string,
): Promise<{ imported: number; skipped: number }> {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { imported: 0, skipped: 0 };

  const splitRow = (line: string) =>
    line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));

  let nameIdx = 0;
  let emailIdx = 1;
  let roleIdx = 2;
  let start = 0;
  const header = splitRow(lines[0]).map((c) => c.toLowerCase());
  if (header.some((c) => c.includes("email"))) {
    nameIdx = header.findIndex((c) => c.includes("name"));
    emailIdx = header.findIndex((c) => c.includes("email"));
    roleIdx = header.findIndex((c) => c.includes("role"));
    if (nameIdx < 0) nameIdx = 0;
    if (roleIdx < 0) roleIdx = -1;
    start = 1;
  }

  const people: NewAttendee[] = [];
  for (let i = start; i < lines.length; i++) {
    const cols = splitRow(lines[i]);
    const email = (cols[emailIdx] ?? "").toLowerCase();
    if (!email.includes("@")) continue;
    const roleRaw = roleIdx >= 0 ? (cols[roleIdx] ?? "").toLowerCase() : "";
    const role: AttendeeRole = (ROLES as string[]).includes(roleRaw)
      ? (roleRaw as AttendeeRole)
      : "attendee";
    people.push({
      full_name: cols[nameIdx] ?? "",
      email,
      role,
      details: {},
      source: "csv",
    });
  }
  return insertAttendees(eventId, people);
}

/**
 * Import an event's ticket holders from Humanitix as attendees. Dedupe by
 * email against the existing list happens in insertAttendees, so re-running
 * after more sales only adds the new buyers.
 */
export async function importHumanitixAttendees(
  eventId: string,
  humanitixEventId: string,
): Promise<{ imported: number; skipped: number; error?: string }> {
  const { listHumanitixAttendees } = await import("@/lib/humanitix");
  const res = await listHumanitixAttendees(humanitixEventId);
  if (!res.ok) return { imported: 0, skipped: 0, error: res.error };
  const people: NewAttendee[] = res.data.map((a) => ({
    full_name: a.fullName,
    email: a.email,
    role: "attendee",
    details: { ticketType: a.ticketType },
    source: "humanitix",
  }));
  return insertAttendees(eventId, people);
}

// ------------------------------------------------------------------ sends

type EventMeta = { id: string; slug: string; title: string };

async function getEventMeta(eventId: string): Promise<EventMeta | null> {
  const sb = getAdminSupabase();
  const { data, error } = await sb
    .from("cms_events")
    .select("id, slug, title")
    .eq("id", eventId)
    .single();
  if (error || !data) return null;
  return data as EventMeta;
}

/**
 * Send the feedback request to every attendee of an event who has not been
 * asked yet. Stamps feedback_requested_at on the ones we email. Returns how
 * many requests went out.
 */
export async function sendFeedbackRequests(
  eventId: string,
): Promise<{ sent: number; failed: number }> {
  const sb = getAdminSupabase();
  const meta = await getEventMeta(eventId);
  if (!meta) return { sent: 0, failed: 0 };

  const { data, error } = await sb
    .from("event_attendees")
    .select("*")
    .eq("event_id", eventId)
    .is("feedback_requested_at", null);
  if (error || !data) {
    console.error("[event-feedback] sendFeedbackRequests read", error);
    return { sent: 0, failed: 0 };
  }

  const from = getResendFrom();
  const extras = feedbackExtrasForSlug(meta.slug);
  const recipients = (data as AttendeeRow[]).map(rowToAttendee);
  if (recipients.length === 0) return { sent: 0, failed: 0 };

  // Ensure every recipient has a token (older / manually added rows may not).
  const withToken: {
    id: string;
    email: string;
    fullName: string;
    token: string;
  }[] = [];
  for (const a of recipients) {
    let token = a.feedbackToken;
    if (!token) {
      token = newToken();
      await sb
        .from("event_attendees")
        .update({ feedback_token: token })
        .eq("id", a.id);
    }
    withToken.push({ id: a.id, email: a.email, fullName: a.fullName, token });
  }

  // One personalised message per recipient, each addressed only to that person,
  // sent in a single batched call (chunks of 100 with a paced fallback) so
  // Resend's 2/sec rate limit can never drop anyone.
  const messages: BulkMessage[] = withToken.map((a) => {
    const content = feedbackRequestEmail({
      fullName: a.fullName,
      eventTitle: meta.title,
      url: feedbackUrl(meta.slug, a.token),
      extras,
    });
    return {
      from,
      to: a.email,
      subject: content.subject,
      text: content.text,
      html: content.html ?? content.text,
    };
  });

  const results = await sendBulkEmailPersonalized(messages);
  const okByEmail = new Map(results.map((r) => [r.to, r.ok]));

  // Stamp requested_at only for the ones that actually sent.
  const sentIds = withToken
    .filter((a) => okByEmail.get(a.email))
    .map((a) => a.id);
  if (sentIds.length > 0) {
    await sb
      .from("event_attendees")
      .update({ feedback_requested_at: new Date().toISOString() })
      .in("id", sentIds);
  }
  return { sent: sentIds.length, failed: withToken.length - sentIds.length };
}

/**
 * Cron step: one reminder to anyone asked more than FEEDBACK_REMINDER_AFTER_DAYS
 * ago who has neither completed feedback nor been reminded. Claims each row by
 * stamping feedback_reminded_at first (guarded on it still being null) so
 * overlapping cron runs cannot double-send.
 */
export async function processFeedbackReminders(): Promise<number> {
  const sb = getAdminSupabase();
  const cutoff = new Date(
    Date.now() - FEEDBACK_REMINDER_AFTER_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await sb
    .from("event_attendees")
    .select("*")
    .lte("feedback_requested_at", cutoff)
    .is("feedback_reminded_at", null)
    .is("feedback_completed_at", null)
    .not("feedback_token", "is", null);
  if (error || !data || data.length === 0) {
    if (error) console.error("[event-feedback] reminders read", error);
    return 0;
  }

  // Claim every candidate atomically: flip reminded_at to now only where it is
  // still null. Overlapping cron runs each claim a disjoint set, so no one is
  // reminded twice. We then send to exactly the rows this run claimed.
  const now = new Date().toISOString();
  const ids = (data as AttendeeRow[]).map((r) => r.id);
  const { data: claimed, error: claimErr } = await sb
    .from("event_attendees")
    .update({ feedback_reminded_at: now })
    .in("id", ids)
    .is("feedback_reminded_at", null)
    .select("*");
  if (claimErr || !claimed || claimed.length === 0) {
    if (claimErr) console.error("[event-feedback] reminders claim", claimErr);
    return 0;
  }

  const from = getResendFrom();
  const metaCache = new Map<string, EventMeta | null>();
  const messages: BulkMessage[] = [];
  for (const a of (claimed as AttendeeRow[]).map(rowToAttendee)) {
    if (!metaCache.has(a.eventId)) {
      metaCache.set(a.eventId, await getEventMeta(a.eventId));
    }
    const meta = metaCache.get(a.eventId);
    if (!meta || !a.feedbackToken) continue;
    const content = feedbackReminderEmail({
      fullName: a.fullName,
      eventTitle: meta.title,
      url: feedbackUrl(meta.slug, a.feedbackToken),
    });
    messages.push({
      from,
      to: a.email,
      subject: content.subject,
      text: content.text,
      html: content.html ?? content.text,
    });
  }

  // Single batched send so the reminder run can't trip the rate limit either.
  if (messages.length === 0) return 0;
  const results = await sendBulkEmailPersonalized(messages);
  return results.filter((r) => r.ok).length;
}

// -------------------------------------------------------------- public form

export type AttendeeWithEvent = {
  attendee: EventAttendee;
  event: EventMeta;
};

/** Resolve a feedback token to its attendee + event, for the public page. */
export async function getAttendeeByToken(
  token: string,
): Promise<AttendeeWithEvent | null> {
  const sb = getAdminSupabase();
  const { data, error } = await sb
    .from("event_attendees")
    .select("*")
    .eq("feedback_token", token)
    .single();
  if (error || !data) return null;
  const attendee = rowToAttendee(data as AttendeeRow);
  const event = await getEventMeta(attendee.eventId);
  if (!event) return null;
  return { attendee, event };
}

export type FeedbackAnswers = {
  beenBefore: boolean | null;
  metSomeone: boolean | null;
  newIdeas: boolean | null;
  overallRating: number | null;
  highlight: string | null;
  improve: string | null;
  returnLikelihood: string | null;
  testimonial: string | null;
  testimonialConsent: boolean;
};

/**
 * Record a feedback submission against a token. Idempotent: a token that has
 * already submitted is left as-is and reported as "already".
 */
export async function recordFeedback(
  token: string,
  answers: FeedbackAnswers,
): Promise<{ ok: boolean; already: boolean; slug: string | null }> {
  const sb = getAdminSupabase();
  const { data: row, error } = await sb
    .from("event_attendees")
    .select("*")
    .eq("feedback_token", token)
    .single();
  if (error || !row) return { ok: false, already: false, slug: null };

  const attendee = rowToAttendee(row as AttendeeRow);
  const meta = await getEventMeta(attendee.eventId);
  const slug = meta?.slug ?? null;
  if (attendee.feedbackCompletedAt) {
    return { ok: true, already: true, slug };
  }

  const { error: insErr } = await sb.from("event_feedback_responses").insert({
    event_id: attendee.eventId,
    attendee_id: attendee.id,
    been_before: answers.beenBefore,
    met_someone: answers.metSomeone,
    new_ideas: answers.newIdeas,
    overall_rating: answers.overallRating,
    highlight: answers.highlight,
    improve: answers.improve,
    return_likelihood: answers.returnLikelihood,
    testimonial: answers.testimonial,
    testimonial_consent: answers.testimonialConsent,
  });
  if (insErr) {
    console.error("[event-feedback] recordFeedback insert", insErr);
    return { ok: false, already: false, slug };
  }

  await sb
    .from("event_attendees")
    .update({ feedback_completed_at: new Date().toISOString() })
    .eq("id", attendee.id);
  return { ok: true, already: false, slug };
}
