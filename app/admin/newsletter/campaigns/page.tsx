import Link from "next/link";
import { ArrowUpRight, Copy, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import {
  listRecentCampaigns,
  mailchimpConfigured,
  type CampaignReport,
} from "@/lib/mailchimp";
import { Badge, Card, Flash, PageHeader } from "../../ui";
import { PendingButton, PendingIconButton } from "../../PendingButtons";
import { asStage, stageLabel, STAGE_CHIP } from "../../stages";
import {
  createNewsletter,
  deleteNewsletterForm,
  duplicateNewsletter,
} from "../actions";
import RowPreviewButton from "../RowPreviewButton";

export const metadata = {
  title: "Campaigns · Newsletter · Admin · TEDxNewy",
};

type Tab = "drafts" | "scheduled" | "sent";

const TABS: { key: Tab; label: string }[] = [
  { key: "drafts", label: "Drafts" },
  { key: "scheduled", label: "Scheduled" },
  { key: "sent", label: "Sent" },
];

type NewsletterListRow = {
  id: string;
  title: string | null;
  subject: string | null;
  preheader: string | null;
  blocks: unknown;
  status: string;
  stage: string | null;
  updated_at: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  sent_count: number | null;
  failed_count: number | null;
  send_batch_id: string | null;
};

const pct = (n: number) => `${Math.round(n * 100)}%`;

/**
 * Opens / clicks / unsubscribes for one sent newsletter, from its Mailchimp
 * report. Rendered under the row on the Sent tab.
 */
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

/** Readable Australia/Sydney date + time. Server runs in UTC. */
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

export default async function AdminNewsletterCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const { tab: tabParam } = await searchParams;
  const tab: Tab =
    tabParam === "scheduled" || tabParam === "sent" ? tabParam : "drafts";

  const supabase = await getServerSupabase();

  // select("*") on purpose: `stage` only exists once migration
  // 20260814_draft_stages.sql has been applied, and naming a column that
  // isn't there yet would fail the whole query and empty the list.
  let query = supabase.from("newsletters").select("*");

  if (tab === "drafts") {
    query = query.eq("status", "draft").order("updated_at", { ascending: false });
  } else if (tab === "scheduled") {
    query = query
      .in("status", ["scheduled", "sending"])
      .order("scheduled_at", { ascending: true });
  } else {
    query = query.eq("status", "sent").order("sent_at", { ascending: false });
  }

  const { data } = await query;
  const rows = (data ?? []) as NewsletterListRow[];

  // Sent tab: pull opens/clicks from Mailchimp and match each newsletter to
  // its campaign. The send recorded one email_sends row per campaign whose
  // batch_id is the newsletter's send_batch_id and whose resend_id holds the
  // Mailchimp campaign id (see lib/newsletter-send.ts). Subject is the
  // fallback for anything sent before that link existed.
  const mcOn = mailchimpConfigured();
  const reportFor = new Map<string, CampaignReport>();
  if (tab === "sent" && mcOn && rows.length > 0) {
    const batchIds = rows
      .map((r) => r.send_batch_id)
      .filter((b): b is string => Boolean(b));
    const [reports, { data: sends }] = await Promise.all([
      listRecentCampaigns(50),
      batchIds.length > 0
        ? supabase
            .from("email_sends")
            .select("batch_id, resend_id")
            .in("batch_id", batchIds)
        : Promise.resolve({ data: [] as { batch_id: string; resend_id: string | null }[] }),
    ]);
    const campaignByBatch = new Map<string, string>();
    for (const s of (sends ?? []) as { batch_id: string; resend_id: string | null }[]) {
      if (s.resend_id) campaignByBatch.set(s.batch_id, s.resend_id);
    }
    const byId = new Map(reports.map((r) => [r.id, r]));
    const bySubject = new Map(reports.map((r) => [r.subject.trim(), r]));
    for (const n of rows) {
      const cid = n.send_batch_id ? campaignByBatch.get(n.send_batch_id) : undefined;
      const hit =
        (cid && byId.get(cid)) ||
        (n.subject ? bySubject.get(n.subject.trim()) : undefined);
      if (hit) reportFor.set(n.id, hit);
    }
  }

  // A send that has been stuck in "sending" for more than 15 minutes did not
  // finish cleanly. The automatic retry picks these up; this is just a heads-up.
  const { data: sendingData } = await supabase
    .from("newsletters")
    .select("updated_at")
    .eq("status", "sending");
  const stuckSend = ((sendingData ?? []) as { updated_at: string | null }[]).some(
    (r) =>
      r.updated_at &&
      Date.now() - new Date(r.updated_at).getTime() > 15 * 60 * 1000,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Community · Newsletter"
        title="Campaigns"
        backHref="/admin/newsletter"
        description="Every newsletter, from drafts through scheduled sends to the archive."
        actions={
          <form action={createNewsletter}>
            <PendingButton icon={<Plus className="h-4 w-4" strokeWidth={2.25} />}>
              New newsletter
            </PendingButton>
          </form>
        }
      />

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-[rgba(20,18,16,0.10)]">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Link
              key={t.key}
              href={`/admin/newsletter/campaigns?tab=${t.key}`}
              className={
                "-mb-px border-b-2 px-4 py-2.5 text-[13.5px] font-medium transition-colors " +
                (active
                  ? "border-[#e02214] text-[#141210]"
                  : "border-transparent text-[#6b6459] hover:text-[#141210]")
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {stuckSend && (
        <Flash tone="info">
          A send did not finish. It will retry automatically within a few
          minutes.
        </Flash>
      )}

      {tab === "sent" && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-[#6b6459]">
          <span>
            {mcOn
              ? "Opens and clicks come from Mailchimp and update as people open the email."
              : "Mailchimp isn't connected on this environment, so opens and clicks aren't available here."}
          </span>
          <Link
            href="/admin/emails/history"
            className="inline-flex items-center gap-1 font-medium text-[#b91404] hover:underline"
          >
            Full report, bounces and subscriber activity
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} />
          </Link>
        </div>
      )}

      {rows.length === 0 ? (
        <Card>
          <p className="px-5 py-14 text-center text-[14px] text-[#6b6459]">
            {tab === "drafts"
              ? "No drafts yet. Start one with New newsletter."
              : tab === "scheduled"
                ? "Nothing scheduled right now."
                : "No newsletters have been sent yet."}
          </p>
        </Card>
      ) : (
        // Spaced cards, matching the socials list rather than a divided table.
        <ul className="space-y-3">
          {rows.map((n) => {
              const stamp =
                tab === "drafts"
                  ? `Updated ${fmtSydney(n.updated_at)}`
                  : tab === "scheduled"
                    ? `Sends ${fmtSydney(n.scheduled_at)}`
                    : `Sent ${fmtSydney(n.sent_at)}`;
              const stage = asStage(n.stage);
              return (
                <li key={n.id}>
                  {/* The row itself opens the campaign, like the socials list.
                      The action icons sit outside the Link: nesting buttons
                      inside an anchor is invalid and swallows their clicks. */}
                  <Card className="flex items-center gap-3 p-4 pr-3 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <Link
                    href={`/admin/newsletter/${n.id}`}
                    className="min-w-0 flex-1"
                  >
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
                          {n.failed_count
                            ? `, ${n.failed_count} failed`
                            : ""}
                        </>
                      )}
                    </div>
                    {tab === "sent" && reportFor.get(n.id) && (
                      <ResultsStrip r={reportFor.get(n.id)!} />
                    )}
                    {tab === "sent" && mcOn && !reportFor.get(n.id) && (
                      <div className="mt-2 text-[11.5px] text-[#8a8278]">
                        Opens and clicks not available for this send yet.
                      </div>
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
      )}
    </div>
  );
}
