import {
  importedFeedbackForSlug,
  type ImportedQuestion,
  type ImportedResponse,
} from "@/lib/imported-feedback";
import { summarizeFeedback } from "@/lib/feedback-summary";
import type { EventAttendee, FeedbackResponse } from "@/lib/event-feedback";
import Link from "next/link";
import { Eye, Mail, Send } from "lucide-react";
import { Card, SectionLabel } from "../../../ui";
import { PendingButton } from "../../../PendingButtons";
import { sendFeedbackRequestsAction, sendFeedbackToCheckedInAction } from "../attendees/actions";
import FeedbackOverview, { MetricCard, BigStat } from "./FeedbackOverview";
import FeedbackTable from "./FeedbackTable";
import ImportedFeedback from "./ImportedFeedback";

/**
 * The Feedback page's actual content: glance overview, response table,
 * archived feedback. Split out of page.tsx (2026-09-06) so the Events
 * list's Feedback modal can render the exact same thing without the page's
 * back-link/PageHeader chrome.
 */

// The native feedback form as questions, so its responses flow through the same
// summariser as the imported archives and every answer gets a glance card.
const NATIVE_QUESTIONS: ImportedQuestion[] = [
  { key: "overall", label: "Overall rating", type: "rating", max: 5 },
  { key: "been", label: "Been to TEDxNewy before", type: "boolean" },
  { key: "met", label: "Met someone new", type: "boolean" },
  { key: "ideas", label: "Left with new ideas", type: "boolean" },
  { key: "return", label: "Likelihood of returning", type: "choice" },
];

function toNativeResponses(responses: FeedbackResponse[]): ImportedResponse[] {
  return responses.map((r) => ({
    submittedAt: r.submittedAt,
    name: null,
    answers: {
      overall: r.overallRating,
      been: r.beenBefore,
      met: r.metSomeone,
      ideas: r.newIdeas,
      return: r.returnLikelihood,
    },
  }));
}

export default function FeedbackContent({
  event,
  responses,
  attendees,
  returnTo,
}: {
  event: { id?: string; slug: string; title: string };
  responses: FeedbackResponse[];
  attendees: EventAttendee[];
  /** Where the request form lands afterwards. */
  returnTo?: string;
}) {
  const emails = attendees.map((a) => a.email);
  const requested = attendees.filter((a) => a.feedbackRequestedAt).length;
  const composeHref = `/admin/emails?to=${encodeURIComponent(emails.join(","))}#compose`;
  const imported = importedFeedbackForSlug(event.slug);

  const nameById: Record<string, string> = {};
  for (const a of attendees) nameById[a.id] = a.fullName;

  const completionPct =
    attendees.length > 0
      ? Math.round((responses.length / attendees.length) * 100)
      : null;

  const hasNative = responses.length > 0;
  const summaries = hasNative
    ? summarizeFeedback(NATIVE_QUESTIONS, toNativeResponses(responses))
    : [];

  // Leading glance cards for the native overview: totals that aren't questions.
  const leading = (
    <>
      <MetricCard label="Responses">
        <BigStat value={String(responses.length)} />
      </MetricCard>
      <MetricCard label="Completion">
        {completionPct == null ? (
          <BigStat value="—" />
        ) : (
          <BigStat value={`${completionPct}%`} caption={`of ${attendees.length}`} />
        )}
      </MetricCard>
    </>
  );

  return (
    <div className="space-y-6">
      {event.id && emails.length > 0 && (
        <Card>
          <div className="flex flex-wrap items-center gap-3 px-4 py-4 md:px-5">
            <form action={sendFeedbackRequestsAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="returnTo" value={returnTo ?? `/admin/events/${event.id}/feedback`} />
              <PendingButton icon={<Send className="h-4 w-4" strokeWidth={2.25} />}>
                {event.slug === "signal-2026" ? "Send to everyone not yet asked" : "Send feedback request"}
              </PendingButton>
            </form>
            {event.slug === "signal-2026" && (
              <form action={sendFeedbackToCheckedInAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="returnTo" value={returnTo ?? `/admin/events/${event.id}/feedback`} />
                <PendingButton icon={<Send className="h-4 w-4" strokeWidth={2.25} />}>Send to people who checked in</PendingButton>
              </form>
            )}
            {event.id && (
              <>
                <a
                  href={`/api/admin/feedback-preview/${event.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="tx-btn tx-btn--secondary tx-btn--sm tx-btn--auto"
                >
                  <Eye className="h-4 w-4" strokeWidth={2.25} />
                  Preview email
                </a>
                <a
                  href={`/api/admin/feedback-preview/${event.id}?kind=reminder`}
                  target="_blank"
                  rel="noreferrer"
                  className="tx-btn tx-btn--secondary tx-btn--sm tx-btn--auto"
                >
                  <Eye className="h-4 w-4" strokeWidth={2.25} />
                  Preview reminder
                </a>
              </>
            )}
            <Link href={composeHref} className="tx-btn tx-btn--secondary tx-btn--sm tx-btn--auto adm-write">
              <Mail className="h-4 w-4" strokeWidth={2.25} />
              Email everyone
            </Link>
            <span className="text-[12.5px] text-[#6b6459]">
              {emails.length} on the list{requested ? ` · ${requested} asked` : ""}
            </span>
          </div>
          <p className="border-t border-[rgba(0,0,0,0.08)] px-4 py-3 text-[12.5px] text-[#6b6459] md:px-5">
            &ldquo;Send feedback request&rdquo; emails everyone who has not been asked yet, each with their own link.
            A single reminder goes to non-responders after 3 days, automatically.
            {event.slug === "signal-2026" &&
              " For Signal, “Send to people who checked in” only emails bookings with at least one guest scanned in on the day."}
          </p>
        </Card>
      )}
      {hasNative && <FeedbackOverview summaries={summaries} leading={leading} />}

      {(hasNative || !imported) && (
        <FeedbackTable
          responses={responses}
          nameById={nameById}
          eventTitle={event.title}
        />
      )}

      {imported && (
        <>
          {hasNative && (
            <div className="pt-2">
              <SectionLabel>Archived feedback</SectionLabel>
            </div>
          )}
          <ImportedFeedback dataset={imported} />
        </>
      )}
    </div>
  );
}
