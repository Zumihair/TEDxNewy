"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";

/**
 * On-brand date / date-and-time picker, replacing the native
 * `datetime-local` and `date` inputs across the admin.
 *
 * The native controls were inconsistent between browsers, unstyleable, and
 * looked nothing like the rest of the admin. This is one component so the
 * socials editor, the newsletter editor and calendar notes all pick a time
 * the same way.
 *
 * **Value shape matches the inputs it replaces**, so call sites did not have
 * to change how they store anything: `YYYY-MM-DDTHH:mm` in `datetime` mode
 * and `YYYY-MM-DD` in `date` mode, always LOCAL wall-clock, never UTC. An
 * empty string means "not set".
 *
 * **All date maths goes through `Date.UTC`**, never the local-time
 * constructor, even though the values are local wall-clock. Building
 * `new Date(y, m, d)` in a timezone with DST can land on the previous day
 * when the clock jumps, which is the same trap `app/admin/calendar/dates.ts`
 * documents for day keys. Here the parts are only ever used to count days
 * and weekdays, so UTC arithmetic is both correct and immune to it.
 */

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Parts = { y: number; m: number; d: number; hh: number; mm: number };

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** `YYYY-MM-DD[THH:mm]` to parts. Returns null for empty or malformed. */
function parse(value: string): Parts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value ?? "");
  if (!m) return null;
  return {
    y: Number(m[1]),
    m: Number(m[2]),
    d: Number(m[3]),
    hh: m[4] ? Number(m[4]) : 9,
    mm: m[5] ? Number(m[5]) : 0,
  };
}

function format(p: Parts, withTime: boolean): string {
  const date = `${p.y}-${pad(p.m)}-${pad(p.d)}`;
  return withTime ? `${date}T${pad(p.hh)}:${pad(p.mm)}` : date;
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Weekday index of the 1st, Monday = 0 to match the grid's column order. */
function firstWeekday(y: number, m: number): number {
  return (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
}

function stepMonth(y: number, m: number, by: number): { y: number; m: number } {
  const total = y * 12 + (m - 1) + by;
  return { y: Math.floor(total / 12), m: (total % 12) + 1 };
}

function todayParts(): Parts {
  const now = new Date();
  return {
    y: now.getFullYear(),
    m: now.getMonth() + 1,
    d: now.getDate(),
    hh: now.getHours(),
    mm: Math.round(now.getMinutes() / 5) * 5 % 60,
  };
}

/** Human label for the trigger button, e.g. "Fri 7 Aug 2026, 2:30pm". */
function label(p: Parts, withTime: boolean): string {
  const wd = WEEKDAYS[(new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay() + 6) % 7];
  const mon = MONTHS[p.m - 1].slice(0, 3);
  const date = `${wd} ${p.d} ${mon} ${p.y}`;
  if (!withTime) return date;
  const h12 = p.hh % 12 === 0 ? 12 : p.hh % 12;
  return `${date}, ${h12}:${pad(p.mm)}${p.hh < 12 ? "am" : "pm"}`;
}

export default function DateTimePicker({
  value,
  onChange,
  mode = "datetime",
  id,
  name,
  placeholder = "Not set",
  required,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  mode?: "datetime" | "date";
  id?: string;
  /** Renders a hidden input so plain FormData submits still work. */
  name?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  const withTime = mode === "datetime";
  const parsed = useMemo(() => parse(value), [value]);

  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  // Which month the grid is showing, independent of the selected value so
  // browsing away and closing without picking doesn't change anything.
  const [view, setView] = useState(() => {
    const p = parsed ?? todayParts();
    return { y: p.y, m: p.m };
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && parsed) setView({ y: parsed.y, m: parsed.m });
  }, [open, parsed]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    const reposition = () => {
      if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    };
    document.addEventListener("mousedown", onDown);
    // Capture phase, so Escape closes this before any dialog wrapping it.
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  const toggle = () => {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setOpen((o) => !o);
  };

  const commit = (next: Parts) => onChange(format(next, withTime));

  const pickDay = (d: number) => {
    const base = parsed ?? { ...todayParts(), hh: 9, mm: 0 };
    commit({ ...base, y: view.y, m: view.m, d });
    // Date-only pickers have nothing else to choose, so close on pick.
    if (!withTime) setOpen(false);
  };

  const setTime = (hh: number, mm: number) => {
    const base = parsed ?? { ...todayParts(), hh, mm };
    commit({ ...base, hh, mm });
  };

  const today = todayParts();
  const todayKey = format(today, false);

  return (
    <>
      {name && <input type="hidden" name={name} value={value} required={required} />}
      {/* Clear sits BESIDE the trigger, not inside it. A button nested in a
          button is invalid HTML and browsers/screen readers handle it
          inconsistently, so the two controls are siblings and the trigger
          just reserves room for it with padding. */}
      <div className="relative w-full">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          onClick={toggle}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={
            "flex w-full items-center gap-2 rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.15)] bg-white px-4 py-3 text-left text-[14.5px] transition-colors hover:border-[rgba(20,18,16,0.28)] focus:border-[#e02214]/40 focus:outline-none focus:ring-2 focus:ring-[#e02214]/20 " +
            (parsed ? "pr-10 " : "") +
            (open ? "border-[#e02214]/40 ring-2 ring-[#e02214]/20 " : "") +
            className
          }
        >
          <CalendarDays
            className={
              "h-4 w-4 shrink-0 " + (parsed ? "text-[#e02214]" : "text-[#9a9186]")
            }
            strokeWidth={2}
          />
          <span className={"truncate " + (parsed ? "text-[#141210]" : "text-[#9a9186]")}>
            {parsed ? label(parsed, withTime) : placeholder}
          </span>
        </button>
        {parsed && (
          <button
            type="button"
            aria-label="Clear date"
            title="Clear"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#9a9186] transition-colors hover:bg-[rgba(20,18,16,0.08)] hover:text-[#141210]"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
        )}
      </div>

      {open && rect && (
        <Panel
          ref={panelRef}
          rect={rect}
          view={view}
          setView={setView}
          selected={parsed}
          todayKey={todayKey}
          withTime={withTime}
          onPickDay={pickDay}
          onSetTime={setTime}
          onClose={() => setOpen(false)}
          onNow={() => {
            const t = todayParts();
            commit(withTime ? t : { ...t, hh: 0, mm: 0 });
            setView({ y: t.y, m: t.m });
            if (!withTime) setOpen(false);
          }}
        />
      )}
    </>
  );
}

const PANEL_W = 300;
const PANEL_H = 400;

/**
 * The floating calendar. Portalled to the body and fixed-positioned: it is
 * opened from inside cards, dialogs and a `overflow-hidden` editor column,
 * any of which would clip an absolutely positioned panel.
 */
function Panel({
  ref,
  rect,
  view,
  setView,
  selected,
  todayKey,
  withTime,
  onPickDay,
  onSetTime,
  onClose,
  onNow,
}: {
  ref: React.RefObject<HTMLDivElement | null>;
  rect: DOMRect;
  view: { y: number; m: number };
  setView: (v: { y: number; m: number }) => void;
  selected: Parts | null;
  todayKey: string;
  withTime: boolean;
  onPickDay: (d: number) => void;
  onSetTime: (hh: number, mm: number) => void;
  onClose: () => void;
  onNow: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const total = daysInMonth(view.y, view.m);
  const lead = firstWeekday(view.y, view.m);
  const cells: (number | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  const above = rect.bottom + PANEL_H > window.innerHeight && rect.top > PANEL_H;
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - PANEL_W - 8));

  const hh = selected?.hh ?? 9;
  const mm = selected?.mm ?? 0;
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  const isPm = hh >= 12;

  const setH12 = (next: number) => {
    const base = next % 12;
    onSetTime(isPm ? base + 12 : base, mm);
  };
  const setMeridiem = (pm: boolean) => {
    onSetTime(pm ? (hh % 12) + 12 : hh % 12, mm);
  };

  // z-[80]: above the calendar's chip popover (45), both preview modals
  // (50 and 70) and NoteDialog (60), any of which it can open on top of.
  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label="Choose a date"
      className="fixed z-[80] w-[300px] rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.12)] bg-white p-3 shadow-[var(--shadow-lg)]"
      style={
        above
          ? { left, bottom: window.innerHeight - rect.top + 6 }
          : { left, top: rect.bottom + 6 }
      }
    >
      {/* Month navigation */}
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView(stepMonth(view.y, view.m, -1))}
          aria-label="Previous month"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.08)] hover:text-[#141210]"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
        </button>
        <div className="text-[13.5px] font-medium text-[#141210]">
          {MONTHS[view.m - 1]} {view.y}
        </div>
        <button
          type="button"
          onClick={() => setView(stepMonth(view.y, view.m, 1))}
          aria-label="Next month"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.08)] hover:text-[#141210]"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="pb-1 text-center font-mono text-[9px] font-semibold uppercase text-[#9a9186]"
            style={{ letterSpacing: "0.14em" }}
          >
            {d[0]}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`lead-${i}`} />;
          const key = `${view.y}-${pad(view.m)}-${pad(d)}`;
          const isSelected =
            selected &&
            selected.y === view.y &&
            selected.m === view.m &&
            selected.d === d;
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPickDay(d)}
              className={
                "flex h-8 items-center justify-center rounded-full text-[12.5px] transition-colors " +
                (isSelected
                  ? "bg-[#e02214] font-semibold text-white"
                  : isToday
                    ? "font-semibold text-[#e02214] ring-1 ring-inset ring-[#e02214]/35 hover:bg-[#e02214]/10"
                    : "text-[#141210] hover:bg-[rgba(20,18,16,0.07)]")
              }
            >
              {d}
            </button>
          );
        })}
      </div>

      {withTime && (
        <div className="mt-3 border-t border-[rgba(20,18,16,0.08)] pt-3">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-[#9a9186]" strokeWidth={2} />
            <select
              aria-label="Hour"
              value={h12}
              onChange={(e) => setH12(Number(e.currentTarget.value))}
              className="rounded-[var(--radius-sm)] border border-[rgba(20,18,16,0.15)] bg-white px-2 py-1.5 text-[13px] text-[#141210] focus:border-[#e02214]/40 focus:outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span className="text-[13px] text-[#6b6459]">:</span>
            <select
              aria-label="Minute"
              value={mm}
              onChange={(e) => onSetTime(hh, Number(e.currentTarget.value))}
              className="rounded-[var(--radius-sm)] border border-[rgba(20,18,16,0.15)] bg-white px-2 py-1.5 text-[13px] text-[#141210] focus:border-[#e02214]/40 focus:outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                <option key={m} value={m}>
                  {pad(m)}
                </option>
              ))}
            </select>
            <div className="ml-auto inline-flex overflow-hidden rounded-full border border-[rgba(20,18,16,0.15)]">
              {(["am", "pm"] as const).map((p) => {
                const on = (p === "pm") === isPm;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setMeridiem(p === "pm")}
                    className={
                      "px-2.5 py-1.5 text-[12px] font-medium uppercase transition-colors " +
                      (on
                        ? "bg-[#e02214] text-white"
                        : "bg-white text-[#6b6459] hover:bg-[rgba(20,18,16,0.06)]")
                    }
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5 border-t border-[rgba(20,18,16,0.08)] pt-2.5">
        <button
          type="button"
          onClick={onNow}
          className="rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
        >
          {withTime ? "Now" : "Today"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-full bg-[#e02214] px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#b91404]"
        >
          Done
        </button>
      </div>
    </div>,
    document.body,
  );
}
