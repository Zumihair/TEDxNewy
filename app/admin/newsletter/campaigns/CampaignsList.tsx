"use client";

import Link from "next/link";
import { Copy, Trash2 } from "lucide-react";
import { PendingIconButton } from "../../PendingButtons";
import { asStage, groupByStage } from "../../stages";
import StageHeading from "../../StageHeading";
import { deleteNewsletterForm, duplicateNewsletter } from "../actions";
import RowPreviewButton from "../RowPreviewButton";
import MissedTicketHolders from "./MissedTicketHolders";
import type { NewsletterListRow, Tab } from "./shared";

/** Readable Australia/Sydney date and time. */
function fmtSydney(iso: string | null): string {
  if (!iso) return "never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "never";
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

/** One quiet row per newsletter: its title, when it last changed, and preview, duplicate and delete. */
export default function CampaignsList({ rows, tab }: { rows: NewsletterListRow[]; tab: Tab; mcOn?: boolean }) {
  const grouped = tab === "drafts";
  void asStage;

  const renderRow = (n: NewsletterListRow) => (
    <li key={n.id} className="adm-crow">
      <Link href={`/admin/newsletter/${n.id}`} className="adm-crow__main">
        <span className="adm-crow__title">{n.title || "Untitled newsletter"}</span>
        <span className="adm-crow__meta">Updated {fmtSydney(n.updated_at)}</span>
      </Link>
      <div className="adm-crow__tools">
        {n.status === "sent" && n.audience === "ticket-purchasers" && <MissedTicketHolders id={n.id} />}
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
            <PendingIconButton tone="danger" ariaLabel={`Delete ${n.title || "draft"}`} title="Delete draft">
              <Trash2 className="h-4 w-4" strokeWidth={2.25} />
            </PendingIconButton>
          </form>
        )}
      </div>
    </li>
  );

  if (grouped) {
    return (
      <div className="adm-stack adm-stack--tight">
        {groupByStage(rows, (n) => n.stage).map((g) => (
          <div key={g.stage}>
            <StageHeading stage={g.stage} kind="newsletter" count={g.rows.length} />
            <ul className="adm-alist" style={{ marginTop: 12 }}>
              {g.rows.map(renderRow)}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return <ul className="adm-alist">{rows.map(renderRow)}</ul>;
}
