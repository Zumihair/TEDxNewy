/**
 * Date helpers for the admin calendar.
 *
 * Everything in the database is UTC `timestamptz`, and every admin surface
 * renders `Australia/Sydney`. The grid therefore buckets by **Sydney local
 * date**, not UTC date, or a 9pm post lands on tomorrow's cell.
 *
 * A "day key" here is a plain `YYYY-MM-DD` string in Sydney terms. Keys are
 * compared and stepped as plain dates (via `Date.UTC`), never as instants, so
 * no offset arithmetic is involved and daylight saving can't shift a cell.
 *
 * Pure: no server-only imports, so the server page and the client board can
 * both use it.
 */

export const SYDNEY = "Australia/Sydney";

const KEY_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: SYDNEY,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const TIME_FMT = new Intl.DateTimeFormat("en-AU", {
  timeZone: SYDNEY,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** `2026-08-18` for an ISO instant, in Sydney terms. en-CA already sorts. */
export function sydneyDateKey(iso: string | Date): string {
  return KEY_FMT.format(typeof iso === "string" ? new Date(iso) : iso);
}

/** `7:30pm` / `9am` for an ISO instant, in Sydney terms. */
export function sydneyTimeLabel(iso: string): string {
  return TIME_FMT.format(new Date(iso))
    .replace(/\s/g, "")
    .replace(":00", "")
    .toLowerCase();
}

export function isDayKey(value: string | undefined | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** A day key as a UTC-midnight Date, for plain-date arithmetic only. */
function keyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function dateToKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(key: string, days: number): string {
  const d = keyToDate(key);
  d.setUTCDate(d.getUTCDate() + days);
  return dateToKey(d);
}

/** Today in Sydney. */
export function todayKey(): string {
  return sydneyDateKey(new Date());
}

/** The Monday of the week a key falls in. */
export function mondayOf(key: string): string {
  const dow = keyToDate(key).getUTCDay(); // 0 = Sunday
  return addDays(key, -((dow + 6) % 7));
}

/** The Monday of the current Sydney week: where the calendar opens. */
export function currentSydneyMonday(): string {
  return mondayOf(todayKey());
}

/** Four Mon to Sun weeks starting at `startKey`. */
export function weeksFrom(startKey: string, count = 4): string[][] {
  return Array.from({ length: count }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(startKey, w * 7 + d)),
  );
}

/**
 * UTC bounds covering the whole visible range, padded a day either side so
 * the Sydney/UTC offset can never clip an item off the first or last day.
 * The exact day is decided by `sydneyDateKey` after the rows come back.
 */
export function utcBoundsFor(startKey: string, days = 28) {
  return {
    fromIso: keyToDate(addDays(startKey, -1)).toISOString(),
    toIso: keyToDate(addDays(startKey, days + 1)).toISOString(),
  };
}

const DAY_FMT = new Intl.DateTimeFormat("en-AU", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});

const DAY_YEAR_FMT = new Intl.DateTimeFormat("en-AU", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** `18 Aug to 14 Sep 2026`, for the range heading. */
export function rangeLabel(startKey: string, endKey: string): string {
  return `${DAY_FMT.format(keyToDate(startKey))} to ${DAY_YEAR_FMT.format(
    keyToDate(endKey),
  )}`;
}

/** `18` — the date number shown in a cell. */
export function dayNumber(key: string): number {
  return Number(key.slice(8, 10));
}

/** `Aug` — shown on the 1st of a month so the grid stays orientable. */
export function monthShort(key: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "UTC",
    month: "short",
  }).format(keyToDate(key));
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SYD_TIME_PARTS_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: SYDNEY,
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const SYD_INSTANT_PARTS_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: SYDNEY,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function partsOf(dtf: Intl.DateTimeFormat, at: Date): Record<string, string> {
  return Object.fromEntries(dtf.formatToParts(at).map((p) => [p.type, p.value]));
}

/** The Sydney UTC offset, in minutes, at a given instant (600 in AEST,
 *  660 in AEDT). `Intl` already knows the DST calendar, so this needs no
 *  hand-kept transition dates. */
function sydneyOffsetMinutes(at: Date): number {
  const p = partsOf(SYD_INSTANT_PARTS_FMT, at);
  const hour = Number(p.hour) === 24 ? 0 : Number(p.hour);
  const asIfUtc = Date.UTC(
    Number(p.year), Number(p.month) - 1, Number(p.day), hour, Number(p.minute), Number(p.second),
  );
  return Math.round((asIfUtc - at.getTime()) / 60_000);
}

/**
 * Moves an instant to a different Sydney calendar day, keeping its Sydney
 * wall-clock TIME unchanged — the calendar's drag-and-drop: the day the
 * item is on moves, what time it fires at doesn't.
 *
 * Timezone-aware rather than a naive +/- 24h, so dragging across the AEST/
 * AEDT boundary still lands at the same wall-clock time (a plain day-count
 * shift would drift by an hour on the transition week). Two-step: guess the
 * instant by treating the target wall-clock as UTC, read the Sydney offset
 * AT that guess, correct by it, then re-check the offset at the corrected
 * instant in case the guess and the true instant fell either side of a DST
 * transition — a fixed point that converges in at most one more step.
 */
export function applyDayKeepingSydneyTime(iso: string, newDay: string): string {
  const original = new Date(iso);
  const time = partsOf(SYD_TIME_PARTS_FMT, original);
  const hh = Number(time.hour) === 24 ? 0 : Number(time.hour);
  const mm = Number(time.minute);
  const ss = Number(time.second);
  const [y, m, d] = newDay.split("-").map(Number);

  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
  const offset1 = sydneyOffsetMinutes(guess);
  const candidate = guess.getTime() - offset1 * 60_000;
  const offset2 = sydneyOffsetMinutes(new Date(candidate));
  const finalMillis = offset2 === offset1 ? candidate : guess.getTime() - offset2 * 60_000;
  return new Date(finalMillis).toISOString();
}
