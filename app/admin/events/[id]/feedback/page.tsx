import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { getEventAttendees, getEventFeedback } from "@/lib/event-feedback";
import {
  importedFeedbackForSlug,
  type ImportedQuestion,
  type ImportedResponse,
} from "@/lib/imported-feedback";
import { summarizeFeedback } from "@/lib/feedback-summary";
import type { FeedbackResponse } from "@/lib/event-feedback";
import { PageHeader, SectionLabel } from "../../../ui";
import FeedbackOverview, { MetricCard, BigStat } from "./FeedbackOverview";
import FeedbackTable from "./FeedbackTable";
import ImportedFeedback from "./ImportedFeedback";

export const metadata = {
  title: "Feedback · Events · Admin · TEDxNewy",
};

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

export default async function EventFeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireFullAdmin();
  const { id } = await params;

  const supabase = await getServerSupabase();
  const { data: event } = await supabase
    .from("cms_events")
    .select("id, slug, title")
    .eq("id", id)
    .single();
  if (!event) notFound();

  const [responses, attendees] = await Promise.all([
    getEventFeedback(id),
    getEventAttendees(id),
  ]);

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
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/events/${encodeURIComponent(id)}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6b6459] hover:text-[#141210]"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
          Back to event
        </Link>
      </div>

      <PageHeader
        eyebrow="Events"
        title={`Feedback · ${event.title}`}
        description="What attendees told us, summarised at a glance. Export the raw responses to slice however you like."
      />

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
