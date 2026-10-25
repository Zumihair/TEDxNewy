import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import {
  getEventAttendees,
  getEventFeedback,
  getEventIdsWithFeedback,
} from "@/lib/event-feedback";
import { importedFeedbackForSlug } from "@/lib/imported-feedback";
import {
  buildAudience,
  DemographicsContent,
  getHumanitixEventsWithSalesCached,
  type HumanitixEventWithSales,
} from "../tickets/demographics";
import { formBySlug } from "../forms/registry";
import {
  deleteStudentSpeakerFromEvents,
  bulkDeleteStudentSpeakerFromEvents,
} from "../submissions-actions";
import SubmissionsTable, { type Row as SubmissionRow } from "../SubmissionsTable";
import AttendeesContent from "./[id]/attendees/AttendeesContent";
import EventReportPanel from "./EventReportPanel";
import FeedbackContent from "./[id]/feedback/FeedbackContent";
import { NotSetUp, PageHeader } from "../ui";
import EventsTable, { type EventRow } from "./EventsTable";
import Link from "next/link";
import { humanitixMatches } from "@/lib/humanitix";
import { Meter } from "@/components/ds";
import { getTicketSummary } from "@/lib/ticket-summary";

/**
 * Which chips an event gets is mostly DATA-DRIVEN, not a fixed set applied
 * to every row (see the CLAUDE.md gotcha on the Events page rebuild,
 * 2026-09-06). Two things genuinely can't be inferred from existing data
 * (a chip whose whole job includes *creating* something), so they're a
 * short, deliberately explicit opt-in list each, edited by hand when a new
 * event needs the same treatment:
 */

/** cms_events.slug -> FORM_REGISTRY slug, for a Submissions chip. Student
 *  Speaker entries live in their own table, not event_attendees, so this is
 *  a direct Forms-hub view rather than the generic Attendees chip below. */
const SUBMISSIONS_FORM_BY_EVENT_SLUG: Record<string, string> = {
  "student-speaker-competition": "student-speaker",
};

/** The Submissions table's delete actions redirect on completion, and
 *  FORM_REGISTRY's own `deleteAction`/`bulkDeleteAction` are bound to the
 *  Forms hub tab (`/admin/forms/<slug>`), wrong when this same table is
 *  rendered in a modal here instead. Keyed by FORM_REGISTRY slug; add an
 *  entry (and the matching `*FromEvents` actions in submissions-actions.ts)
 *  if a second form ever joins SUBMISSIONS_FORM_BY_EVENT_SLUG. */
const SUBMISSIONS_DELETE_OVERRIDE_BY_FORM_SLUG: Record<
  string,
  { deleteAction: (formData: FormData) => Promise<void>; bulkDeleteAction: (formData: FormData) => Promise<void> }
> = {
  "student-speaker": {
    deleteAction: deleteStudentSpeakerFromEvents,
    bulkDeleteAction: bulkDeleteStudentSpeakerFromEvents,
  },
};

/** cms_events.slug -> which import button(s) the Attendees chip offers.
 *  Student Speaker is deliberately NOT here: its entries are the Submissions
 *  chip above, not a second "Attendees" view of the same data. */
const ATTENDEES_IMPORT_EVENT_SLUGS = new Set([
  "60-second-talk-night",
  "youth-futures-lab",
]);

export default async function AdminEventsPage() {
  await requireFullAdmin();
  const supabase = await getServerSupabase();

  const { data: events, error } = await supabase
    .from("cms_events")
    .select("*")
    .order("starts_at", { ascending: false, nullsFirst: false })
    .order("display_order", { ascending: true });

  if (error || !events) {
    return (
      <div className="adm-stack">
        <PageHeader
          title="Events"
          description="The season, from the flagship main stage to salons and special nights."
        />
        <NotSetUp title="Events aren't set up yet">
          The events database update hasn&rsquo;t been applied yet. Ask Will to
          run the database update, then reload this page.
        </NotSetUp>
      </div>
    );
  }

  // One query for every event's native-feedback status, instead of one per
  // event: a Feedback chip needs to know only whether the set is non-empty.
  const feedbackEventIds = await getEventIdsWithFeedback();

  // Every Humanitix event with real sales, fetched ONCE and cached 5 minutes
  // (getHumanitixEventsWithSalesCached) rather than live on every page load:
  // this only decides whether to show a Demographics chip, not a sales
  // figure. Matched against our own titles here, so a Demographics chip is
  // self-extending rather than a title list to maintain by hand.
  const hxWithSales = await getHumanitixEventsWithSalesCached();
  const hxByEventId = new Map<string, HumanitixEventWithSales>();
  for (const e of events) {
    const match = hxWithSales.find((h) =>
      humanitixMatches({ slug: e.slug as string, title: e.title as string }, h),
    );
    if (match) hxByEventId.set(e.id as string, match);
  }

  const { data: docRows } = await supabase
    .from("cms_documents")
    .select("id, title, file_url")
    .order("created_at", { ascending: false })
    .limit(100);
  const libraryDocs = (docRows ?? []) as { id: string; title: string; file_url: string }[];

  const rows: EventRow[] = await Promise.all(
    events.map(async (raw) => {
      const e = raw as Record<string, unknown>;
      const id = e.id as string;
      const slug = e.slug as string;
      const title = e.title as string;
      const chips: EventRow["chips"] = {};

      const formSlug = SUBMISSIONS_FORM_BY_EVENT_SLUG[slug];
      const submissionsEntry = formSlug ? formBySlug(formSlug) : undefined;
      const wantsAttendees = ATTENDEES_IMPORT_EVENT_SLUGS.has(slug) || hxByEventId.has(id);
      const imported = importedFeedbackForSlug(slug);
      // A past event with an attendee list can collect feedback before the first
      // response arrives (that is when the request is sent), so it gets the chip too.
      const wantsFeedback =
        feedbackEventIds.has(id) ||
        Boolean(imported) ||
        (wantsAttendees && e.status === "past");

      // Every chip's data need is independent of the others (Feedback's
      // completion % just reuses whatever Attendees already fetched), so
      // they run together rather than as a chain of sequential awaits.
      const [submissionRows, attendees, feedbackResponses] =
        await Promise.all([
          submissionsEntry
            ? supabase
                .from(submissionsEntry.table)
                .select(submissionsEntry.select)
                .order(submissionsEntry.orderBy, { ascending: false })
                .then((r) => (r.data ?? []) as unknown as SubmissionRow[])
            : Promise.resolve<SubmissionRow[] | null>(null),
          wantsAttendees || wantsFeedback
            ? getEventAttendees(id)
            : Promise.resolve(null),
          wantsFeedback ? getEventFeedback(id) : Promise.resolve(null),
        ]);

      if (submissionsEntry && submissionRows) {
        const deleteOverride = SUBMISSIONS_DELETE_OVERRIDE_BY_FORM_SLUG[formSlug!];
        chips.submissions = (
          <div className="space-y-4">
            <p className="text-[13.5px] text-[#6b6459]">
              {submissionsEntry.describe(submissionRows)}
            </p>
            <SubmissionsTable
              rows={submissionRows}
              columns={submissionsEntry.columns}
              searchKeys={submissionsEntry.searchKeys}
              deleteAction={deleteOverride?.deleteAction ?? submissionsEntry.deleteAction}
              contactedAction={submissionsEntry.contactedAction}
              bulkDeleteAction={deleteOverride?.bulkDeleteAction ?? submissionsEntry.bulkDeleteAction}
              bulkContactedAction={submissionsEntry.bulkContactedAction}
              exportName={submissionsEntry.exportName}
              spamPreset={submissionsEntry.spamPreset}
              statuses={submissionsEntry.statuses}
              statusAction={submissionsEntry.statusAction}
              acceptedStatus={submissionsEntry.acceptedStatus}
              emailField={submissionsEntry.emailField}
              breakdown={submissionsEntry.breakdown}
            />
          </div>
        );
      }

      if (wantsAttendees && attendees) {
        chips.attendees = (
          <AttendeesContent
            event={{ id, slug, title }}
            attendees={attendees}
            returnTo="/admin/events"
          />
        );
      }
      if (wantsFeedback) {
        chips.feedback = (
          <FeedbackContent
            event={{ id, slug, title }}
            returnTo="/admin/events"
            responses={feedbackResponses ?? []}
            attendees={attendees ?? []}
          />
        );
      }

      // Report: any event can have one attached (a file, a library document or a link).
      const attached = e.report_url
        ? { url: String(e.report_url), title: String(e.report_title ?? "Report") }
        : null;
      chips.impactReport = <EventReportPanel eventId={id} eventSlug={slug} current={attached} docs={libraryDocs} />;

      // Demographics: a plain lookup + local compute now, no I/O (the
      // Humanitix fetch already happened once, cached, above the loop).
      const hx = hxByEventId.get(id);
      if (hx) {
        const audience = buildAudience(hx.stats);
        chips.demographics = (
          <DemographicsContent
            eventName={hx.name}
            audience={audience}
            sampleKeys={hx.stats.sampleKeys}
          />
        );
      }

      return {
        id,
        slug,
        title,
        status: e.status as EventRow["status"],
        starts_at: e.starts_at as string | null,
        date_label: e.date_label as string | null,
        short_date: e.short_date as string | null,
        venue: e.venue as string | null,
        chips,
      };
    }),
  );

  // Upcoming first (soonest first), then past (most recent first).
  const when = (r: EventRow) => (r.starts_at ? new Date(r.starts_at).getTime() : 0);
  const upcoming = rows.filter((r) => r.status !== "past").sort((x, y) => when(x) - when(y));
  const past = rows.filter((r) => r.status === "past").sort((x, y) => when(y) - when(x));
  const tickets = await getTicketSummary();

  return (
    <div className="adm-stack">
      <PageHeader
        title="Events"
        description="What each event gathered: submissions, attendees, feedback and who bought tickets. Events themselves change through code and database migrations."
      />

      {tickets && (
        <Link href="/admin/tickets" className="adm-ticketstrip">
          <div className="adm-ticketstrip__main">
            <span className="tx-stat__label">{tickets.eventName} tickets</span>
            <span className="adm-ticketstrip__value">
              {tickets.sold}
              {tickets.capacity ? <small> of {tickets.capacity}</small> : null}
            </span>
          </div>
          <div className="adm-ticketstrip__meter">
            <Meter label="Sold" value={tickets.pct ?? 0} display={tickets.pct != null ? `${tickets.pct}%` : ""} />
          </div>
          <div className="adm-ticketstrip__side">
            <span className="tx-stat__label">Revenue</span>
            <strong>{tickets.revenue.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 })}</strong>
          </div>
          <div className="adm-ticketstrip__side">
            <span className="tx-stat__label">Last 7 days</span>
            <strong>+{tickets.last7}</strong>
          </div>
        </Link>
      )}

      {upcoming.length > 0 && (
        <section className="adm-section">
          <h2 className="adm-section__title">Coming up</h2>
          <EventsTable events={upcoming} />
        </section>
      )}
      {past.length > 0 && (
        <section className="adm-section">
          <h2 className="adm-section__title">Past events</h2>
          <EventsTable events={past} />
        </section>
      )}
    </div>
  );
}
