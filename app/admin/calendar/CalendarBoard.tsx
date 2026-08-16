"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Share2,
} from "lucide-react";
import { STATUS_CHIP } from "../socials/shared";
import { STAGE_CHIP, stageLabel } from "../stages";
import SocialRowPreviewButton from "../socials/RowPreviewButton";
import NewsletterRowPreviewButton from "../newsletter/RowPreviewButton";
import { WEEKDAYS, dayNumber, monthShort } from "./dates";
import type { CalendarItem, EventItem } from "./types";

/** Newsletter statuses reuse the socials chip palette so both read alike. */
const SEND_CHIP: Record<string, string> = {
  draft: STATUS_CHIP.draft,
  scheduled: STATUS_CHIP.scheduled,
  sending: STATUS_CHIP.scheduled,
  sent: STATUS_CHIP.posted,
};

const SEND_LABEL: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  sending: "Sending",
  sent: "Sent",
};

const MAX_CHIPS = 3;

function chipClassFor(item: CalendarItem): string {
  return item.kind === "social"
    ? STATUS_CHIP[item.status]
    : (SEND_CHIP[item.status] ?? STATUS_CHIP.draft);
}

function statusLabelFor(item: CalendarItem): string {
  if (item.kind === "newsletter") return SEND_LABEL[item.status] ?? item.status;
  return item.status === "posted"
    ? "Posted"
    : item.status === "scheduled"
      ? "Scheduled"
      : "Draft";
}

function editorHref(item: CalendarItem): string {
  return item.kind === "social"
    ? `/admin/socials/${item.id}`
    : `/admin/newsletter/${item.id}`;
}

export default function CalendarBoard({
  weeks,
  itemsByDay,
  eventsByDay,
  today,
  label,
  prevHref,
  nextHref,
}: {
  weeks: string[][];
  itemsByDay: Record<string, CalendarItem[]>;
  eventsByDay: Record<string, EventItem[]>;
  today: string;
  label: string;
  prevHref: string;
  nextHref: string;
}) {
  // Which chip's detail popover is open, and which cells have been expanded
  // past the "+N more" fold. Both keyed so only one is ever open at a time.
  const [openId, setOpenId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const total = Object.values(itemsByDay).reduce((n, l) => n + l.length, 0);

  return (
    <div className="space-y-3">
      {/* Range + week navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-sans text-[15px] font-medium text-[#141210]">
            {label}
          </span>
          <span className="text-[12.5px] text-[#6b6459]">
            {total === 0
              ? "nothing scheduled"
              : `${total} scheduled item${total === 1 ? "" : "s"}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <NavLink href={prevHref} label="Previous week">
            <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
          </NavLink>
          <Link
            href="/admin/calendar"
            className="rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
          >
            Today
          </Link>
          <NavLink href={nextHref} label="Next week">
            <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
          </NavLink>
        </div>
      </div>

      {/* Grid: md and up. Seven columns is unreadable on a phone, so below md
          this is hidden and the agenda list below takes over. */}
      <div className="hidden overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.08)] bg-white shadow-[var(--shadow-sm)] md:block">
        <div className="grid grid-cols-7 border-b border-[rgba(20,18,16,0.08)] bg-[#f9f5ec]">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-2 py-1.5 font-mono text-[9.5px] font-semibold uppercase text-[#6b6459]"
              style={{ letterSpacing: "0.22em" }}
            >
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div
            key={week[0]}
            className={
              "grid grid-cols-7 " +
              (wi < weeks.length - 1
                ? "border-b border-[rgba(20,18,16,0.08)]"
                : "")
            }
          >
            {week.map((day, di) => {
              const items = itemsByDay[day] ?? [];
              const events = eventsByDay[day] ?? [];
              const isToday = day === today;
              const show = expanded[day] ? items : items.slice(0, MAX_CHIPS);
              const hidden = items.length - show.length;
              return (
                <div
                  key={day}
                  className={
                    "min-h-[118px] p-1.5 " +
                    (di < 6 ? "border-r border-[rgba(20,18,16,0.06)] " : "") +
                    (di > 4 ? "bg-[rgba(20,18,16,0.015)]" : "")
                  }
                >
                  <div className="mb-1 flex items-baseline gap-1 px-0.5">
                    <span
                      className={
                        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11.5px] font-medium " +
                        (isToday
                          ? "bg-[#e02214] text-white"
                          : "text-[#6b6459]")
                      }
                    >
                      {dayNumber(day)}
                    </span>
                    {dayNumber(day) === 1 && (
                      <span
                        className="font-mono text-[9px] font-semibold uppercase text-[#9a9186]"
                        style={{ letterSpacing: "0.18em" }}
                      >
                        {monthShort(day)}
                      </span>
                    )}
                  </div>

                  {events.map((e) => (
                    <EventBand key={e.id} event={e} />
                  ))}

                  <div className="space-y-1">
                    {show.map((item) => (
                      <Chip
                        key={item.id}
                        item={item}
                        open={openId === item.id}
                        onToggle={() =>
                          setOpenId((c) => (c === item.id ? null : item.id))
                        }
                      />
                    ))}
                    {hidden > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((s) => ({ ...s, [day]: true }))
                        }
                        className="w-full rounded px-1 py-0.5 text-left text-[10.5px] font-medium text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.05)] hover:text-[#141210]"
                      >
                        +{hidden} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Agenda: below md. Only days that have something, so a phone gets a
          readable list instead of seven squeezed columns. */}
      <div className="space-y-4 md:hidden">
        {weeks.map((week) => {
          const busy = week.filter(
            (d) => (itemsByDay[d] ?? []).length || (eventsByDay[d] ?? []).length,
          );
          if (busy.length === 0) return null;
          return (
            <div key={week[0]} className="space-y-2">
              {busy.map((day) => (
                <div
                  key={day}
                  className="rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.08)] bg-white p-3 shadow-[var(--shadow-sm)]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={
                        "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[12px] font-medium " +
                        (day === today
                          ? "bg-[#e02214] text-white"
                          : "bg-[rgba(20,18,16,0.06)] text-[#141210]")
                      }
                    >
                      {dayNumber(day)}
                    </span>
                    <span
                      className="font-mono text-[9.5px] font-semibold uppercase text-[#6b6459]"
                      style={{ letterSpacing: "0.22em" }}
                    >
                      {WEEKDAYS[week.indexOf(day)]} {monthShort(day)}
                    </span>
                  </div>
                  {(eventsByDay[day] ?? []).map((e) => (
                    <EventBand key={e.id} event={e} />
                  ))}
                  <div className="space-y-1">
                    {(itemsByDay[day] ?? []).map((item) => (
                      <Chip
                        key={item.id}
                        item={item}
                        open={openId === item.id}
                        onToggle={() =>
                          setOpenId((c) => (c === item.id ? null : item.id))
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        {total === 0 && (
          <p className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.14)] px-4 py-8 text-center text-[13px] text-[#6b6459]">
            Nothing scheduled in these four weeks.
          </p>
        )}
      </div>
    </div>
  );
}

function NavLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.08)] hover:text-[#141210]"
    >
      {children}
    </Link>
  );
}

function EventBand({ event }: { event: EventItem }) {
  return (
    <div
      className="mb-1 flex items-center gap-1 truncate rounded bg-[rgba(31,74,92,0.10)] px-1.5 py-0.5 text-[10.5px] font-medium text-[#1f4a5c]"
      title={`${event.title} (${event.eventKind})`}
    >
      <CalendarDays className="h-3 w-3 shrink-0" strokeWidth={2.25} />
      <span className="truncate">{event.title}</span>
    </div>
  );
}

/**
 * One item in a day cell. The chip opens a small detail popover rather than
 * linking straight out: a compressed cell has no room for a hover-revealed
 * icon button, and a popover works on touch.
 */
function Chip({
  item,
  open,
  onToggle,
}: {
  item: CalendarItem;
  open: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const Icon = item.kind === "social" ? Share2 : Newspaper;

  // Close on an outside click or Escape, same as the other admin pop-ups.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onToggle();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onToggle();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onToggle]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onToggle}
        title={item.title}
        className={
          "flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[10.5px] font-medium transition-opacity hover:opacity-80 " +
          chipClassFor(item)
        }
      >
        <Icon className="h-3 w-3 shrink-0" strokeWidth={2.25} />
        {item.time && <span className="shrink-0 tabular-nums">{item.time}</span>}
        <span className="truncate">{item.title}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-[260px] rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-3 shadow-[var(--shadow-md)]">
          <div className="text-[13.5px] font-medium leading-snug text-[#141210]">
            {item.title}
          </div>
          <div className="mt-0.5 text-[11.5px] text-[#6b6459]">
            {item.kind === "social" ? "Social post" : "Newsletter"}
            {item.time ? ` · ${item.time}` : ""}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span
              className={
                "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase " +
                chipClassFor(item)
              }
              style={{ letterSpacing: "0.18em" }}
            >
              {statusLabelFor(item)}
            </span>
            <span
              className={
                "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase " +
                STAGE_CHIP[item.stage]
              }
              style={{ letterSpacing: "0.18em" }}
            >
              {stageLabel(
                item.stage,
                item.kind === "social" ? "social" : "newsletter",
              )}
            </span>
          </div>

          {item.kind === "social" && item.channels.length > 0 && (
            <div className="mt-2 text-[11.5px] capitalize text-[#6b6459]">
              {item.channels.join(", ")}
            </div>
          )}

          <div className="mt-3 flex items-center gap-1.5 border-t border-[rgba(20,18,16,0.08)] pt-2.5">
            {item.kind === "social" ? (
              <SocialRowPreviewButton
                channels={item.channels}
                caption={item.caption}
                channelCaptions={item.channelCaptions}
                media={item.media}
              />
            ) : (
              <NewsletterRowPreviewButton
                subject={item.subject}
                preheader={item.preheader}
                blocks={item.blocks}
                scheduledAt={item.scheduledAt}
              />
            )}
            <Link
              href={editorHref(item)}
              className="ml-auto rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
            >
              Open
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
