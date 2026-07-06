import Link from "next/link";
import { Copy, Pencil, Eye, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Badge, Card, Flash, PageHeader, SecondaryButton } from "../ui";
import {
  PendingButton,
  PendingDangerButton,
  PendingSecondaryButton,
} from "../PendingButtons";
import {
  createNewsletter,
  deleteNewsletterForm,
  duplicateNewsletter,
} from "./actions";
import RowPreviewButton from "./RowPreviewButton";

export const metadata = {
  title: "Newsletter · Admin · TEDxNewy",
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
  updated_at: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  sent_count: number | null;
  failed_count: number | null;
};

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

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const { tab: tabParam } = await searchParams;
  const tab: Tab =
    tabParam === "scheduled" || tabParam === "sent" ? tabParam : "drafts";

  const supabase = await getServerSupabase();

  let query = supabase
    .from("newsletters")
    .select(
      "id, title, subject, preheader, blocks, status, updated_at, scheduled_at, sent_at, sent_count, failed_count",
    );

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
        title="Newsletter"
        description="Build, schedule and send campaigns to your subscribers with a block editor."
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
              href={`/admin/newsletter?tab=${t.key}`}
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

      <Card>
        {rows.length === 0 ? (
          <p className="px-5 py-14 text-center text-[14px] text-[#6b6459]">
            {tab === "drafts"
              ? "No drafts yet. Start one with New newsletter."
              : tab === "scheduled"
                ? "Nothing scheduled right now."
                : "No newsletters have been sent yet."}
          </p>
        ) : (
          <ul className="divide-y divide-[rgba(20,18,16,0.08)]">
            {rows.map((n) => {
              const stamp =
                tab === "drafts"
                  ? `Updated ${fmtSydney(n.updated_at)}`
                  : tab === "scheduled"
                    ? `Sends ${fmtSydney(n.scheduled_at)}`
                    : `Sent ${fmtSydney(n.sent_at)}`;
              return (
                <li
                  key={n.id}
                  className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:gap-4 md:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-sans text-[15px] font-medium text-[#141210]">
                        {n.title || "Untitled newsletter"}
                      </span>
                      {statusBadge(n.status)}
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
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <RowPreviewButton
                      subject={n.subject ?? ""}
                      preheader={n.preheader ?? ""}
                      blocks={n.blocks}
                      scheduledAt={n.scheduled_at}
                    />
                    <Link href={`/admin/newsletter/${n.id}`}>
                      <SecondaryButton type="button">
                        {tab === "sent" ? (
                          <>
                            <Eye className="h-4 w-4" strokeWidth={2.25} />
                            View
                          </>
                        ) : (
                          <>
                            <Pencil className="h-4 w-4" strokeWidth={2.25} />
                            Edit
                          </>
                        )}
                      </SecondaryButton>
                    </Link>
                    <form action={duplicateNewsletter}>
                      <input type="hidden" name="id" value={n.id} />
                      <PendingSecondaryButton
                        icon={<Copy className="h-3.5 w-3.5" strokeWidth={2.25} />}
                      >
                        Duplicate
                      </PendingSecondaryButton>
                    </form>
                    {n.status === "draft" && (
                      <form action={deleteNewsletterForm}>
                        <input type="hidden" name="id" value={n.id} />
                        <input type="hidden" name="tab" value={tab} />
                        <PendingDangerButton
                          icon={<Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />}
                        >
                          Delete
                        </PendingDangerButton>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
