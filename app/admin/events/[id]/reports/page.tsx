import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, ExternalLink, Sparkles } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import {
  getEventImpactData,
  getReportEvent,
  listReports,
} from "@/lib/event-reports";
import { pageCount } from "@/lib/report-schema";
import { Badge, Card, Field, NotSetUp, PageHeader, SectionLabel, inputCls } from "../../../ui";
import { PendingButton, PendingDangerButton } from "../../../PendingButtons";
import { createReportAction, deleteReportAction } from "./actions";
import FlashToast from "../../../FlashToast";
import { asTone } from "../../../flash";

export const metadata = {
  title: "Impact reports · Events · Admin · TEDxNewy",
};

function when(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

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

      {reports === null ? (
        <NotSetUp title="Impact reports are not set up yet">
          Run <code>supabase/migrations/20260817b_event_reports.sql</code> in
          the Supabase SQL editor, then reload this page.
        </NotSetUp>
      ) : (
        <>
          <Card>
            <div className="px-5 py-5">
              <SectionLabel>Start a new report</SectionLabel>
              <p className="mt-2 text-[13.5px] leading-[1.6] text-[#6b6459]">
                Seeded from what this event already has on file: {sources.join(", ")}.
                Everything can be rewritten in the editor.
              </p>
              <form action={createReportAction} className="mt-5 grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
                <input type="hidden" name="eventId" value={id} />
                <Field label="Title" hint="Internal name; the cover title is edited separately.">
                  <input
                    name="title"
                    className={inputCls}
                    placeholder={`${event.title} impact report`}
                  />
                </Field>
                <Field label="Type">
                  <select name="kind" className={inputCls} defaultValue="overview">
                    <option value="overview">Overview (whole event)</option>
                    <option value="highlight">Highlight (one theme or room)</option>
                  </select>
                </Field>
                <PendingButton icon={<Sparkles className="h-4 w-4" strokeWidth={2.25} />}>
                  Create draft
                </PendingButton>
              </form>
            </div>
          </Card>

          <div>
            <SectionLabel>Reports</SectionLabel>
            {reports.length === 0 ? (
              <p className="mt-3 text-[13.5px] text-[#6b6459]">
                No reports yet for this event.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {reports.map((r) => (
                  <li key={r.id}>
                    <Card>
                      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4efe6] text-[#b91404]">
                          <FileText className="h-4.5 w-4.5" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/admin/events/${encodeURIComponent(id)}/reports/${encodeURIComponent(r.id)}`}
                            className="font-sans text-[16px] font-medium text-[#141210] hover:underline"
                          >
                            {r.title}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6b6459]">
                            <Badge tone={r.status === "final" ? "live" : "draft"}>
                              {r.status === "final" ? "Final" : "Draft"}
                            </Badge>
                            <Badge tone="neutral">
                              {r.kind === "highlight" ? "Highlight" : "Overview"}
                            </Badge>
                            <span>{pageCount(r.config)} pages</span>
                            <span>Updated {when(r.updatedAt)}</span>
                            {r.pdfGeneratedAt && <span>PDF {when(r.pdfGeneratedAt)}</span>}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {r.pdfUrl && (
                            <a
                              href={r.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                            >
                              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
                              Open PDF
                            </a>
                          )}
                          <Link
                            href={`/admin/events/${encodeURIComponent(id)}/reports/${encodeURIComponent(r.id)}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                          >
                            Edit
                          </Link>
                          <form action={deleteReportAction}>
                            <input type="hidden" name="eventId" value={id} />
                            <input type="hidden" name="reportId" value={r.id} />
                            <PendingDangerButton>Delete</PendingDangerButton>
                          </form>
                        </div>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
