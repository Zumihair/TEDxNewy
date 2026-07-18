"use client";

import { Download, Star } from "lucide-react";
import { Badge, Card } from "../../../ui";
import type { FeedbackResponse } from "@/lib/event-feedback";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function ynCsv(v: boolean | null): string {
  return v == null ? "" : v ? "yes" : "no";
}

function ynLabel(v: boolean | null): string {
  return v == null ? "—" : v ? "Yes" : "No";
}

export default function FeedbackTable({
  responses,
  nameById,
  eventTitle,
}: {
  responses: FeedbackResponse[];
  nameById: Record<string, string>;
  eventTitle: string;
}) {
  const nameFor = (r: FeedbackResponse) =>
    (r.attendeeId && nameById[r.attendeeId]) || "Unknown";

  const exportCsv = () => {
    const header = [
      "name",
      "been_before",
      "met_someone",
      "new_ideas",
      "overall_rating",
      "highlight",
      "improve",
      "return_likelihood",
      "testimonial",
      "testimonial_consent",
      "submitted_at",
    ];
    const lines = responses.map((r) =>
      [
        nameFor(r),
        ynCsv(r.beenBefore),
        ynCsv(r.metSomeone),
        ynCsv(r.newIdeas),
        r.overallRating ?? "",
        r.highlight ?? "",
        r.improve ?? "",
        r.returnLikelihood ?? "",
        r.testimonial ?? "",
        r.testimonialConsent ? "yes" : "no",
        r.submittedAt,
      ]
        .map(csvCell)
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    a.download = `${safe}-feedback.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (responses.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] px-6 py-16 text-center">
        <p className="text-[15px] text-[#2a2521]">
          No feedback yet. Once attendees complete their forms, responses land
          here.
        </p>
      </div>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3 md:px-5">
        <div className="text-[13px] font-medium text-[#141210]">
          {responses.length}{" "}
          {responses.length === 1 ? "response" : "responses"}
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
          Export CSV
        </button>
      </div>
      <ul className="divide-y divide-[rgba(20,18,16,0.06)] border-t border-[rgba(20,18,16,0.08)]">
        {responses.map((r) => (
          <li key={r.id} className="px-4 py-4 md:px-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-[#141210]">{nameFor(r)}</span>
              {r.overallRating != null && (
                <span className="inline-flex items-center gap-1 text-[13px] text-[#b91404]">
                  <Star className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                  {r.overallRating} / 5
                </span>
              )}
              {r.returnLikelihood && (
                <Badge tone="neutral">{r.returnLikelihood}</Badge>
              )}
              {r.testimonialConsent && r.testimonial && (
                <Badge tone="live">Quote OK</Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[#6b6459]">
              <span>Been before: {ynLabel(r.beenBefore)}</span>
              <span>Met someone: {ynLabel(r.metSomeone)}</span>
              <span>New ideas: {ynLabel(r.newIdeas)}</span>
            </div>
            {r.highlight && (
              <p className="mt-2 text-[13.5px] leading-[1.55] text-[#2a2521]">
                <span className="text-[#8a8278]">Highlight: </span>
                {r.highlight}
              </p>
            )}
            {r.improve && (
              <p className="mt-1.5 text-[13.5px] leading-[1.55] text-[#2a2521]">
                <span className="text-[#8a8278]">Improve: </span>
                {r.improve}
              </p>
            )}
            {r.testimonial && (
              <p className="mt-1.5 text-[13.5px] italic leading-[1.55] text-[#2a2521]">
                &ldquo;{r.testimonial}&rdquo;
              </p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
