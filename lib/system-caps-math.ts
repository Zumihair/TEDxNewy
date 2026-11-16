/**
 * Pure maths for the System caps page (no imports, so it can be checked from
 * a plain script). All series are oldest first, one value per day.
 */

export type CapStatus = "ok" | "watch" | "close";

/** Amber from 70%, red from 90%. */
export const WATCH_AT = 0.7;
export const CLOSE_AT = 0.9;

export function statusFor(used: number, cap: number | null): CapStatus {
  if (!cap || cap <= 0) return "ok";
  const f = used / cap;
  return f >= CLOSE_AT ? "close" : f >= WATCH_AT ? "watch" : "ok";
}

/** The most serious of several statuses. */
export function worst(...all: CapStatus[]): CapStatus {
  return all.includes("close") ? "close" : all.includes("watch") ? "watch" : "ok";
}

/** Mean of the last `n` values (fewer if the series is shorter). */
export function movingAverage(series: number[], n = 7): number {
  const tail = series.slice(-n);
  return tail.length === 0 ? 0 : tail.reduce((a, b) => a + b, 0) / tail.length;
}

/** Sum of the last `n` values. */
export function windowSum(series: number[], n = 30): number {
  return series.slice(-n).reduce((a, b) => a + b, 0);
}

/** What the next 30 days look like if the last 7 days' average carries on. */
export function projectNext30(series: number[]): number {
  return Math.round(movingAverage(series, 7) * 30);
}

/** Growth per day of a level series (database size and similar), from the
 *  oldest to the newest point. Null with fewer than 2 points. */
export function growthPerDay(series: number[]): number | null {
  if (series.length < 2) return null;
  return (series[series.length - 1] - series[0]) / (series.length - 1);
}

/** Fills a sparse day to value map into a continuous oldest-first series
 *  ending at `endDay` (YYYY-MM-DD, UTC), zero for missing days. */
export function fillDays(byDay: Map<string, number>, endDay: string, days: number): number[] {
  const out: number[] = [];
  const end = Date.parse(`${endDay}T00:00:00Z`);
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(end - i * 86_400_000).toISOString().slice(0, 10);
    out.push(byDay.get(key) ?? 0);
  }
  return out;
}

export function pct(used: number, cap: number | null): number {
  if (!cap || cap <= 0) return 0;
  return Math.min(100, Math.round((used / cap) * 100));
}
