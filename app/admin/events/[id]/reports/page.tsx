import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import {
  getEventImpactData,
  getReportEvent,
  listReports,
} from "@/lib/event-reports";
import { PageHeader } from "../../../ui";
import ReportsListContent from "./ReportsListContent";
import FlashToast from "../../../FlashToast";
import { asTone } from "../../../flash";

export const metadata = {
  title: "Impact reports · Events · Admin · TEDxNewy",
};

export default async function EventReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ flash?: string; tone?: string }>;
}) {
  await requireFullAdmin();
  const { id } = await params;
  const { flash, tone } = await searchParams;

  const event = await getReportEvent(id);
  if (!event) notFound();

  const [reports, data] = await Promise.all([
    listReports(id),
    getEventImpactData(event),
  ]);

  const sources: string[] = [];
  sources.push(`${data.photos.length} photo${data.photos.length === 1 ? "" : "s"}`);
  if (data.attendeeCount) sources.push(`${data.attendeeCount} attendees`);
  if (data.responseCount) sources.push(`${data.responseCount} feedback responses`);
  else if (data.imported) sources.push(`${data.imported.responseCount} archived survey responses`);
  if (data.testimonials.length) sources.push(`${data.testimonials.length} quotable testimonials`);
  if (data.speakerNames.length) sources.push(`${data.speakerNames.length} speakers`);
  if (data.talkCount) sources.push(`${data.talkCount} talks`);

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
        title={`Impact reports · ${event.title}`}
        description="Shareable PDF reports built from this event's photos, numbers and feedback, in the site's design. Draft one, edit the words, export it, and it stays here for the team."
      />

      {flash && (
        <FlashToast tone={asTone(tone)} clear={["flash", "tone"]}>
          {flash}
        </FlashToast>
      )}

      <ReportsListContent
        eventId={id}
        eventTitle={event.title}
        reports={reports}
        sources={sources}
        returnTo={`/admin/events/${encodeURIComponent(id)}/reports`}
      />
    </div>
  );
}
