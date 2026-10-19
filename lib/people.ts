import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase } from "./supabase-admin";

/**
 * People: one record per email address, assembled on every request from the
 * tables that already hold an address. Nothing is stored: like the photo
 * usage marks (lib/photo-usage.ts), a person is derived, so deleting a
 * submission or an attendee row simply drops that line from their history
 * and no table has to be kept in step.
 *
 * Sources: subscribers, event attendees (ticket buyers, registrations and
 * imports, joined to cms_events) and their feedback, every Resend email in
 * email_sends, the public forms, partner pledges and contacts, media contacts
 * and the team. Newsletter campaigns go through Mailchimp and are logged as
 * one row per campaign, so per-person newsletter activity is read live from
 * Mailchimp on the profile page (getMemberActivity in lib/mailchimp.ts).
 *
 * Reads go through the service client because event_attendees and
 * event_feedback_responses have no admin RLS policy; callers must run
 * requireAdmin() first.
 */

export type TouchKind =
  | "subscribe"
  | "unsubscribe"
  | "event"
  | "feedback"
  | "email"
  | "form"
  | "partner"
  | "media"
  | "team";

export type Touch = {
  at: string | null;
  kind: TouchKind;
  title: string;
  detail?: string | null;
};

export type PersonEvent = {
  eventId: string;
  title: string;
  startsAt: string | null;
  /** "Ticket", "Speaker", "Guest", "Registered" and so on. */
  how: string;
  gaveFeedback: boolean;
};

export type Person = {
  email: string;
  name: string | null;
  /** true on the list, false unsubscribed, null never on it. */
  subscribed: boolean | null;
  subscribedAt: string | null;
  unsubscribedAt: string | null;
  subscribeSource: string | null;
  inWelcomeFlow: boolean;
  events: PersonEvent[];
  /** Emails we sent them one to one (Resend: Quick email, confirmations, the welcome flow, ticket-holder follow-ups). */
  emailsReceived: number;
  /** Newsletter campaigns sent to the whole list while they were on it. */
  newslettersWhileSubscribed: number;
  roles: string[];
  firstSeen: string | null;
  lastSeen: string | null;
  touches: Touch[];
};

/** What the list page needs, without the full history. */
export type PersonRow = Omit<Person, "touches" | "events"> & {
  eventCount: number;
  eventTitles: string[];
};

const norm = (e: string | null | undefined) => (e ?? "").trim().toLowerCase();
const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const clip = (s: string | null | undefined, n = 160) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t || null;
};
const joinName = (...parts: (string | null | undefined)[]) =>
  parts.map((p) => (p ?? "").trim()).filter(Boolean).join(" ") || null;

type AnyRow = Record<string, unknown>;

/** Every row of a table, paged past PostgREST's 1,000-row cap. Missing tables read as empty. */
async function all(db: SupabaseClient, table: string, cols: string): Promise<AnyRow[]> {
  const out: AnyRow[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await db.from(table).select(cols).range(from, from + page - 1);
    if (error || !data) return out;
    out.push(...(data as unknown as AnyRow[]));
    if (data.length < page) return out;
  }
}

const s = (r: AnyRow, k: string) => (typeof r[k] === "string" ? (r[k] as string) : null);

function blank(email: string): Person {
  return {
    email,
    name: null,
    subscribed: null,
    subscribedAt: null,
    unsubscribedAt: null,
    subscribeSource: null,
    inWelcomeFlow: false,
    events: [],
    emailsReceived: 0,
    newslettersWhileSubscribed: 0,
    roles: [],
    firstSeen: null,
    lastSeen: null,
    touches: [],
  };
}

/** Everyone we know, keyed by lowercased email. Deduplicated per request. */
export const getPeople = cache(async (): Promise<Map<string, Person>> => {
  const db = getAdminSupabase();
  const [
    subscribers,
    attendees,
    events,
    feedback,
    sends,
    newsletters,
    applications,
    contacts,
    nominations,
    enquiries,
    talkNight,
    youth,
    students,
    pledges,
    partners,
    media,
    team,
  ] = await Promise.all([
    all(db, "subscribers", "email, source, created_at, unsubscribed_at, flow_started_at"),
    all(db, "event_attendees", "id, event_id, full_name, email, role, source, feedback_completed_at, created_at"),
    all(db, "cms_events", "id, title, starts_at"),
    all(db, "event_feedback_responses", "attendee_id, event_id, overall_rating, submitted_at"),
    all(db, "email_sends", "to_email, subject, created_at, status, sent_by"),
    all(db, "newsletters", "title, subject, audience, status, sent_at"),
    all(db, "applications", "first_name, last_name, email, crew, created_at"),
    all(db, "contact_messages", "first_name, last_name, email, message, created_at"),
    all(db, "nominations", "nominator_name, nominator_email, nominee_name, created_at"),
    all(db, "partner_enquiries", "organisation, contact_name, email, tier, created_at"),
    all(db, "talk_night_registrations", "full_name, email, attendance_type, guest_name, guest_email, guest_attendance_type, created_at"),
    all(db, "youth_futures_registrations", "contact_name, email, school_name, student_count, created_at"),
    all(db, "student_speaker_submissions", "full_name, email, school, talk_title, created_at"),
    all(db, "sponsorship_pledges", "org_name, contact_name, email, status, year, created_at"),
    all(db, "cms_partners", "org_name, contact_name, email, status, created_at"),
    all(db, "cms_media_contacts", "full_name, email, outlet, created_at"),
    all(db, "cms_team_members", "name, email, role, is_active, created_at"),
  ]);

  const people = new Map<string, Person>();
  // Names are taken from the most reliable source first: the team, then
  // attendee lists, then forms. A later source only fills a gap.
  const touch = (rawEmail: unknown, t: Touch, name?: string | null, role?: string) => {
    const email = norm(typeof rawEmail === "string" ? rawEmail : null);
    if (!email || !isEmail(email)) return null;
    let p = people.get(email);
    if (!p) {
      p = blank(email);
      people.set(email, p);
    }
    p.touches.push(t);
    if (name && !p.name) p.name = name;
    if (role && !p.roles.includes(role)) p.roles.push(role);
    return p;
  };

  for (const r of team) {
    touch(r.email, { at: s(r, "created_at"), kind: "team", title: `On the team: ${s(r, "role") ?? "member"}` }, s(r, "name"), "Team");
  }

  for (const r of subscribers) {
    const p = touch(
      r.email,
      {
        at: s(r, "created_at"),
        kind: "subscribe",
        title: "Joined the mailing list",
        detail: s(r, "source") ? `via ${s(r, "source")}` : null,
      },
      null,
    );
    if (!p) continue;
    const unsub = s(r, "unsubscribed_at");
    p.subscribed = !unsub;
    p.subscribedAt = s(r, "created_at");
    p.unsubscribedAt = unsub;
    p.subscribeSource = s(r, "source");
    p.inWelcomeFlow = !!r.flow_started_at;
    p.roles.push(unsub ? "Unsubscribed" : "Subscriber");
    if (unsub) p.touches.push({ at: unsub, kind: "unsubscribe", title: "Unsubscribed" });
  }

  const eventById = new Map(events.map((e) => [String(e.id), e]));
  const feedbackByAttendee = new Map(feedback.map((f) => [String(f.attendee_id), f]));
  for (const r of attendees) {
    const ev = eventById.get(String(r.event_id));
    const title = (ev && s(ev, "title")) || "An event";
    const role = s(r, "role") ?? "attendee";
    const source = s(r, "source") ?? "";
    const how =
      role === "speaker"
        ? "Speaker"
        : role === "guest"
          ? "Guest"
          : source === "humanitix"
            ? "Ticket"
            : source === "student_speaker_submissions"
              ? "Entrant"
              : "Registered";
    const fb = feedbackByAttendee.get(String(r.id));
    const p = touch(
      r.email,
      {
        at: (ev && s(ev, "starts_at")) || s(r, "created_at"),
        kind: "event",
        title,
        detail: how === "Ticket" ? "Bought a ticket" : how === "Registered" ? "Registered" : how,
      },
      s(r, "full_name"),
      how === "Ticket" ? "Ticket buyer" : how === "Speaker" ? "Speaker" : "Attendee",
    );
    if (!p) continue;
    p.events.push({
      eventId: String(r.event_id),
      title,
      startsAt: (ev && s(ev, "starts_at")) || null,
      how,
      gaveFeedback: !!fb || !!r.feedback_completed_at,
    });
    if (fb) {
      const rating = typeof fb.overall_rating === "number" ? ` (${fb.overall_rating} out of 5)` : "";
      p.touches.push({ at: s(fb, "submitted_at"), kind: "feedback", title: `Gave feedback on ${title}${rating}` });
    }
  }

  for (const r of sends) {
    const p = touch(r.to_email, {
      at: s(r, "created_at"),
      kind: "email",
      title: s(r, "subject") ?? "(no subject)",
      detail: s(r, "sent_by") ? `Sent by ${s(r, "sent_by")}` : null,
    });
    if (p) p.emailsReceived += 1;
  }

  for (const r of applications) {
    touch(
      r.email,
      { at: s(r, "created_at"), kind: "form", title: "Applied to volunteer", detail: s(r, "crew") ? `Crew: ${s(r, "crew")}` : null },
      joinName(s(r, "first_name"), s(r, "last_name")),
      "Volunteer",
    );
  }
  for (const r of contacts) {
    touch(
      r.email,
      { at: s(r, "created_at"), kind: "form", title: "Sent us a message", detail: clip(s(r, "message")) },
      joinName(s(r, "first_name"), s(r, "last_name")),
      "Contact",
    );
  }
  for (const r of nominations) {
    touch(
      r.nominator_email,
      { at: s(r, "created_at"), kind: "form", title: `Nominated ${s(r, "nominee_name") ?? "a speaker"}` },
      s(r, "nominator_name"),
      "Nominator",
    );
  }
  for (const r of enquiries) {
    touch(
      r.email,
      {
        at: s(r, "created_at"),
        kind: "partner",
        title: `Partnership enquiry from ${s(r, "organisation") ?? "an organisation"}`,
        detail: s(r, "tier"),
      },
      s(r, "contact_name"),
      "Partner",
    );
  }
  for (const r of talkNight) {
    touch(
      r.email,
      { at: s(r, "created_at"), kind: "form", title: "Registered for the 60-Second Talk Night", detail: s(r, "attendance_type") },
      s(r, "full_name"),
    );
    if (s(r, "guest_email")) {
      touch(
        r.guest_email,
        {
          at: s(r, "created_at"),
          kind: "form",
          title: `Registered for the 60-Second Talk Night as ${s(r, "full_name") ?? "someone"}'s guest`,
          detail: s(r, "guest_attendance_type"),
        },
        s(r, "guest_name"),
      );
    }
  }
  for (const r of youth) {
    const n = typeof r.student_count === "number" ? ` (${r.student_count} students)` : "";
    touch(
      r.email,
      { at: s(r, "created_at"), kind: "form", title: `Registered ${s(r, "school_name") ?? "a school"} for the Youth Futures Lab${n}` },
      s(r, "contact_name"),
      "School contact",
    );
  }
  for (const r of students) {
    touch(
      r.email,
      {
        at: s(r, "created_at"),
        kind: "form",
        title: "Entered the Student Speaker Competition",
        detail: [s(r, "talk_title"), s(r, "school")].filter(Boolean).join(", ") || null,
      },
      s(r, "full_name"),
      "Student speaker",
    );
  }
  for (const r of pledges) {
    touch(
      r.email,
      {
        at: s(r, "created_at"),
        kind: "partner",
        title: `${s(r, "org_name") ?? "Partner"} pledge for ${r.year ?? "the year"}`,
        detail: s(r, "status"),
      },
      s(r, "contact_name"),
      "Partner",
    );
  }
  for (const r of partners) {
    touch(
      r.email,
      {
        at: s(r, "created_at"),
        kind: "partner",
        title: `Partner contact for ${s(r, "org_name") ?? "an organisation"}`,
        detail: s(r, "status"),
      },
      s(r, "contact_name"),
      "Partner",
    );
  }
  for (const r of media) {
    touch(
      r.email,
      { at: s(r, "created_at"), kind: "media", title: `Media contact${s(r, "outlet") ? ` at ${s(r, "outlet")}` : ""}` },
      s(r, "full_name"),
      "Media",
    );
  }

  // Campaigns that went to the whole list. A person counts one if they were
  // on the list when it went: imported subscribers carry their import date,
  // so for them this is a floor rather than an exact count.
  const listSends = newsletters
    .filter((n) => s(n, "status") === "sent" && s(n, "sent_at") && (s(n, "audience") ?? "subscribers") === "subscribers")
    .map((n) => Date.parse(s(n, "sent_at")!));

  for (const p of people.values()) {
    if (p.subscribedAt) {
      const from = Date.parse(p.subscribedAt);
      const to = p.unsubscribedAt ? Date.parse(p.unsubscribedAt) : Infinity;
      p.newslettersWhileSubscribed = listSends.filter((t) => t >= from && t < to).length;
    }
    p.events.sort((a, b) => (b.startsAt ?? "").localeCompare(a.startsAt ?? ""));
    p.touches.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
    const times = p.touches.map((t) => t.at).filter((t): t is string => !!t).sort();
    p.firstSeen = times[0] ?? null;
    // The last thing they did, not the last email we sent them.
    const own = p.touches.filter((t) => t.kind !== "email" && t.at).map((t) => t.at!).sort();
    p.lastSeen = own[own.length - 1] ?? times[times.length - 1] ?? null;
  }
  return people;
});

export async function getPersonRows(): Promise<PersonRow[]> {
  const people = await getPeople();
  return [...people.values()].map(({ touches: _t, events, ...rest }) => ({
    ...rest,
    eventCount: new Set(events.map((e) => e.eventId)).size,
    eventTitles: [...new Set(events.map((e) => e.title))],
  }));
}

export async function getPerson(email: string): Promise<Person | null> {
  const people = await getPeople();
  return people.get(norm(email)) ?? null;
}
