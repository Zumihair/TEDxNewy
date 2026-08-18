"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Trash2 } from "lucide-react";
import type { CampaignReport } from "@/lib/mailchimp";
import { Badge, Card } from "../../ui";
import { PendingIconButton } from "../../PendingButtons";
import { asStage, stageLabel, STAGE_CHIP } from "../../stages";
import { deleteNewsletterForm, duplicateNewsletter } from "../actions";
import RowPreviewButton from "../RowPreviewButton";
import type { NewsletterListRow, Tab } from "./shared";

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Readable Australia/Sydney date + time. */
function fmtSydney(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function statusBadge(status: string) {
  switch (status) {
    case "draft":
      return <Badge tone="draft">Draft</Badge>;
    case "scheduled":
      return <Badge tone="soon">Scheduled</Badge>;
    case "sending":
      return <Badge tone="neutral">Sending</Badge>;
    case "sent":
      return <Badge tone="live">Sent</Badge>;
    default:
      return <Badge tone="neutral">{status}</Badge>;
  }
}

/** Opens / clicks / unsubscribes for one sent newsletter's Mailchimp report. */
function ResultsStrip({ r }: { r: CampaignReport }) {
  const openTone =
    r.openRate >= 0.3
      ? "text-[#2d7a4f]"
      : r.openRate >= 0.18
        ? "text-[#a86518]"
        : "text-[#141210]";
  const clickTone =
    r.clickRate >= 0.03
      ? "text-[#2d7a4f]"
      : r.clickRate >= 0.01
        ? "text-[#a86518]"
        : "text-[#141210]";
  const cell = (
    label: string,
    value: string,
    sub: string,
    tone = "text-[#141210]",
  ) => (
    <div className="min-w-0">
      <div
        className="font-mono text-[9.5px] font-semibold uppercase text-[#6b6459]"
        style={{ letterSpacing: "0.18em" }}
      >
        {label}
      </div>
      <div className={`mt-0.5 font-sans text-[16px] font-medium leading-none tabular-nums ${tone}`}>
        {value}
      </div>
      <div className="mt-0.5 text-[11.5px] text-[#6b6459]">{sub}</div>
    </div>
  );
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 rounded-[var(--radius-sm)] bg-[#f9f5ec] px-4 py-3 sm:grid-cols-4">
      {cell("Opens", pct(r.openRate), `${r.uniqueOpens.toLocaleString()} people`, openTone)}
      {cell("Clicks", pct(r.clickRate), `${r.uniqueClicks.toLocaleString()} people`, clickTone)}
      {cell(
        "Delivered",
        r.emailsSent > 0 ? pct(r.delivered / r.emailsSent) : "—",
        `${r.delivered.toLocaleString()} of ${r.emailsSent.toLocaleString()}`,
      )}
      {cell(
        "Unsubscribed",
        String(r.unsubscribed),
        r.abuseReports ? `${r.abuseReports} spam report${r.abuseReports === 1 ? "" : "s"}` : "no spam reports",
        r.unsubscribed > 5 ? "text-[#b91404]" : "text-[#141210]",
      )}
    </div>
  );
}

/** Placeholder shown in the ResultsStrip's spot while its report is still loading. */
function ResultsStripSkeleton() {
  return (
    <div className="mt-3 flex animate-pulse items-center gap-2 rounded-[var(--radius-sm)] bg-[#f9f5ec] px-4 py-3">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-[rgba(20,18,16,0.15)] border-t-[#6b6459]" />
      <span className="text-[11.5px] text-[#6b6459]">Loading opens and clicks…</span>
    </div>
  );
}

/**
 * The row list for /admin/newsletter/campaigns. A client component so the
 * Sent tab's Mailchimp report fetch (`listRecentCampaigns`, a live API call)
 * happens after the list is already on screen, rather than blocking the
 * whole page behind it — that blocking wait used to look like the page had
 * hung when switching to Sent, with nothing on screen to say otherwise.
 */
export default function CampaignsList({
  rows,
  tab,
  mcOn,
}: {
  rows: NewsletterListRow[];
  tab: Tab;
  mcOn: boolean;
}) {
  const wantsReports = tab === "sent" && mcOn && rows.length > 0;
  const [reportFor, setReportFor] = useState<Map<string, CampaignReport>>(new Map());
  const [loadingReports, setLoadingReports] = useState(wantsReports);

  useEffect(() => {
    if (!wantsReports) {
      setLoadingReports(false);
      return;
    }
    let cancelled = false;
    setLoadingReports(true);
    fetch("/api/admin/newsletter/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: rows.map((r) => ({
          id: r.id,
          sendBatchId: r.send_batch_id,
          subject: r.subject,
        })),
      }),
    })
      .then((res) => (res.ok ? res.json() : {}))
      .then((json: Record<string, CampaignReport>) => {
        if (cancelled) return;
        setReportFor(new Map(Object.entries(json)));
      })
      .catch(() => {
        // Reports just don't show; the rest of the list is unaffected.
      })
      .finally(() => {
        if (!cancelled) setLoadingReports(false);
      });
    return () => {
      cancelled = true;
    };
    // rows only changes when the tab/query changes, which is what should
    // re-trigger the fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, mcOn]);

  return (
    <ul className="space-y-3">
      {rows.map((n) => {
        const stamp =
          tab === "drafts"
            ? `Updated ${fmtSydney(n.updated_at)}`
            : tab === "scheduled"
              ? `Sends ${fmtSydney(n.scheduled_at)}`
              : `Sent ${fmtSydney(n.sent_at)}`;
        const stage = asStage(n.stage);
        const report = reportFor.get(n.id);
        return (
          <li key={n.id}>
            {/* The row itself opens the campaign, like the socials list.
                The action icons sit outside the Link: nesting buttons
                inside an anchor is invalid and swallows their clicks. */}
            <Card className="flex items-center gap-3 p-4 pr-3 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <Link href={`/admin/newsletter/${n.id}`} className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-sans text-[15px] font-medium text-[#141210]">
                    {n.title || "Untitled newsletter"}
                  </span>
                  {statusBadge(n.status)}
                  {n.status === "draft" && (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase ${STAGE_CHIP[stage]}`}
                      style={{ letterSpacing: "0.18em" }}
                    >
                      {stageLabel(stage, "newsletter")}
                    </span>
                  )}
                </div>
                <div className="mt-1 truncate text-[13px] text-[#6b6459]">
                  {n.subject || "No subject yet"}
                </div>
                <div className="mt-1 text-[12px] text-[#6b6459]">
                  {stamp}
                  {tab === "sent" && (
                    <>
                      {" · "}
                      {n.sent_count ?? 0} sent
                      {n.failed_count ? `, ${n.failed_count} failed` : ""}
                    </>
                  )}
                </div>
                {tab === "sent" && mcOn && (
                  loadingReports ? (
                    <ResultsStripSkeleton />
                  ) : report ? (
                    <ResultsStrip r={report} />
                  ) : (
                    <div className="mt-2 text-[11.5px] text-[#8a8278]">
                      Opens and clicks not available for this send yet.
                    </div>
                  )
                )}
              </Link>
              <div className="flex shrink-0 items-center">
                <RowPreviewButton
                  subject={n.subject ?? ""}
                  preheader={n.preheader ?? ""}
                  blocks={n.blocks}
                  scheduledAt={n.scheduled_at}
                />
                <form action={duplicateNewsletter}>
                  <input type="hidden" name="id" value={n.id} />
                  <PendingIconButton ariaLabel="Duplicate" title="Duplicate">
                    <Copy className="h-4 w-4" strokeWidth={2.25} />
                  </PendingIconButton>
                </form>
                {n.status === "draft" && (
                  <form action={deleteNewsletterForm}>
                    <input type="hidden" name="id" value={n.id} />
                    <input type="hidden" name="tab" value={tab} />
                    <PendingIconButton
                      tone="danger"
                      ariaLabel={`Delete ${n.title || "draft"}`}
                      title="Delete draft"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                    </PendingIconButton>
                  </form>
                )}
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
