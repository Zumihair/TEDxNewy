"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Badge, Card, DangerButton } from "../ui";
import { useConfirm } from "../ConfirmDialog";
import { deleteEvent } from "./actions";

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  kind: "flagship" | "salon" | "special";
  status: "draft" | "announced" | "past";
  date_label: string | null;
  display_order: number;
};

const KIND_LABEL: Record<EventRow["kind"], string> = {
  flagship: "Flagship",
  salon: "Salon",
  special: "Special",
};

function statusBadge(status: EventRow["status"]) {
  if (status === "draft") return <Badge tone="draft">Draft</Badge>;
  if (status === "announced") return <Badge tone="soon">Announced</Badge>;
  return <Badge tone="neutral">Past</Badge>;
}

export default function EventsTable({ events }: { events: EventRow[] }) {
  const { confirm, dialogs } = useConfirm();
  const [, startTransition] = useTransition();
  const [optimistic, removeOne] = useOptimistic(
    events,
    (state, id: string) => state.filter((e) => e.id !== id),
  );

  const onDelete = async (e: EventRow) => {
    const ok = await confirm({
      title: "Delete this event?",
      body: `Delete "${e.title}"? Talks and speakers linked to it are kept, just unlinked. This can't be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      removeOne(e.id);
      const fd = new FormData();
      fd.set("id", e.id);
      await deleteEvent(fd);
    });
  };

  if (optimistic.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] px-6 py-16 text-center">
        <p className="text-[15px] text-[#2a2521]">
          No events yet. Hit Add event to create your first.
        </p>
      </div>
    );
  }

  return (
    <>
      {dialogs}
      <Card>
        <ul className="divide-y divide-[rgba(20,18,16,0.08)]">
          {optimistic.map((e) => (
            <li
              key={e.id}
              className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3.5 md:px-5"
            >
              <div className="min-w-0">
                <Link
                  href={`/admin/events/${encodeURIComponent(e.id)}`}
                  className="font-sans text-[15px] font-medium tracking-[-0.005em] text-[#141210] hover:text-[#1f4a5c]"
                >
                  {e.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6b6459]">
                  <Badge tone="neutral">{KIND_LABEL[e.kind]}</Badge>
                  {statusBadge(e.status)}
                  {e.date_label && <span>{e.date_label}</span>}
                  <span className="font-mono text-[10.5px] text-[#8a8278]">
                    order {e.display_order}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/events/${encodeURIComponent(e.id)}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Edit
                </Link>
                <DangerButton type="button" onClick={() => onDelete(e)}>
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Delete
                </DangerButton>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
