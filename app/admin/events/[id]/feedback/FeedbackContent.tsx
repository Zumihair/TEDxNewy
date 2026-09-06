import {
  importedFeedbackForSlug,
  type ImportedQuestion,
  type ImportedResponse,
} from "@/lib/imported-feedback";
import { summarizeFeedback } from "@/lib/feedback-summary";
import type { EventAttendee, FeedbackResponse } from "@/lib/event-feedback";
import { SectionLabel } from "../../../ui";
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
}: {
  event: { slug: string; title: string };
  responses: FeedbackResponse[];
  attendees: EventAttendee[];
}) {
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
