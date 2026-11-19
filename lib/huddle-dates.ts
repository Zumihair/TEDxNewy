/**
 * Date logic for the monthly team huddle (pure, no I/O). Everything is in
 * Australia/Sydney time, with DST handled by Intl, so "7pm" stays 7pm.
 */

export const HUDDLE_TZ = "Australia/Sydney";
export const HUDDLE_HOUR = 19; // 7pm
export const POLL_OPEN_DAY = 20;
export const POLL_OPEN_HOUR = 9; // the bot opens the poll from 9am on the 20th

export type HuddleSlot = {
  /** yyyy-mm-dd, Sydney local date. */
  key: string;
  /** UTC ISO instant of 7pm Sydney on that date. */
  startsAt: string;
  /** e.g. "Mon 7 Dec". */
  label: string;
};

type Parts = { y: number; m: number; d: number; h: number; min: number; dow: number };

const fmt = new Intl.DateTimeFormat("en-AU", {
  timeZone: HUDDLE_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function sydneyParts(ms: number): Parts {
  const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return {
    y: Number(p.year),
    m: Number(p.month),
    d: Number(p.day),
    h: Number(p.hour),
    min: Number(p.minute),
    dow: DOW.indexOf(p.weekday),
  };
}

/** Minutes Sydney is ahead of UTC at this instant. */
function offsetMinutes(ms: number): number {
  const p = sydneyParts(ms);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min);
  return Math.round((asUtc - Math.floor(ms / 60000) * 60000) / 60000);
}

/** The UTC instant (ms) for a Sydney wall-clock time. */
export function sydneyToUtc(y: number, m: number, d: number, h: number, min = 0): number {
  const guess = Date.UTC(y, m - 1, d, h, min);
  let t = guess - offsetMinutes(guess) * 60000;
  t = guess - offsetMinutes(t) * 60000; // re-check across a DST edge
  return t;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function monthKey(y: number, m: number): string {
  return `${y}-${pad(m)}`;
}

/** The poll month for "now": the month after the current Sydney month. */
export function targetMonth(nowMs: number): { y: number; m: number; key: string } {
  const p = sydneyParts(nowMs);
  const m = p.m === 12 ? 1 : p.m + 1;
  const y = p.m === 12 ? p.y + 1 : p.y;
  return { y, m, key: monthKey(y, m) };
}

/** True from 9am Sydney on the 20th (the sweep then opens the poll once). */
export function isPollOpenTime(nowMs: number): boolean {
  const p = sydneyParts(nowMs);
  return p.d === POLL_OPEN_DAY && p.h >= POLL_OPEN_HOUR;
}

/**
 * Mon to Thu at 7pm of the first week of the month: the first Monday on or
 * after the 1st, plus the Tue, Wed and Thu that follow.
 */
export function slotsForMonth(y: number, m: number): HuddleSlot[] {
  const first = new Date(Date.UTC(y, m - 1, 1));
  const dow = first.getUTCDay(); // 0 Sun .. 6 Sat
  const toMonday = (8 - dow) % 7; // days from the 1st to the first Monday
  const out: HuddleSlot[] = [];
  for (let i = 0; i < 4; i++) {
    const day = new Date(Date.UTC(y, m - 1, 1 + toMonday + i));
    const yy = day.getUTCFullYear();
    const mm = day.getUTCMonth() + 1;
    const dd = day.getUTCDate();
    const startsAt = new Date(sydneyToUtc(yy, mm, dd, HUDDLE_HOUR)).toISOString();
    out.push({
      key: `${yy}-${pad(mm)}-${pad(dd)}`,
      startsAt,
      label: `${DOW[day.getUTCDay()]} ${dd} ${day.toLocaleString("en-AU", { month: "short", timeZone: "UTC" })}`,
    });
  }
  return out;
}

/** "Tuesday 8 December, 7:00pm" for messages. */
export function longWhen(startsAtIso: string): string {
  return new Date(startsAtIso)
    .toLocaleString("en-AU", {
      timeZone: HUDDLE_TZ,
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", "")
    .replace(/\s?(am|pm)/i, (s) => s.trim().toLowerCase());
}
