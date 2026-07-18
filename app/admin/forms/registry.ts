/**
 * Single source of truth for the Forms hub.
 *
 * Each entry fully describes one of the site's form inboxes: where its rows
 * live, which columns to show, which search keys and export name to use, and
 * which server actions wire up delete / contacted / status. Both the hub
 * overview (/admin/forms), the per-form tab page (/admin/forms/[form]) and the
 * dashboard read from this list, so a form is configured in exactly one place.
 *
 * Server-only in practice: this imports the server actions from
 * ../submissions-actions, so only server components should import it. The
 * Column / StatusOption / Row imports are type-only (erased at build), so no
 * client code is pulled in.
 */

import type { Column, Row, StatusOption } from "../SubmissionsTable";
import {
  bulkDeleteApplications,
  bulkDeleteContactMessages,
  bulkDeleteNominations,
  bulkDeletePartnerEnquiries,
  bulkDeleteStudentSpeaker,
  bulkDeleteTalkNight,
  bulkDeleteYouthFutures,
  bulkSetApplicationsContacted,
  bulkSetContactMessagesContacted,
  bulkSetNominationsContacted,
  bulkSetPartnerEnquiriesContacted,
  bulkSetStudentSpeakerContacted,
  bulkSetTalkNightContacted,
  bulkSetYouthFuturesContacted,
  deleteApplication,
  deleteContactMessage,
  deleteNomination,
  deletePartnerEnquiry,
  deleteStudentSpeaker,
  deleteTalkNight,
  deleteYouthFutures,
  setApplicationContacted,
  setContactMessageContacted,
  setNominationContacted,
  setPartnerEnquiryContacted,
  setStudentSpeakerContacted,
  setTalkNightContacted,
  setTalkNightStatus,
  setYouthFuturesContacted,
} from "../submissions-actions";

type ServerAction = (formData: FormData) => Promise<void>;

export type FormEntry = {
  /** URL segment under /admin/forms. */
  slug: string;
  /** Sidebar / tab / tile label. */
  label: string;
  /** Supabase table, used for both the head-count and the row fetch. */
  table: string;
  /** Columns to select for the fetch. "*" pulls the whole row. */
  select: string;
  /** Column to order by (always descending). */
  orderBy: string;
  /** Column config passed straight to SubmissionsTable. */
  columns: Column[];
  /** Row keys the search box filters against. */
  searchKeys: string[];
  /** Filename stem for CSV export. */
  exportName: string;
  /** PageHeader eyebrow. */
  eyebrow: string;
  /** PageHeader title. */
  title: string;
  /** PageHeader description for a populated inbox (given the rows). */
  describe: (rows: Row[]) => string;
  /** PageHeader description shown when there are no rows and no load error. */
  emptyText?: string;
  /** Noun used in the "couldn't load" error box (e.g. "registrations"). */
  noun: string;
  deleteAction: ServerAction;
  contactedAction: ServerAction;
  bulkDeleteAction: ServerAction;
  bulkContactedAction: ServerAction;
  /** Applicant pipeline stages (talk-night). */
  statuses?: StatusOption[];
  statusAction?: ServerAction;
  acceptedStatus?: string;
  emailField?: string;
  /** Live in-view head-count breakdown (talk-night). */
  breakdown?: {
    buckets: { label: string; fields: string[]; values: string[] }[];
  };
  /** Spam heuristic preset (contact). */
  spamPreset?: "contact";
  /**
   * Retired form: still routable at /admin/forms/[slug] (rows retained) but
   * hidden from the dashboard chips, the hub tile grid and the tab bar.
   */
  archived?: boolean;
};

const TALK_NIGHT_STATUSES: StatusOption[] = [
  { value: "new", label: "New", tone: "neutral" },
  { value: "accepted", label: "Accepted", tone: "live" },
  { value: "declined", label: "Declined", tone: "red" },
];

export const FORM_REGISTRY: FormEntry[] = [
  {
    slug: "youth-futures",
    label: "Youth Futures Lab",
    table: "youth_futures_registrations",
    select:
      "id, created_at, school_name, suburb, contact_name, contact_role, email, phone, student_count, year_levels, comments, marketing_consent, school_authorised, contacted",
    orderBy: "created_at",
    columns: [
      { id: "school_name", label: "School", headline: true },
      { id: "suburb", label: "Suburb", headline: true },
      { id: "student_count", label: "Students", headline: true },
      { id: "year_levels", label: "Year levels" },
      { id: "contact_name", label: "Contact" },
      { id: "contact_role", label: "Role" },
      { id: "email", label: "Email", link: "mailto" },
      { id: "phone", label: "Phone", link: "tel" },
      { id: "marketing_consent", label: "Marketing consent", boolean: true },
      { id: "school_authorised", label: "School authorised", boolean: true },
      { id: "comments", label: "Comments" },
    ],
    searchKeys: ["school_name", "suburb", "contact_name", "email", "year_levels"],
    exportName: "youth-futures-registrations",
    eyebrow: "Submissions",
    title: "Youth Futures Lab EOIs",
    noun: "registrations",
    describe: (rows) => {
      const totalStudents = rows.reduce(
        (sum, r) => sum + (Number(r.student_count) || 0),
        0,
      );
      return `${rows.length} school${rows.length === 1 ? "" : "s"} registered · ${totalStudents} students. Deadline: 26 June 2026.`;
    },
    emptyText:
      "No registrations yet. Submissions will appear here as schools register through /youth-futures-lab.",
    deleteAction: deleteYouthFutures,
    contactedAction: setYouthFuturesContacted,
    bulkDeleteAction: bulkDeleteYouthFutures,
    bulkContactedAction: bulkSetYouthFuturesContacted,
  },
  {
    slug: "student-speaker",
    label: "Student Speaker Comp",
    table: "student_speaker_submissions",
    select:
      "id, created_at, full_name, email, phone, school, post_code, city, talk_title, video_url, contacted",
    orderBy: "created_at",
    columns: [
      { id: "full_name", label: "Student", headline: true },
      { id: "school", label: "School", headline: true },
      { id: "talk_title", label: "Talk title", headline: true },
      { id: "email", label: "Email", link: "mailto" },
      { id: "phone", label: "Phone", link: "tel" },
      { id: "city", label: "City / Suburb" },
      { id: "post_code", label: "Post code" },
      { id: "video_url", label: "Video", link: "url", linkLabel: "Watch entry" },
    ],
    searchKeys: ["full_name", "school", "email", "city", "talk_title"],
    exportName: "student-speaker-entries",
    eyebrow: "Submissions",
    title: "Student Speaker Competition entries",
    noun: "entries",
    describe: (rows) =>
      `${rows.length} entr${rows.length === 1 ? "y" : "ies"}. Entries close 15 August 2026.`,
    emptyText:
      "No entries yet. Submissions will appear here as students enter via /student-speaker-competition.",
    deleteAction: deleteStudentSpeaker,
    contactedAction: setStudentSpeakerContacted,
    bulkDeleteAction: bulkDeleteStudentSpeaker,
    bulkContactedAction: bulkSetStudentSpeakerContacted,
  },
  {
    slug: "talk-night",
    label: "60-Second Talk Night",
    archived: true,
    table: "talk_night_registrations",
    select:
      "id, created_at, full_name, email, phone, attendance_type, idea, reason, guest_name, guest_email, guest_attendance_type, guest_idea, guest_reason, marketing_consent, contacted, status",
    orderBy: "created_at",
    columns: [
      { id: "full_name", label: "Name", headline: true },
      { id: "attendance_type", label: "Interest", headline: true, badge: "red" },
      { id: "guest_name", label: "Guest", headline: true },
      { id: "email", label: "Email", link: "mailto" },
      { id: "phone", label: "Phone", link: "tel" },
      { id: "idea", label: "Idea" },
      { id: "reason", label: "Why they'd come" },
      { id: "guest_attendance_type", label: "Guest interest" },
      { id: "guest_email", label: "Guest email", link: "mailto" },
      { id: "guest_idea", label: "Guest idea" },
      { id: "guest_reason", label: "Why the guest would come" },
      { id: "marketing_consent", label: "Marketing consent", boolean: true },
    ],
    searchKeys: ["full_name", "email", "attendance_type", "idea"],
    exportName: "talk-night-registrations",
    eyebrow: "Submissions",
    title: "60-Second Talk Night EOIs",
    noun: "registrations",
    describe: (rows) => {
      const speakers = rows.filter((r) => r.attendance_type === "speak").length;
      const guests = rows.filter((r) => r.guest_name).length;
      const accepted = rows.filter((r) => r.status === "accepted").length;
      return `${rows.length} registration${rows.length === 1 ? "" : "s"} · ${speakers} keen to speak · ${guests} bringing a guest · ${accepted} accepted. Event: 16 July 2026, The Base.`;
    },
    emptyText:
      "No registrations yet. Submissions will appear here as people register through /60-second-talk-night.",
    deleteAction: deleteTalkNight,
    contactedAction: setTalkNightContacted,
    bulkDeleteAction: bulkDeleteTalkNight,
    bulkContactedAction: bulkSetTalkNightContacted,
    statuses: TALK_NIGHT_STATUSES,
    statusAction: setTalkNightStatus,
    acceptedStatus: "accepted",
    emailField: "email",
    breakdown: {
      buckets: [
        {
          label: "keen to speak",
          fields: ["attendance_type", "guest_attendance_type"],
          values: ["speak"],
        },
        {
          label: "listening only",
          fields: ["attendance_type", "guest_attendance_type"],
          values: ["listen"],
        },
      ],
    },
  },
  {
    slug: "nominations",
    label: "Speakers",
    table: "nominations",
    select: "*",
    orderBy: "created_at",
    columns: [
      { id: "nominee_name", label: "Nominee", headline: true },
      { id: "nominee_title", label: "What they do", headline: true },
      { id: "relationship", label: "Relationship", badge: "neutral" },
      { id: "nominator_name", label: "Nominator" },
      { id: "nominator_email", label: "Nominator email", link: "mailto" },
      { id: "idea", label: "Idea" },
      { id: "link", label: "Link(s)", link: "url" },
    ],
    searchKeys: [
      "nominee_name",
      "nominee_title",
      "nominator_name",
      "nominator_email",
      "idea",
    ],
    exportName: "nominations",
    eyebrow: "Submissions · Speak",
    title: "Speaker nominations",
    noun: "nominations",
    describe: (rows) =>
      `${rows.length} nomination${rows.length === 1 ? "" : "s"} for the curation committee. Posted from /speak, promised reply window: six weeks.`,
    deleteAction: deleteNomination,
    contactedAction: setNominationContacted,
    bulkDeleteAction: bulkDeleteNominations,
    bulkContactedAction: bulkSetNominationsContacted,
  },
  {
    slug: "volunteers",
    label: "Volunteers",
    table: "applications",
    select: "*",
    orderBy: "created_at",
    columns: [
      {
        id: "first_name",
        label: "Name",
        combine: ["first_name", "last_name"],
        headline: true,
      },
      { id: "last_name", label: "Last name", detailOnly: true },
      { id: "crew", label: "Crew", badge: "red", headline: true },
      { id: "email", label: "Email", link: "mailto" },
      { id: "phone", label: "Phone", link: "tel" },
      { id: "note", label: "Note" },
    ],
    searchKeys: ["first_name", "last_name", "email", "crew", "note"],
    exportName: "applications",
    eyebrow: "Submissions · Volunteer",
    title: "Volunteer applications",
    noun: "applications",
    describe: (rows) =>
      `${rows.length} application${rows.length === 1 ? "" : "s"} in the pipeline. Posted from /volunteer, expected reply window: four weeks.`,
    deleteAction: deleteApplication,
    contactedAction: setApplicationContacted,
    bulkDeleteAction: bulkDeleteApplications,
    bulkContactedAction: bulkSetApplicationsContacted,
  },
  {
    slug: "sponsors",
    label: "Sponsors",
    table: "partner_enquiries",
    select: "*",
    orderBy: "created_at",
    columns: [
      { id: "organisation", label: "Organisation", headline: true },
      { id: "tier", label: "Tier", badge: "red" },
      { id: "contact_name", label: "Contact", headline: true },
      { id: "role", label: "Role" },
      { id: "email", label: "Email", link: "mailto" },
      { id: "phone", label: "Phone", link: "tel" },
      { id: "message", label: "Note" },
    ],
    searchKeys: [
      "organisation",
      "contact_name",
      "role",
      "email",
      "tier",
      "message",
    ],
    exportName: "partner-enquiries",
    eyebrow: "Submissions · Partner",
    title: "Partnership enquiries",
    noun: "enquiries",
    describe: (rows) =>
      `${rows.length} enquir${rows.length === 1 ? "y" : "ies"}. Posted from /partner. Back within a week with the 2026 partner pack.`,
    deleteAction: deletePartnerEnquiry,
    contactedAction: setPartnerEnquiryContacted,
    bulkDeleteAction: bulkDeletePartnerEnquiries,
    bulkContactedAction: bulkSetPartnerEnquiriesContacted,
  },
  {
    slug: "contact",
    label: "Contact",
    table: "contact_messages",
    select: "*",
    orderBy: "created_at",
    columns: [
      {
        id: "first_name",
        label: "From",
        combine: ["first_name", "last_name"],
        headline: true,
      },
      { id: "last_name", label: "Last name", detailOnly: true },
      { id: "email", label: "Email", link: "mailto", headline: true },
      { id: "phone", label: "Phone", link: "tel" },
      { id: "message", label: "Message" },
    ],
    searchKeys: ["first_name", "last_name", "email", "phone", "message"],
    exportName: "contact-messages",
    eyebrow: "Submissions · Contact",
    title: "General enquiries",
    noun: "messages",
    describe: (rows) =>
      `${rows.length} message${rows.length === 1 ? "" : "s"}. Toggle "Hide spam" to focus on the real ones. The filter catches rocketdigitaltech.com, Money Robot, and other repeat SEO outreach patterns.`,
    deleteAction: deleteContactMessage,
    contactedAction: setContactMessageContacted,
    bulkDeleteAction: bulkDeleteContactMessages,
    bulkContactedAction: bulkSetContactMessagesContacted,
    spamPreset: "contact",
  },
];

/**
 * Forms shown on the dashboard, the hub tile grid and the tab bar. Archived
 * forms (retired inboxes) are kept in FORM_REGISTRY so their route and rows
 * survive, but drop out of these shared overviews.
 */
export const VISIBLE_FORMS: FormEntry[] = FORM_REGISTRY.filter(
  (f) => !f.archived,
);

/** Look up a form entry by its URL slug. */
export function formBySlug(slug: string): FormEntry | undefined {
  return FORM_REGISTRY.find((f) => f.slug === slug);
}
