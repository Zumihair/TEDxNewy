import Link from "next/link";
import { FileText, ExternalLink, Sparkles } from "lucide-react";
import type { EventReport } from "@/lib/event-reports";
import { pageCount } from "@/lib/report-schema";
import { Badge, Card, Field, NotSetUp, SectionLabel, inputCls } from "../../../ui";
import { PendingButton, PendingDangerButton } from "../../../PendingButtons";
import { createReportAction, deleteReportAction } from "./actions";

function when(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * The Impact reports list's actual content: "start a new report" plus the
 * report list. Split out of page.tsx (2026-09-06) so the Events list's
 * Impact report modal can render the exact same thing without the page's
 * back-link/PageHeader chrome. Each report's own editor
 * (reports/[reportId]/ReportEditor.tsx, a live iframe preview plus PDF
 * generation) stays a full page; only this list is shared.
 */
export default function ReportsListContent({
  eventId,
  eventTitle,
  reports,
  sources,
  returnTo,
}: {
  eventId: string;
  eventTitle: string;
  reports: EventReport[] | null;
  sources: string[];
  /** Where create/delete redirect on completion: the standalone page
   *  passes its own path, the Events-list modal passes "/admin/events". */
  returnTo: string;
}) {
  if (reports === null) {
    return (
      <NotSetUp title="Impact reports are not set up yet">
        Run <code>supabase/migrations/20260817b_event_reports.sql</code> in
        the Supabase SQL editor, then reload this page.
      </NotSetUp>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="px-5 py-5">
          <SectionLabel>Start a new report</SectionLabel>
          <p className="mt-2 text-[13.5px] leading-[1.6] text-[#6b6459]">
            Seeded from what this event already has on file: {sources.join(", ")}.
            Everything can be rewritten in the editor.
          </p>
          <form action={createReportAction} className="mt-5 grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <Field label="Title" hint="Internal name; the cover title is edited separately.">
              <input
                name="title"
                className={inputCls}
                placeholder={`${eventTitle} impact report`}
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
                        href={`/admin/events/${encodeURIComponent(eventId)}/reports/${encodeURIComponent(r.id)}`}
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
                        href={`/admin/events/${encodeURIComponent(eventId)}/reports/${encodeURIComponent(r.id)}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                      >
                        Edit
                      </Link>
                      <form action={deleteReportAction}>
                        <input type="hidden" name="eventId" value={eventId} />
                        <input type="hidden" name="reportId" value={r.id} />
                        <input type="hidden" name="returnTo" value={returnTo} />
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
    </div>
  );
}
