"use client";

import type { ReactNode } from "react";
import { Modal } from "../Modal";
import { Icon, type IconName } from "@/components/ds";

/**
 * Events are read-only in the admin. What an event is (its page, hero, links,
 * menu entry) changes through code and SQL migrations. This list exists to see
 * what each event gathered: submissions, attendees, feedback, a report
 * and ticket-buyer demographics. A tool with nothing behind it is shown blocked
 * out rather than hidden, so every event reads the same.
 */
export type EventRow = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "announced" | "past";
  starts_at: string | null;
  date_label: string | null;
  short_date: string | null;
  venue: string | null;
  chips: {
    submissions?: ReactNode;
    attendees?: ReactNode;
    feedback?: ReactNode;
    impactReport?: ReactNode;
    demographics?: ReactNode;
  };
};

const TOOLS: { key: keyof EventRow["chips"]; label: string; icon: IconName }[] = [
  { key: "submissions", label: "Submissions", icon: "inbox" },
  { key: "attendees", label: "Attendees", icon: "users" },
  { key: "feedback", label: "Feedback", icon: "message-square" },
  { key: "impactReport", label: "Report", icon: "file-text" },
  { key: "demographics", label: "Demographics", icon: "bar-chart-3" },
];

/** Month and day, from the start date when there is one, else the display label. */
function dateBlock(e: EventRow): { month: string; day: string } {
  if (e.starts_at) {
    const d = new Date(e.starts_at);
    const fmt = (o: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", ...o }).format(d);
    return { month: fmt({ month: "short" }), day: fmt({ day: "numeric" }) };
  }
  const m = (e.short_date ?? e.date_label ?? "").match(/(\d{1,2})\s+([A-Za-z]{3})/);
  return m ? { month: m[2], day: m[1] } : { month: "", day: "·" };
}

function Tool({
  label,
  icon,
  eventTitle,
  content,
}: {
  label: string;
  icon: IconName;
  eventTitle: string;
  content?: ReactNode;
}) {
  if (!content) {
    return (
      <span className="adm-tool is-off" title="Nothing to show for this event yet" aria-disabled="true">
        <Icon name={icon} size={14} />
        {label}
      </span>
    );
  }
  return (
    <Modal
      title={`${label} · ${eventTitle}`}
      size="xl"
      trigger={
        <button type="button" className="adm-tool">
          <Icon name={icon} size={14} />
          {label}
        </button>
      }
    >
      {content}
    </Modal>
  );
}

export default function EventsTable({ events }: { events: EventRow[] }) {
  if (events.length === 0) {
    return <p className="adm-card__text">No events yet.</p>;
  }
  return (
    <ul className="adm-eventlist">
      {events.map((e) => {
        const { month, day } = dateBlock(e);
        const past = e.status === "past";
        return (
          <li key={e.id} className={"adm-event" + (past ? " is-past" : "")}>
            <div className="adm-event__date" aria-hidden>
              <span className="adm-event__month">{month}</span>
              <span className="adm-event__day">{day}</span>
            </div>
            <div className="adm-event__body">
              <div className="adm-event__title">{e.title}</div>
              <div className="adm-card__text">
                {[e.date_label, e.venue].filter(Boolean).join(" · ")}
              </div>
            </div>
            <div className="adm-event__tools">
              {TOOLS.map((t) => (
                <Tool
                  key={t.key}
                  label={t.label}
                  icon={t.icon}
                  eventTitle={e.title}
                  content={e.chips[t.key]}
                />
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
