/**
 * Data for /admin/system-caps, as a flat list of small tiles.
 *
 * Live sources (nothing invented):
 *  - Resend: GET /usage with the site's own RESEND_API_KEY (daily and monthly
 *    used and limit, straight from Resend). Falls back to our own send log and
 *    the constants in system-caps-config.ts if that call fails.
 *  - Database size, file storage, sign-ins: system_usage_daily. If today has no
 *    row yet the page takes a live reading (record_system_usage() through the
 *    service client, at most once a day because the row then exists).
 *  - Cron runs: calculated from the vercel.json schedule.
 *  - Vercel usage: a manual last reading (grey tile).
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { CAPS, CRON_RUNS_PER_DAY, MANUAL } from "@/lib/system-caps-config";
import { fillDays, growthPerDay, movingAverage, pct, statusFor, type CapStatus } from "@/lib/system-caps-math";
import type { Tile } from "@/lib/system-caps-types";

const todayUtc = () => new Date().toISOString().slice(0, 10);
const n = (v: number) => Math.round(v).toLocaleString("en-AU");

function bytes(v: number): string {
  if (v >= 1024 ** 3) return `${(v / 1024 ** 3).toFixed(2)} GB`;
  if (v >= 1024 ** 2) return `${Math.round(v / 1024 ** 2)} MB`;
  return `${Math.round(v / 1024)} KB`;
}

type ResendUsage = {
  daily: { used: number; limit: number | null };
  monthly: { used: number; limit: number | null; resetsAt: string | null };
};

/** Resend's own numbers for the account the site sends from. Null on any failure. */
async function resendUsage(): Promise<ResendUsage | null> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.resend.com/usage", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as {
      emails?: {
        daily?: { used?: number; limit?: number | null };
        monthly?: { used?: number; limit?: number | null; resets_at?: string };
      };
    };
    const d = j.emails?.daily;
    const m = j.emails?.monthly;
    if (typeof d?.used !== "number" || typeof m?.used !== "number") return null;
    return {
      daily: { used: d.used, limit: d.limit ?? null },
      monthly: { used: m.used, limit: m.limit ?? null, resetsAt: m.resets_at ?? null },
    };
  } catch {
    return null;
  }
}

async function emailHistory(supabase: SupabaseClient): Promise<number[] | null> {
  const { data, error } = await supabase.rpc("email_sends_daily", { days: 30 });
  if (error) return null;
  const byDay = new Map<string, number>();
  for (const r of (data ?? []) as { day: string; sent: number | string }[]) {
    byDay.set(String(r.day).slice(0, 10), Number(r.sent));
  }
  return fillDays(byDay, todayUtc(), 30);
}

function flowTile(
  key: string,
  label: string,
  used: number,
  cap: number | null,
  sub: string,
  history: number[] | null,
  period: "day" | "month",
): Tile {
  const avg = history ? movingAverage(history, 7) : null;
  const hint =
    avg === null
      ? undefined
      : `7 day average ${n(avg)} a day. At this pace: ${n(avg * 30)} over the next 30 days${cap && period === "month" ? ` (${pct(avg * 30, cap)}% of the cap)` : ""}.`;
  return {
    key,
    label,
    kind: "live",
    value: cap ? `${pct(used, cap)}%` : n(used),
    sub,
    pct: cap ? pct(used, cap) : null,
    status: statusFor(used, cap),
    hint,
  };
}

async function resendTiles(supabase: SupabaseClient): Promise<Tile[]> {
  const [live, history] = await Promise.all([resendUsage(), emailHistory(supabase)]);
  const todayLog = history ? history[history.length - 1] : 0;
  const monthLog = history ? history.reduce((a, b) => a + b, 0) : 0;
  const daily = live?.daily ?? { used: todayLog, limit: CAPS.resendDaily };
  const monthly = live?.monthly ?? { used: monthLog, limit: CAPS.resendMonthly, resetsAt: null };
  const src = live ? "" : " (from our send log)";
  const out: Tile[] = [
    flowTile(
      "resend-day",
      "Emails today",
      daily.used,
      daily.limit,
      daily.limit ? `${n(daily.used)} / ${n(daily.limit)}${src}` : `no daily cap${src}`,
      history,
      "day",
    ),
    flowTile(
      "resend-month",
      live ? "Emails this cycle" : "Emails, 30 days",
      monthly.used,
      monthly.limit,
      `${n(monthly.used)} / ${monthly.limit ? n(monthly.limit) : "no cap"}${src}`,
      history,
      "month",
    ),
  ];
  return out;
}

const NO_TABLE = /42P01|PGRST205|does not exist|schema cache/i;

/** Today's levels: reads the table, and if today is missing takes one live reading. */
async function levelTiles(supabase: SupabaseClient): Promise<Tile[]> {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const read = () =>
    supabase.from("system_usage_daily").select("day, metric, value").gte("day", since).order("day", { ascending: true });
  let { data, error } = await read();
  if (error) {
    const missing = NO_TABLE.test(`${error.code ?? ""} ${error.message ?? ""}`);
    return DEFS.map((d) => ({
      key: d.key,
      label: d.label,
      kind: "setup" as const,
      value: missing ? "Setup" : "Error",
      sub: missing ? "table missing" : "could not read",
      pct: null,
      status: "ok" as CapStatus,
    }));
  }
  const hasToday = ((data ?? []) as { day: string }[]).some((r) => String(r.day).slice(0, 10) === todayUtc());
  if (!hasToday) {
    // Empty or stale: take a live reading now (the row then exists, so this
    // runs at most once a day), then read again.
    try {
      await getAdminSupabase().rpc("record_system_usage");
      ({ data, error } = await read());
    } catch (err) {
      console.error("[system-caps] live reading failed", err);
    }
  }
  const rows = ((data ?? []) as { day: string; metric: string; value: number | string }[]) ?? [];
  return DEFS.map((d) => {
    const series = rows.filter((r) => r.metric === d.key).map((r) => Number(r.value));
    if (series.length === 0) {
      return { key: d.key, label: d.label, kind: "setup" as const, value: "...", sub: "no reading yet", pct: null, status: "ok" as CapStatus };
    }
    const current = series[series.length - 1];
    const perDay = growthPerDay(series);
    const fmt = d.unit === "bytes" ? bytes : n;
    const hint =
      perDay === null
        ? undefined
        : `Growing ${fmt(perDay)} a day. At this pace: ${fmt(current + perDay * 30)} in 30 days (${pct(current + perDay * 30, d.cap)}% of the cap).`;
    return {
      key: d.key,
      label: d.label,
      kind: "live" as const,
      value: `${d.cap > 0 && current / d.cap < 0.01 ? "<1" : pct(current, d.cap)}%`,
      sub: `${fmt(current)} / ${fmt(d.cap)}`,
      pct: pct(current, d.cap),
      status: statusFor(current, d.cap),
      hint,
    };
  });
}

const DEFS: { key: string; label: string; unit: "bytes" | "count"; cap: number }[] = [
  { key: "db_bytes", label: "Database", unit: "bytes", cap: CAPS.supabaseDbBytes },
  { key: "storage_bytes", label: "File storage", unit: "bytes", cap: CAPS.supabaseStorageBytes },
  { key: "auth_users", label: "Admin sign-ins", unit: "count", cap: CAPS.supabaseAuthUsers },
];

function calcTiles(): Tile[] {
  const perMonth = CRON_RUNS_PER_DAY * 30;
  const p = (perMonth / CAPS.vercelInvocations) * 100;
  return [
    {
      key: "cron",
      label: "Cron runs",
      kind: "live",
      value: `${p < 1 ? "<1" : Math.round(p)}%`,
      sub: `${n(perMonth)} / ${n(CAPS.vercelInvocations)} a month`,
      pct: Math.max(1, Math.round(p)),
      status: statusFor(perMonth, CAPS.vercelInvocations),
      hint: "Calculated from the vercel.json schedule, not measured. Share of the Vercel Pro invocations included each month.",
    },
  ];
}

function manualTiles(): Tile[] {
  const v = MANUAL.vercelInvocations;
  const c = MANUAL.vercelCreditUsd;
  return [
    {
      key: "vercel-calls",
      label: "Vercel function calls",
      kind: "manual",
      value: `${pct(v.value, v.cap)}%`,
      sub: `${n(v.value)} / ${n(v.cap)}, ${v.asOf}`,
      pct: pct(v.value, v.cap),
      status: "ok",
      hint: "Last reading taken by hand. Update MANUAL in lib/system-caps-config.ts or check vercel.com usage.",
    },
    {
      key: "vercel-credit",
      label: "Vercel credit",
      kind: "manual",
      value: `${pct(c.value, c.cap)}%`,
      sub: `$${c.value.toFixed(2)} / $${c.cap}, ${c.asOf}`,
      pct: pct(c.value, c.cap),
      status: "ok",
      hint: "Last reading taken by hand. Overage is billed, never cut off.",
    },
  ];
}

export async function getSystemCaps(supabase: SupabaseClient): Promise<Tile[]> {
  const [resend, levels] = await Promise.all([resendTiles(supabase), levelTiles(supabase)]);
  return [...resend, ...levels, ...calcTiles(), ...manualTiles()];
}
