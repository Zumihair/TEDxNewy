import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { getEventAttendees, getEventFeedback } from "@/lib/event-feedback";
import { Card, PageHeader } from "../../../ui";
import FeedbackTable from "./FeedbackTable";

export const metadata = {
  title: "Feedback · Events · Admin · TEDxNewy",
};

export default async function EventFeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
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

  const nameById: Record<string, string> = {};
  for (const a of attendees) nameById[a.id] = a.fullName;

  const rated = responses.filter((r) => r.overallRating != null);
  const avgRating =
    rated.length > 0
      ? (
          rated.reduce((sum, r) => sum + (r.overallRating ?? 0), 0) /
          rated.length
        ).toFixed(1)
      : null;
  const completionPct =
    attendees.length > 0
      ? Math.round((responses.length / attendees.length) * 100)
      : null;

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
        description="What attendees told us. Export the raw responses to slice however you like."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Stat label="Responses" value={String(responses.length)} />
        <Stat label="Avg rating" value={avgRating ? `${avgRating} / 5` : "—"} />
        <Stat
          label="Completion"
          value={
            completionPct == null
              ? "—"
              : `${completionPct}% of ${attendees.length}`
          }
        />
      </div>

      <FeedbackTable
        responses={responses}
        nameById={nameById}
        eventTitle={event.title}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <div className="px-4 py-4 md:px-5">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a8278]">
          {label}
        </div>
        <div className="mt-1.5 font-sans text-[26px] font-medium leading-none tracking-[-0.02em] text-[#141210]">
          {value}
        </div>
      </div>
    </Card>
  );
}
