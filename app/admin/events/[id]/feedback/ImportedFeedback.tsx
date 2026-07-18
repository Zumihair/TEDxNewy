"use client";

import { Download, Archive } from "lucide-react";
import { Badge, Card } from "../../../ui";
import FeedbackOverview, { MetricCard, BigStat } from "./FeedbackOverview";
import {
  summarizeFeedback,
  type TextSummary,
} from "@/lib/feedback-summary";
import type {
  ImportedAnswer,
  ImportedFeedbackDataset,
} from "@/lib/imported-feedback";

function answerToCsv(v: ImportedAnswer): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.join("; ");
  if (typeof v === "boolean") return v ? "yes" : "no";
  return String(v);
}

function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export default function ImportedFeedback({
  dataset,
}: {
  dataset: ImportedFeedbackDataset;
}) {
  const summaries = summarizeFeedback(dataset.questions, dataset.responses);
  const textBlocks = summaries.filter(
    (s): s is TextSummary => s.kind === "text" && s.entries.length > 0,
  );
  const n = dataset.responses.length;
  const ted = dataset.tedScore;

  const exportCsv = () => {
    const header = ["submitted", "name", ...dataset.questions.map((q) => q.label)];
    const lines = dataset.responses.map((r) =>
      [
        r.submittedAt ?? "",
        r.name ?? "",
        ...dataset.questions.map((q) => answerToCsv(r.answers[q.key])),
      ]
        .map(csvCell)
        .join(","),
    );
    const csv = [header.map(csvCell).join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dataset.eventSlug}-imported-feedback.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // TED score card sits first in the glance grid: filled when we have it, a
  // muted "awaiting" placeholder until TED provides it.
  const tedCard = (
    <MetricCard label="TED feedback score" hint={ted ? undefined : "to come"}>
      {ted ? (
        <BigStat
          value={String(ted.value)}
          unit={ted.outOf ? `/ ${ted.outOf}` : undefined}
          caption={ted.label}
        />
      ) : (
        <div className="text-[13px] text-[#b8b1a5]">Awaiting TED score</div>
      )}
    </MetricCard>
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(20,18,16,0.06)] text-[#6b6459]">
            <Archive className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-sans text-[16px] font-medium tracking-[-0.01em] text-[#141210]">
                Archived feedback
              </h2>
              <Badge tone="neutral">Imported</Badge>
            </div>
            <p className="mt-0.5 text-[12.5px] text-[#6b6459]">
              {n} response{n === 1 ? "" : "s"} · collected {dataset.collected} ·{" "}
              {dataset.source}
            </p>
          </div>
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

      {dataset.note && (
        <p className="max-w-[70ch] text-[13px] leading-[1.6] text-[#6b6459]">
          {dataset.note}
        </p>
      )}

      <FeedbackOverview summaries={summaries} leading={tedCard} />

      {textBlocks.length > 0 && (
        <div className="space-y-4">
          {textBlocks.map((t) => (
            <Card key={t.key}>
              <div className="px-4 py-3.5 md:px-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
                    {t.label}
                  </h3>
                  <span className="font-mono text-[10px] text-[#b8b1a5]">
                    {t.entries.length}
                  </span>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {t.entries.map((e, i) => (
                    <li
                      key={i}
                      className="border-l-2 border-[rgba(20,18,16,0.10)] pl-3 text-[13.5px] leading-[1.55] text-[#2a2521]"
                    >
                      {e.text}
                      {e.name && (
                        <span className="mt-0.5 block text-[11.5px] text-[#8a8278]">
                          — {e.name}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
