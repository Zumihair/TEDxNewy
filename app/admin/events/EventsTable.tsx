"use client";

import type { ReactNode } from "react";
import {
  BarChart3,
  FileText,
  Inbox,
  MessageSquare,
  Trash2,
  Users,
} from "lucide-react";
import { Badge, Card, IconButton } from "../ui";
import { Modal } from "../Modal";
import { useOptimisticDelete } from "../useOptimisticDelete";
import { deleteEvent, updateEvent } from "./actions";
import EventForm from "./EventForm";

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  blurb: string | null;
  kind: "flagship" | "salon" | "special";
  status: "draft" | "announced" | "past";
  starts_at: string | null;
  date_label: string | null;
  short_date: string | null;
  venue: string | null;
  hero_image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  ticket_url: string | null;
  show_in_nav: boolean;
  display_order: number;
  /**
   * Pre-rendered modal content, built server-side in page.tsx — each chip
   * only appears when it's actually backed by something (an import source,
   * real feedback data, an opt-in impact-report event, a matching live
   * Humanitix event), never the same fixed set for every row.
   */
  chips: {
    submissions?: ReactNode;
    attendees?: ReactNode;
    feedback?: ReactNode;
    impactReport?: ReactNode;
    demographics?: ReactNode;
  };
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

/** One chip: an icon-button trigger that opens a modal with pre-fetched content. */
function Chip({
  label,
  icon,
  eventTitle,
  children,
}: {
  label: string;
  icon: ReactNode;
  eventTitle: string;
  children: ReactNode;
}) {
  return (
    <Modal
      title={`${label} · ${eventTitle}`}
      size="xl"
      trigger={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]">
          {icon}
          {label}
        </span>
      }
    >
      {children}
    </Modal>
  );
}

export default function EventsTable({ events }: { events: EventRow[] }) {
  const { items: optimistic, onDelete, dialogs } = useOptimisticDelete({
    items: events,
    getKey: (e) => e.id,
    fieldName: "id",
    confirmTitle: () => "Delete this event?",
    confirmBody: (e) =>
      `Delete "${e.title}"? Talks and speakers linked to it are kept, just unlinked. This can't be undone.`,
    deleteAction: deleteEvent,
  });

  if (optimistic.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] px-6 py-16 text-center">
        <p className="text-[15px] text-[#2a2521]">No events yet.</p>
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
              <Modal
                title={`Edit ${e.title}`}
                size="xl"
                trigger={
                  <div className="min-w-0 cursor-pointer">
                    <span className="font-sans text-[15px] font-medium tracking-[-0.005em] text-[#141210] hover:text-[#1f4a5c]">
                      {e.title}
                    </span>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6b6459]">
                      <Badge tone="neutral">{KIND_LABEL[e.kind]}</Badge>
                      {statusBadge(e.status)}
                      {e.date_label && <span>{e.date_label}</span>}
                      <span className="font-mono text-[10.5px] text-[#8a8278]">
                        order {e.display_order}
                      </span>
                    </div>
                  </div>
                }
              >
                <EventForm initial={e} action={updateEvent} />
              </Modal>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {e.chips.submissions && (
                  <Chip
                    label="Submissions"
                    eventTitle={e.title}
                    icon={<Inbox className="h-3.5 w-3.5" strokeWidth={2.25} />}
                  >
                    {e.chips.submissions}
                  </Chip>
                )}
                {e.chips.attendees && (
                  <Chip
                    label="Attendees"
                    eventTitle={e.title}
                    icon={<Users className="h-3.5 w-3.5" strokeWidth={2.25} />}
                  >
                    {e.chips.attendees}
                  </Chip>
                )}
                {e.chips.feedback && (
                  <Chip
                    label="Feedback"
                    eventTitle={e.title}
                    icon={<MessageSquare className="h-3.5 w-3.5" strokeWidth={2.25} />}
                  >
                    {e.chips.feedback}
                  </Chip>
                )}
                {e.chips.impactReport && (
                  <Chip
                    label="Impact report"
                    eventTitle={e.title}
                    icon={<FileText className="h-3.5 w-3.5" strokeWidth={2.25} />}
                  >
                    {e.chips.impactReport}
                  </Chip>
                )}
                {e.chips.demographics && (
                  <Chip
                    label="Demographics"
                    eventTitle={e.title}
                    icon={<BarChart3 className="h-3.5 w-3.5" strokeWidth={2.25} />}
                  >
                    {e.chips.demographics}
                  </Chip>
                )}
                <IconButton
                  tone="danger"
                  ariaLabel={`Delete ${e.title}`}
                  title="Delete"
                  onClick={() => onDelete(e)}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
