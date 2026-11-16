/**
 * Data for /admin/system-caps. Reads only what can be read reliably:
 *  - emails per day from email_sends (via email_sends_daily), and
 *  - database size, storage size, auth users and subscribers from
 *    system_usage_daily, which the daily cron fills.
 * Everything else is listed as "not tracked automatically" in
 * system-caps-config.ts. If the migration has not been applied yet, each
 * meter says so instead of inventing a number.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CAPS, CRON_RUNS_PER_DAY } from "@/lib/system-caps-config";
import {
  fillDays,
  growthPerDay,
  projectNext30,
  statusFor,
  windowSum,
  worst,
  movingAverage,
  type CapStatus,
} from "@/lib/system-caps-math";

export type FlowMeter = {
  kind: "flow";
  key: string;
  label: string;
  unit: string;
  /** Last 30 days, oldest first, one value per UTC day. */
  history: number[];
  today: number;
  last30: number;
  avg7: number;
  next30: number;
  dailyCap: number | null;
  monthlyCap: number | null;
  status: CapStatus;
  note: string;
};

export type LevelMeter = {
  kind: "level";
  key: string;
  label: string;
  /** "bytes" or "count". */
  unit: "bytes" | "count";
  history: number[];
  current: number;
  /** Growth per day over the history, null with under 2 points. */
  perDay: number | null;
  in30: number | null;
  cap: number | null;
  status: CapStatus;
  note: string;
};

export type Unavailable = { kind: "unavailable"; key: string; label: string; note: string };
export type Meter = FlowMeter | LevelMeter | Unavailable;

const todayUtc = () => new Date().toISOString().slice(0, 10);
const MISSING =
  "Not available yet. Apply the 20261116_system_usage migration, then this fills in (levels after the first daily run).";

async function emailMeter(supabase: SupabaseClient): Promise<Meter> {
  const { data, error } = await supabase.rpc("email_sends_daily", { days: 30 });
  if (error) return { kind: "unavailable", key: "resend", label: "Emails sent", note: MISSING };
  const byDay = new Map<string, number>();
  for (const r of (data ?? []) as { day: string; sent: number | string }[]) {
    byDay.set(String(r.day).slice(0, 10), Number(r.sent));
  }
  const history = fillDays(byDay, todayUtc(), 30);
  const last30 = windowSum(history, 30);
  const today = history[history.length - 1] ?? 0;
  const dailyCap = CAPS.resendDaily;
  const monthlyCap = CAPS.resendMonthly;
  const status = worst(statusFor(last30, monthlyCap), statusFor(today, dailyCap));
  return {
    kind: "flow",
    key: "resend",
    label: "Emails sent",
    unit: "emails",
    history,
    today,
    last30,
    avg7: movingAverage(history, 7),
    next30: projectNext30(history),
    dailyCap,
    monthlyCap,
    status,
    note:
      "Newsletters, welcome flow and composed emails, counted from our own send log. Form notification emails are not in this count (a few a day). " +
      "Cap assumes the Resend Pro plan (50,000 a month, no daily limit); the real plan is not readable from the site.",
  };
}

async function levelMeters(supabase: SupabaseClient): Promise<Meter[]> {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("system_usage_daily")
    .select("day, metric, value")
    .gte("day", since)
    .order("day", { ascending: true });
  const defs: { key: string; label: string; unit: "bytes" | "count"; cap: number | null; note: string }[] = [
    { key: "db_bytes", label: "Database size", unit: "bytes", cap: CAPS.supabaseDbBytes, note: "Supabase Pro includes 8 GB." },
    { key: "storage_bytes", label: "File storage", unit: "bytes", cap: CAPS.supabaseStorageBytes, note: "Supabase Storage (uploads and social images). Pro includes 100 GB." },
    { key: "auth_users", label: "Admin sign-ins", unit: "count", cap: CAPS.supabaseAuthUsers, note: "Monthly active users on Pro is 100,000; we use a handful." },
    { key: "subscribers", label: "Subscribers", unit: "count", cap: null, note: "No plan cap here; the Mailchimp and Resend contact limits are what matter." },
  ];
  if (error) return defs.map((d) => ({ kind: "unavailable", key: d.key, label: d.label, note: MISSING }));
  const rows = (data ?? []) as { day: string; metric: string; value: number | string }[];
  return defs.map((d) => {
    const series = rows.filter((r) => r.metric === d.key).map((r) => Number(r.value));
    if (series.length === 0) return { kind: "unavailable", key: d.key, label: d.label, note: MISSING } as Unavailable;
    const current = series[series.length - 1];
    const perDay = growthPerDay(series);
    return {
      kind: "level",
      key: d.key,
      label: d.label,
      unit: d.unit,
      history: series,
      current,
      perDay,
      in30: perDay === null ? null : Math.round(current + perDay * 30),
      cap: d.cap,
      status: statusFor(current, d.cap),
      note: d.note + (CAPS.supabaseAssumed && d.cap ? " Plan assumed from usage; confirm in the Supabase dashboard." : ""),
    } as LevelMeter;
  });
}

/** Scheduled cron invocations per month, from the vercel.json schedule. */
export function cronLoad() {
  const perDay = CRON_RUNS_PER_DAY.reduce((a, c) => a + c.perDay, 0);
  const perMonth = perDay * 30;
  return {
    perDay,
    perMonth,
    shareOfIncluded: perMonth / CAPS.vercelInvocations,
    jobs: CRON_RUNS_PER_DAY,
  };
}

export async function getSystemCaps(supabase: SupabaseClient): Promise<Meter[]> {
  const [email, levels] = await Promise.all([emailMeter(supabase), levelMeters(supabase)]);
  return [email, ...levels];
}
