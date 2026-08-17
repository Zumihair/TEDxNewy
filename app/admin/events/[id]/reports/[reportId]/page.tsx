import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import {
  getEventImpactData,
  getReport,
  getReportEvent,
} from "@/lib/event-reports";
import ReportEditor from "./ReportEditor";

export const metadata = {
  title: "Edit impact report · Admin · TEDxNewy",
};

export default async function ReportEditorPage({
  params,
}: {
  params: Promise<{ id: string; reportId: string }>;
}) {
  await requireFullAdmin();
  const { id, reportId } = await params;

  const [event, report] = await Promise.all([getReportEvent(id), getReport(reportId)]);
  if (!event || !report || report.eventId !== event.id) notFound();

  const data = await getEventImpactData(event);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/events/${encodeURIComponent(id)}/reports`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6b6459] hover:text-[#141210]"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
          Back to reports
        </Link>
      </div>

      <ReportEditor
        eventId={id}
        eventTitle={event.title}
        report={{
          id: report.id,
          title: report.title,
          kind: report.kind,
          status: report.status,
          config: report.config,
          pdfUrl: report.pdfUrl,
          pdfGeneratedAt: report.pdfGeneratedAt,
          updatedAt: report.updatedAt,
        }}
        photos={data.photos.map((p) => ({ url: p.url, thumbUrl: p.thumbUrl }))}
        suggestions={{
          stats: [
            ...(data.attendeeCount ? [{ value: String(data.attendeeCount), label: "people in the room" }] : []),
            ...(data.speakerNames.length ? [{ value: String(data.speakerNames.length), label: "speakers on stage" }] : []),
            ...(data.talkCount ? [{ value: String(data.talkCount), label: "talks now online" }] : []),
            ...(data.photos.length ? [{ value: String(data.photos.length), label: "photos in the gallery" }] : []),
            ...(data.responseCount ? [{ value: String(data.responseCount), label: "feedback responses" }] : []),
            ...data.feedbackStats,
            ...(data.imported?.stats ?? []),
          ],
          testimonials: data.testimonials,
          partners: data.partners,
        }}
      />
    </div>
  );
}
