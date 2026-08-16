"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Share2,
  X,
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

/** Roughly what a popover occupies, used to decide whether to flip it above. */
const POPOVER_W = 264;
const POPOVER_H = 230;

type Active = { item: CalendarItem; rect: DOMRect };

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
  // The open chip's detail popover, and which cells have been expanded past
  // the "+N more" fold. One popover at a time, anchored to the chip's rect.
  const [active, setActive] = useState<Active | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const total = Object.values(itemsByDay).reduce((n, l) => n + l.length, 0);

  const openChip = (item: CalendarItem, el: HTMLElement) =>
    setActive((cur) =>
      cur?.item.id === item.id
        ? null
        : { item, rect: el.getBoundingClientRect() },
    );

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
                        open={active?.item.id === item.id}
                        onOpen={openChip}
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
                        open={active?.item.id === item.id}
                        onOpen={openChip}
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

      {/* One popover for the whole board, portalled to the body. It has to
          live outside the grid: the grid wrapper is overflow-hidden for its
          rounded corners, which would clip a popover in the Sunday column or
          the bottom week. */}
      {active && (
        <ItemPopover
          item={active.item}
          rect={active.rect}
          onClose={() => setActive(null)}
        />
      )}
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
 * One item in a day cell. Clicking it opens the board's single popover rather
 * than linking straight out: a compressed cell has no room for a
 * hover-revealed icon button, and a popover works on touch.
 */
function Chip({
  item,
  open,
  onOpen,
}: {
  item: CalendarItem;
  open: boolean;
  onOpen: (item: CalendarItem, el: HTMLElement) => void;
}) {
  const Icon = item.kind === "social" ? Share2 : Newspaper;
  return (
    <button
      type="button"
      onClick={(e) => onOpen(item, e.currentTarget)}
      title={item.title}
      aria-expanded={open}
      className={
        "flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[10.5px] font-medium transition-opacity hover:opacity-80 " +
        (open ? "ring-1 ring-[rgba(20,18,16,0.35)] " : "") +
        chipClassFor(item)
      }
    >
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.25} />
      {item.time && <span className="shrink-0 tabular-nums">{item.time}</span>}
      <span className="truncate">{item.title}</span>
    </button>
  );
}

/**
 * The detail popover, portalled to the body and positioned against the chip's
 * rect. Two things here are load-bearing:
 *
 *  - It is NOT rendered inside the chip. Both preview modals `createPortal`
 *    into document.body, so a modal opened from inside this popover would sit
 *    outside the popover's DOM subtree; the outside-click handler below would
 *    then read every click in the modal as "outside", close the popover, and
 *    unmount the modal with it. Keeping the popover at board level means
 *    closing it is the board's decision, not a side effect of clicking a
 *    modal.
 *  - Every dismiss path stands down while a `[role="dialog"]` is on screen,
 *    which both preview modals set. A React `stopPropagation` in those
 *    components cannot help here: these are native listeners on document and
 *    window, and they fire regardless.
 *
 * Fixed rather than absolute, so scrolling closes it instead of leaving it
 * stranded away from its chip.
 */
function ItemPopover({
  item,
  rect,
  onClose,
}: {
  item: CalendarItem;
  rect: DOMRect;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // While a preview modal is up it owns every interaction, and this popover
    // must not react to any of them: it is the modal's parent, so closing
    // here unmounts the modal mid-use. Covers the backdrop click, Escape, and
    // scrolling inside the newsletter preview's own scroll container.
    const dialogOpen = () => !!document.querySelector('[role="dialog"]');

    const onDown = (e: MouseEvent) => {
      if (dialogOpen()) return;
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !dialogOpen()) onClose();
    };
    const onReflow = () => {
      if (!dialogOpen()) onClose();
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [onClose]);

  if (!mounted) return null;

  // Sit under the chip, flipping above when there isn't room, and clamped so
  // the right-hand columns can't push it off screen.
  const above = rect.bottom + POPOVER_H > window.innerHeight;
  const left = Math.max(
    8,
    Math.min(rect.left, window.innerWidth - POPOVER_W - 8),
  );

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[60] w-[260px] rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-3 shadow-[var(--shadow-lg)]"
      style={
        above
          ? { left, bottom: window.innerHeight - rect.top + 6 }
          : { left, top: rect.bottom + 6 }
      }
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-medium leading-snug text-[#141210]">
            {item.title}
          </div>
          <div className="mt-0.5 text-[11.5px] text-[#6b6459]">
            {item.kind === "social" ? "Social post" : "Newsletter"}
            {item.time ? ` · ${item.time}` : ""}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 -mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.06)] hover:text-[#141210]"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
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
          {stageLabel(item.stage, item.kind === "social" ? "social" : "newsletter")}
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
    </div>,
    document.body,
  );
}
