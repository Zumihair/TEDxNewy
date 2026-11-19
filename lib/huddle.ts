/**
 * Monthly team huddle bot: poll in #team-meetings, organiser confirms, a
 * Google Calendar invite goes to everyone in the workspace, reminders, an
 * agenda thread and a minutes thread. Driven by Slack button clicks
 * (app/api/slack/interactivity) and the existing 5-minute cron
 * (processHuddles, called from app/api/cron/newsletter).
 *
 * Env: SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, HUDDLE_CHANNEL_ID,
 * HUDDLE_LINK, HUDDLE_OWNER_EMAIL (default will@tedxnewy.com.au) and the
 * GOOGLE_* trio (lib/google-calendar). A no-op until Slack is configured.
 */
import "server-only";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { slackApi, slackBotConfigured, slackGet } from "@/lib/slack-api";
import { createCalendarEvent, googleCalendarConfigured } from "@/lib/google-calendar";
import {
  isPollOpenTime,
  longWhen,
  slotsForMonth,
  targetMonth,
  type HuddleSlot,
} from "@/lib/huddle-dates";
import {
  agendaMessage,
  agendaModal,
  bookedMessage,
  confirmDm,
  minutesMessage,
  pollMessage,
  reminderMessage,
  type VotesBySlot,
} from "@/lib/huddle-message";

const POLL_HOURS = 48;
const MEETING_MINUTES = 60;
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Poll = {
  id: string;
  month: string;
  is_test: boolean;
  slots: HuddleSlot[];
  status: "open" | "awaiting_confirm" | "booked" | "cancelled";
  channel_id: string;
  message_ts: string | null;
  closes_at: string;
  dm_channel: string | null;
  dm_ts: string | null;
  chosen_slot: string | null;
  starts_at: string | null;
  agenda_ts: string | null;
  minutes_ts: string | null;
  r24_sent: boolean;
  r1_sent: boolean;
};

const cfg = () => ({
  channel: process.env.HUDDLE_CHANNEL_ID ?? "",
  link: process.env.HUDDLE_LINK ?? "",
  ownerEmail: process.env.HUDDLE_OWNER_EMAIL ?? "will@tedxnewy.com.au",
});

export function huddleConfigured(): boolean {
  return slackBotConfigured() && Boolean(cfg().channel);
}

const monthLabelOf = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
};

// --- data helpers --------------------------------------------------------

async function loadPoll(id: string): Promise<Poll | null> {
  const { data } = await getAdminSupabase().from("huddle_polls").select("*").eq("id", id).maybeSingle();
  return (data as Poll | null) ?? null;
}

async function votesOf(pollId: string): Promise<VotesBySlot> {
  const { data } = await getAdminSupabase().from("huddle_votes").select("user_id, slot_key").eq("poll_id", pollId);
  const out: VotesBySlot = {};
  for (const r of (data ?? []) as { user_id: string; slot_key: string }[]) {
    (out[r.slot_key] ??= []).push(r.user_id);
  }
  return out;
}

async function patch(id: string, fields: Record<string, unknown>) {
  await getAdminSupabase().from("huddle_polls").update(fields).eq("id", id);
}

let ownerCache: { email: string; id: string } | null = null;
export async function ownerSlackId(): Promise<string | null> {
  const email = cfg().ownerEmail;
  if (ownerCache?.email === email) return ownerCache.id;
  const res = await slackGet("users.lookupByEmail", { email });
  const id = (res.user as { id?: string } | undefined)?.id;
  if (!id) return null;
  ownerCache = { email, id };
  return id;
}

/** Emails of real members: not bots, not deactivated, not guests. */
async function workspaceEmails(): Promise<string[]> {
  const emails: string[] = [];
  let cursor = "";
  for (let i = 0; i < 10; i++) {
    const res = await slackGet("users.list", { limit: "200", ...(cursor ? { cursor } : {}) });
    if (!res.ok) break;
    for (const u of (res.members as Array<Record<string, unknown>>) ?? []) {
      const p = (u.profile ?? {}) as { email?: string };
      if (u.deleted || u.is_bot || u.is_restricted || u.is_ultra_restricted || u.id === "USLACKBOT") continue;
      if (p.email) emails.push(p.email.toLowerCase());
    }
    cursor = ((res.response_metadata as { next_cursor?: string } | undefined)?.next_cursor) ?? "";
    if (!cursor) break;
  }
  return [...new Set(emails)];
}

// --- poll lifecycle ------------------------------------------------------

/** Opens the poll for the month after `nowMs` (idempotent per month). */
export async function openPoll(opts: { nowMs?: number; isTest?: boolean } = {}): Promise<{ ok: boolean; id?: string; note?: string }> {
  const now = opts.nowMs ?? Date.now();
  const isTest = opts.isTest ?? false;
  const { channel } = cfg();
  const t = targetMonth(now);
  const supabase = getAdminSupabase();
  if (!isTest) {
    const { data: existing } = await supabase.from("huddle_polls").select("id").eq("month", t.key).eq("is_test", false).maybeSingle();
    if (existing) return { ok: true, id: (existing as { id: string }).id, note: "already open" };
  }
  const slots = slotsForMonth(t.y, t.m);
  const closesAt = new Date(now + POLL_HOURS * 3600 * 1000);
  const { data, error } = await supabase
    .from("huddle_polls")
    .insert({ month: t.key, is_test: isTest, slots, channel_id: channel, closes_at: closesAt.toISOString() })
    .select("*")
    .single();
  if (error || !data) {
    console.error("[huddle] poll insert failed", error?.message);
    return { ok: false, note: "insert failed" };
  }
  const poll = data as Poll;
  const msg = pollMessage({
    pollId: poll.id, slots, votes: {}, monthLabel: monthLabelOf(t.key),
    closesAtUnix: Math.floor(closesAt.getTime() / 1000), isTest,
  });
  const res = await slackApi("chat.postMessage", { channel, ...msg, unfurl_links: false });
  if (!res.ok) {
    await supabase.from("huddle_polls").delete().eq("id", poll.id);
    return { ok: false, note: `slack: ${res.error}` };
  }
  await patch(poll.id, { message_ts: res.ts });
  return { ok: true, id: poll.id };
}

export async function refreshPollMessage(poll: Poll, closed = false) {
  if (!poll.message_ts) return;
  const votes = await votesOf(poll.id);
  const msg = pollMessage({
    pollId: poll.id, slots: poll.slots, votes, monthLabel: monthLabelOf(poll.month),
    closesAtUnix: Math.floor(Date.parse(poll.closes_at) / 1000), isTest: poll.is_test, closed,
  });
  await slackApi("chat.update", { channel: poll.channel_id, ts: poll.message_ts, ...msg });
}

/** Toggles a vote. Returns false if the poll is not open. */
export async function toggleVote(pollId: string, slotKey: string, userId: string): Promise<boolean> {
  const poll = await loadPoll(pollId);
  if (!poll || poll.status !== "open" || Date.parse(poll.closes_at) <= Date.now()) return false;
  if (!poll.slots.some((s) => s.key === slotKey)) return false;
  const supabase = getAdminSupabase();
  const { data: had } = await supabase.from("huddle_votes").select("user_id").eq("poll_id", pollId).eq("user_id", userId).eq("slot_key", slotKey).maybeSingle();
  if (had) await supabase.from("huddle_votes").delete().eq("poll_id", pollId).eq("user_id", userId).eq("slot_key", slotKey);
  else await supabase.from("huddle_votes").insert({ poll_id: pollId, user_id: userId, slot_key: slotKey });
  await refreshPollMessage(poll);
  return true;
}

function winnerOf(poll: Poll, votes: VotesBySlot): string {
  let best = poll.slots[0].key;
  let n = -1;
  for (const s of poll.slots) {
    const c = (votes[s.key] ?? []).length;
    if (c > n) { best = s.key; n = c; } // ties keep the earlier day
  }
  return best;
}

/** DMs the organiser the confirm buttons (also used after an extension). */
async function sendConfirmDm(poll: Poll) {
  const owner = await ownerSlackId();
  if (!owner) { console.error("[huddle] could not find the organiser in Slack"); return; }
  const open = await slackApi("conversations.open", { users: owner });
  const dm = (open.channel as { id?: string } | undefined)?.id;
  if (!dm) return;
  const votes = await votesOf(poll.id);
  const msg = confirmDm({ pollId: poll.id, slots: poll.slots, votes, winnerKey: winnerOf(poll, votes), isTest: poll.is_test });
  const res = await slackApi("chat.postMessage", { channel: dm, ...msg });
  await patch(poll.id, { status: "awaiting_confirm", dm_channel: dm, dm_ts: res.ts ?? null });
}

export async function extendPoll(pollId: string): Promise<void> {
  const poll = await loadPoll(pollId);
  if (!poll || poll.status === "booked") return;
  const closes = new Date(Math.max(Date.now(), Date.parse(poll.closes_at)) + 24 * 3600 * 1000).toISOString();
  await patch(pollId, { status: "open", closes_at: closes });
  const fresh = (await loadPoll(pollId)) as Poll;
  await refreshPollMessage(fresh);
  if (poll.dm_channel && poll.dm_ts) {
    await slackApi("chat.update", {
      channel: poll.dm_channel, ts: poll.dm_ts, text: "Voting extended by 24 hours.",
      blocks: [{ type: "section", text: { type: "mrkdwn", text: ":hourglass_flowing_sand: Voting extended by 24 hours. I will message you again when it closes." } }],
    });
  }
}

/** Books the chosen day: calendar invites, announcement, agenda thread. */
export async function confirmPoll(pollId: string, slotKey: string, byUserId: string): Promise<{ ok: boolean; note: string }> {
  const owner = await ownerSlackId();
  if (!owner || owner !== byUserId) return { ok: false, note: "Only the organiser can confirm the day." };
  const poll = await loadPoll(pollId);
  if (!poll) return { ok: false, note: "That poll no longer exists." };
  if (poll.status === "booked") return { ok: false, note: "Already booked." };
  const slot = poll.slots.find((s) => s.key === slotKey);
  if (!slot) return { ok: false, note: "Unknown day." };
  if (!googleCalendarConfigured()) return { ok: false, note: "Google Calendar is not connected yet." };

  const { link } = cfg();
  const attendees = poll.is_test ? [cfg().ownerEmail.toLowerCase()] : await workspaceEmails();
  const endsAt = new Date(Date.parse(slot.startsAt) + MEETING_MINUTES * 60000).toISOString();
  const ev = await createCalendarEvent({
    summary: `${poll.is_test ? "TEST: " : ""}TEDxNewy team huddle`,
    description: `Monthly TEDxNewy team huddle.\nJoin in Slack: ${link}\nAgenda and minutes live in #team-meetings.`,
    location: link,
    startsAt: slot.startsAt,
    endsAt,
    attendees,
  });
  if (!ev) return { ok: false, note: "Could not create the calendar event. Nothing was sent." };

  await patch(pollId, {
    status: "booked", chosen_slot: slot.key, starts_at: slot.startsAt,
    google_event_id: ev.id, google_event_url: ev.url,
  });
  const fresh = (await loadPoll(pollId)) as Poll;
  await refreshPollMessage(fresh, true);
  await slackApi("chat.postMessage", { channel: poll.channel_id, ...bookedMessage({ startsAtIso: slot.startsAt, huddleLink: link, isTest: poll.is_test }) });
  const agenda = await slackApi("chat.postMessage", { channel: poll.channel_id, ...agendaMessage({ pollId, startsAtIso: slot.startsAt, isTest: poll.is_test }) });
  if (agenda.ts) await patch(pollId, { agenda_ts: agenda.ts });
  if (poll.dm_channel && poll.dm_ts) {
    await slackApi("chat.update", {
      channel: poll.dm_channel, ts: poll.dm_ts, text: `Booked: ${longWhen(slot.startsAt)}`,
      blocks: [{ type: "section", text: { type: "mrkdwn", text: `:white_check_mark: Booked *${longWhen(slot.startsAt)}*. Invited ${attendees.length} ${attendees.length === 1 ? "person" : "people"}. <${ev.url}|Open in Google Calendar>` } }],
    });
  }
  return { ok: true, note: "Booked." };
}

// --- agenda --------------------------------------------------------------

export async function openAgendaModal(pollId: string, triggerId: string) {
  await slackApi("views.open", { trigger_id: triggerId, view: agendaModal(pollId) });
}

export async function addAgendaItem(pollId: string, text: string, userId: string) {
  const poll = await loadPoll(pollId);
  if (!poll?.agenda_ts) return;
  await slackApi("chat.postMessage", {
    channel: poll.channel_id, thread_ts: poll.agenda_ts,
    text: `• ${text} (added by <@${userId}>)`,
  });
}

// --- the 5-minute sweep --------------------------------------------------

export type HuddleSweep = { opened: boolean; closed: number; reminders: number; minutes: number };

export async function processHuddles(nowMs: number = Date.now()): Promise<HuddleSweep> {
  const out: HuddleSweep = { opened: false, closed: 0, reminders: 0, minutes: 0 };
  if (!huddleConfigured()) return out;
  const supabase = getAdminSupabase();

  // 1. Open next month's poll from 9am on the 20th.
  if (isPollOpenTime(nowMs)) {
    const r = await openPoll({ nowMs });
    out.opened = r.ok && r.note !== "already open";
  }

  // 2. Close polls whose 48 hours are up, then ask the organiser.
  const { data: due } = await supabase.from("huddle_polls").select("*").eq("status", "open").lte("closes_at", new Date(nowMs).toISOString());
  for (const poll of (due ?? []) as Poll[]) {
    await refreshPollMessage(poll, true);
    await sendConfirmDm(poll);
    out.closed += 1;
  }

  // 3. Reminders and the minutes thread for booked huddles.
  const { data: booked } = await supabase.from("huddle_polls").select("*").eq("status", "booked");
  for (const poll of (booked ?? []) as Poll[]) {
    if (!poll.starts_at) continue;
    const start = Date.parse(poll.starts_at);
    const link = cfg().link;
    if (!poll.r24_sent && nowMs >= start - 24 * 3600000 && nowMs < start) {
      // Claim first so a slow second run cannot double post.
      const { data: claimed } = await supabase.from("huddle_polls").update({ r24_sent: true }).eq("id", poll.id).eq("r24_sent", false).select("id");
      if (claimed?.length) {
        await slackApi("chat.postMessage", { channel: poll.channel_id, ...reminderMessage({ kind: "day", startsAtIso: poll.starts_at, huddleLink: link, isTest: poll.is_test }) });
        out.reminders += 1;
      }
    }
    if (!poll.r1_sent && nowMs >= start - 3600000 && nowMs < start) {
      const { data: claimed } = await supabase.from("huddle_polls").update({ r1_sent: true }).eq("id", poll.id).eq("r1_sent", false).select("id");
      if (claimed?.length) {
        await slackApi("chat.postMessage", { channel: poll.channel_id, ...reminderMessage({ kind: "hour", startsAtIso: poll.starts_at, huddleLink: link, isTest: poll.is_test }) });
        out.reminders += 1;
      }
    }
    if (!poll.minutes_ts && nowMs >= start + 90 * 60000) {
      const res = await slackApi("chat.postMessage", { channel: poll.channel_id, ...minutesMessage({ startsAtIso: poll.starts_at, isTest: poll.is_test }) });
      if (res.ts) { await patch(poll.id, { minutes_ts: res.ts }); out.minutes += 1; }
    }
  }
  return out;
}

