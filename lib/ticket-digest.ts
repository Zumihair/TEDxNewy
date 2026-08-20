import "server-only";
import { randomUUID } from "crypto";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { sendBccEmail, getResendFrom } from "@/lib/email-notify";
import {
  humanitixConfigured,
  listHumanitixEvents,
  getHumanitixEventStats,
  type HxEvent,
  type HxEventStats,
} from "@/lib/humanitix";

/**
 * Weekly ticket sales digest, sent to full-access admins on Monday mornings
 * (Sydney). Rides the site's single cron (/api/cron/newsletter, every 5
 * minutes): each run calls maybeSendTicketDigest(), which no-ops outside the
 * Monday 8am hour and uses email_sends as the idempotency guard so the digest
 * goes out once per week no matter how many cron ticks land in the window.
 */

const SUBJECT_PREFIX = "Ticket sales digest";

function sydneyNow(): { weekday: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { weekday: get("weekday"), hour: Number(get("hour")) };
}

const money = (n: number) =>
  n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });

function eventLine(e: HxEvent, s: HxEventStats, now: number): string {
  const bits: string[] = [];
  if (e.capacity) {
    bits.push(
      `${s.sold}/${e.capacity} sold (${Math.round((s.sold / e.capacity) * 100)}%)`,
    );
  } else {
    bits.push(`${s.sold} sold`);
  }
  bits.push(`+${s.last7} this week`);
  bits.push(`${money(s.revenue)} gross`);
  if (s.angel > 0) bits.push(`${s.angel} Angel`);
  if (e.startDate) {
    const days = Math.ceil((Date.parse(e.startDate) - now) / 86400_000);
    if (Number.isFinite(days) && days >= 0) bits.push(`${days} days out`);
  }
  return `${e.name}: ${bits.join(" · ")}`;
}

export async function maybeSendTicketDigest(): Promise<{
  sent: boolean;
  reason: string;
}> {
  if (!humanitixConfigured()) return { sent: false, reason: "no-key" };

  const { weekday, hour } = sydneyNow();
  if (!weekday.startsWith("Mon") || hour !== 8) {
    return { sent: false, reason: "outside-window" };
  }

  const sb = getAdminSupabase();

  // Idempotency: skip if a digest already went out in the last 3 days.
  const since = new Date(Date.now() - 3 * 86400_000).toISOString();
  const { data: recent } = await sb
    .from("email_sends")
    .select("id")
    .like("subject", `${SUBJECT_PREFIX}%`)
    .gte("created_at", since)
    .limit(1);
  if (recent && recent.length > 0) {
    return { sent: false, reason: "already-sent" };
  }

  const { data: admins } = await sb.from("cms_admins").select("*");
  const recipients = (admins ?? [])
    .filter(
      (a: Record<string, unknown>) => a["access_level"] !== "community",
    )
    .map((a: Record<string, unknown>) => String(a["email"] ?? ""))
    .filter((e) => e.includes("@"));
  if (recipients.length === 0) return { sent: false, reason: "no-recipients" };

  const eventsRes = await listHumanitixEvents();
  if (!eventsRes.ok) return { sent: false, reason: eventsRes.error };

  const now = Date.now();
  const upcoming = eventsRes.data
    .filter((e) => e.startDate && Date.parse(e.startDate) >= now)
    .sort(
      (a, b) => Date.parse(a.startDate ?? "") - Date.parse(b.startDate ?? ""),
    );
  if (upcoming.length === 0) return { sent: false, reason: "no-upcoming" };

  const lines: string[] = [];
  let totalAngel = 0;
  for (const e of upcoming) {
    const stats = await getHumanitixEventStats(e);
    if (!stats.ok) {
      lines.push(`${e.name}: couldn't load (${stats.error})`);
      continue;
    }
    totalAngel += stats.data.angel;
    lines.push(eventLine(e, stats.data, now));
  }

  const dateLabel = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    timeZone: "Australia/Sydney",
  }).format(new Date());
  const subject = `${SUBJECT_PREFIX} · ${dateLabel}`;
  const text = [
    "Monday ticket check, straight from Humanitix.",
    "",
    ...lines,
    "",
    totalAngel > 0
      ? `${totalAngel} Angel seats funded so far across upcoming events.`
      : null,
    "Full detail: https://www.tedxnewy.com.au/admin/tickets",
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  const results = await sendBccEmail(recipients, { subject, text });
  const okCount = results.filter((r) => r.ok).length;

  // History row doubles as next week's idempotency marker.
  try {
    await sb.from("email_sends").insert({
      batch_id: randomUUID(),
      from_email: getResendFrom(),
      to_email: `admins (${recipients.length})`,
      cc: null,
      subject,
      body: text,
      status: okCount > 0 ? "sent" : "failed",
      error: okCount > 0 ? null : results[0]?.error ?? "send failed",
      resend_id: results.find((r) => r.id)?.id ?? null,
    });
  } catch (err) {
    console.error("[ticket-digest] history insert failed", err);
  }

  return okCount > 0
    ? { sent: true, reason: `sent to ${okCount}` }
    : { sent: false, reason: results[0]?.error ?? "send failed" };
}
