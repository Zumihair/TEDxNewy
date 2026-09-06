import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import {
  getEventAttendees,
  getEventFeedback,
  getEventIdsWithFeedback,
} from "@/lib/event-feedback";
import { importedFeedbackForSlug } from "@/lib/imported-feedback";
import {
  getEventImpactData,
  getReportEvent,
  listReports,
} from "@/lib/event-reports";
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
import FeedbackContent from "./[id]/feedback/FeedbackContent";
import ReportsListContent from "./[id]/reports/ReportsListContent";
import { NotSetUp, PageHeader } from "../ui";
import EventsTable, { type EventRow } from "./EventsTable";
import FlashToast from "../FlashToast";

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

/** Events that get an Impact report chip. Feedback and Attendees are
 *  data-driven (see below); this can't be, since the chip's job includes
 *  starting a report with nothing on file yet. */
const IMPACT_REPORT_EVENT_SLUGS = new Set(["youth-futures-lab"]);

/** Loose name match between our event title and a Humanitix listing name,
 *  same idiom `lib/ticket-summary.ts` and `/admin/tickets`'s own `?q=` match
 *  already use, generalised so a Demographics chip appears for ANY event
 *  with real ticket sales rather than a hardcoded title regex. */
function namesMatch(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x.includes(y) || y.includes(x);
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  await requireFullAdmin();
  const { saved, deleted } = await searchParams;
  const supabase = await getServerSupabase();

  const { data: events, error } = await supabase
    .from("cms_events")
    .select("*")
    .order("starts_at", { ascending: false, nullsFirst: false })
    .order("display_order", { ascending: true });

  if (error || !events) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Events"
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
    const match = hxWithSales.find((h) => namesMatch(h.name, e.title as string));
    if (match) hxByEventId.set(e.id as string, match);
  }

  const rows: EventRow[] = await Promise.all(
    events.map(async (raw) => {
      const e = raw as Record<string, unknown>;
      const id = e.id as string;
      const slug = e.slug as string;
      const title = e.title as string;
      const chips: EventRow["chips"] = {};

      const formSlug = SUBMISSIONS_FORM_BY_EVENT_SLUG[slug];
      const submissionsEntry = formSlug ? formBySlug(formSlug) : undefined;
      const wantsAttendees = ATTENDEES_IMPORT_EVENT_SLUGS.has(slug);
      const imported = importedFeedbackForSlug(slug);
      const wantsFeedback = feedbackEventIds.has(id) || Boolean(imported);
      const wantsImpactReport = IMPACT_REPORT_EVENT_SLUGS.has(slug);

      // Every chip's data need is independent of the others (Feedback's
      // completion % just reuses whatever Attendees already fetched), so
      // they run together rather than as a chain of sequential awaits.
      const [submissionRows, attendees, feedbackResponses, reportEvent] =
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
          wantsImpactReport ? getReportEvent(id) : Promise.resolve(null),
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
            event={{ slug, title }}
            responses={feedbackResponses ?? []}
            attendees={attendees ?? []}
          />
        );
      }

      // Impact report: listReports + getEventImpactData both depend on
      // reportEvent (already fetched above alongside everything else), so
      // this pair is the one genuine sequential dependency left.
      if (wantsImpactReport && reportEvent) {
        const [reports, data] = await Promise.all([
          listReports(id),
          getEventImpactData(reportEvent),
        ]);
        const sources: string[] = [];
        sources.push(`${data.photos.length} photo${data.photos.length === 1 ? "" : "s"}`);
        if (data.attendeeCount) sources.push(`${data.attendeeCount} attendees`);
        if (data.responseCount) sources.push(`${data.responseCount} feedback responses`);
        else if (data.imported) sources.push(`${data.imported.responseCount} archived survey responses`);
        if (data.testimonials.length) sources.push(`${data.testimonials.length} quotable testimonials`);
        if (data.speakerNames.length) sources.push(`${data.speakerNames.length} speakers`);
        if (data.talkCount) sources.push(`${data.talkCount} talks`);
        chips.impactReport = (
          <ReportsListContent
            eventId={id}
            eventTitle={title}
            reports={reports}
            sources={sources}
            returnTo="/admin/events"
          />
        );
      }

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
        tagline: e.tagline as string | null,
        blurb: e.blurb as string | null,
        kind: e.kind as EventRow["kind"],
        status: e.status as EventRow["status"],
        starts_at: e.starts_at as string | null,
        date_label: e.date_label as string | null,
        short_date: e.short_date as string | null,
        venue: e.venue as string | null,
        hero_image_url: e.hero_image_url as string | null,
        link_url: e.link_url as string | null,
        link_label: e.link_label as string | null,
        ticket_url: e.ticket_url as string | null,
        show_in_nav: e.show_in_nav as boolean,
        display_order: e.display_order as number,
        chips,
      };
    }),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Events"
        title="Events"
        description="The season, from the flagship main stage to salons and special nights. Announced events show in the header menu and on /events. Past events power the home page. Edits go live within a minute."
      />

      {saved && (
        <FlashToast clear="saved">Saved — changes are live within a minute.</FlashToast>
      )}
      {deleted && <FlashToast clear="deleted">Deleted.</FlashToast>}

      <EventsTable events={rows} />
    </div>
  );
}
