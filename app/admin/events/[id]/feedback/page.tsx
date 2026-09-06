import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { getEventAttendees, getEventFeedback } from "@/lib/event-feedback";
import { PageHeader } from "../../../ui";
import FeedbackContent from "./FeedbackContent";

export const metadata = {
  title: "Feedback · Events · Admin · TEDxNewy",
};

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

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6b6459] hover:text-[#141210]"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
          Back to events
        </Link>
      </div>

      <PageHeader
        eyebrow="Events"
        title={`Feedback · ${event.title}`}
        description="What attendees told us, summarised at a glance. Export the raw responses to slice however you like."
      />

      <FeedbackContent event={event} responses={responses} attendees={attendees} />
    </div>
  );
}
