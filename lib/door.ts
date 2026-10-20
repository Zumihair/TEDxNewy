/**
 * Door check-in: the roster comes live from Humanitix (tickets joined to
 * orders for email and phone), the signed-in state lives in the
 * `door_checkins` table so every volunteer's phone sees the same list.
 *
 * Server-only. The URL token (env DOOR_TOKEN) is the only gate, so every
 * route calls `doorTokenOk` first and answers 404 on a mismatch.
 */
import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  fetchAllPages,
  humanitix,
  humanitixConfigured,
  isCancelled,
  listHumanitixEvents,
  type HxEvent,
} from "@/lib/humanitix";
import type {
  DoorAnswer,
  DoorParty,
  DoorRoster,
  DoorState,
  DoorTicket,
} from "@/lib/door-types";

type Rec = Record<string, unknown>;

const digest = (s: string) => createHash("sha256").update(s).digest();

export function doorTokenOk(token: string): boolean {
  const want = process.env.DOOR_TOKEN;
  if (!want || want.length < 16) return false;
  return timingSafeEqual(digest(token), digest(want));
}

const rec = (v: unknown): Rec | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : null;

function str(r: Rec | null, ...keys: string[]): string | null {
  if (!r) return null;
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return null;
}

/** Picks the event being run: DOOR_EVENT_ID, else the one nearest to today. */
function pickEvent(events: HxEvent[]): HxEvent | null {
  const want = process.env.DOOR_EVENT_ID;
  if (want) {
    const hit = events.find((e) => e.id === want || e.slug === want);
    if (hit) return hit;
  }
  const now = Date.now();
  const day = 86400_000;
  const dated = events
    .map((e) => ({ e, t: e.startDate ? Date.parse(e.startDate) : NaN }))
    .filter((x) => Number.isFinite(x.t));
  const upcoming = dated.filter((x) => x.t >= now - day).sort((a, b) => a.t - b.t)[0];
  if (upcoming) return upcoming.e;
  return dated.sort((a, b) => b.t - a.t)[0]?.e ?? events[0] ?? null;
}

/** questionId -> question text, from wherever the event record keeps them. */
function questionLabels(raw: Rec): Map<string, string> {
  const out = new Map<string, string>();
  const seen = new Set<unknown>();
  const visit = (n: unknown, depth: number) => {
    if (depth > 4 || !n || typeof n !== "object" || seen.has(n)) return;
    seen.add(n);
    if (Array.isArray(n)) {
      for (const x of n) visit(x, depth + 1);
      return;
    }
    const r = n as Rec;
    const id = str(r, "_id", "id", "questionId");
    const q = str(r, "question", "label", "title");
    if (id && q) out.set(id, q);
    for (const v of Object.values(r)) visit(v, depth + 1);
  };
  visit(raw, 0);
  return out;
}

function answersOf(node: unknown, labels: Map<string, string>): DoorAnswer[] {
  const out: DoorAnswer[] = [];
  const arr = Array.isArray(node) ? node : [];
  for (const item of arr) {
    const r = rec(item);
    if (!r) continue;
    let a = str(r, "value", "answer", "response", "text");
    if (!a && typeof r["value"] === "boolean") a = r["value"] ? "Yes" : "No";
    if (!a && Array.isArray(r["values"])) {
      a = (r["values"] as unknown[]).filter((x) => typeof x === "string").join(", ") || null;
    }
    if (!a) continue;
    const id = str(r, "questionId", "_id", "id");
    const q = str(r, "question", "label", "name") ?? (id ? labels.get(id) : null) ?? "Detail";
    out.push({ q, a });
  }
  return out;
}

const SIZE = /^(x{0,3}[sl]|[2-9]xl|xxl|m|medium|small|large|(kids?|youth|ladies|womens?|mens?|unisex)\b.*)$/i;
const SHIRT_Q = /shirt|tee|size/i;

function shirtOf(answers: DoorAnswer[]): string | null {
  for (const { q, a } of answers) if (SHIRT_Q.test(q)) return a;
  for (const { q, a } of answers) if (q === "Detail" && SIZE.test(a.trim())) return a;
  return null;
}

const SUPPORTER = /supporter|angel|patron|champion|vip/i;

function perksOf(ticketType: string, shirt: string | null): string[] {
  const perks: string[] = [];
  if (SUPPORTER.test(ticketType)) perks.push("Supporter gift");
  if (shirt) perks.push(`T-shirt ${shirt}`);
  else if (/shirt|tee/i.test(ticketType)) perks.push("T-shirt included");
  return perks;
}

/** Every string leaf of a value, so an object-shaped QR payload still yields codes. */
function leaves(v: unknown, depth = 0): string[] {
  if (typeof v === "string") return [v];
  if (typeof v === "number") return [String(v)];
  if (depth > 2 || !v || typeof v !== "object") return [];
  return Object.values(v as Rec).flatMap((x) => leaves(x, depth + 1));
}

/**
 * Strings on a ticket that its QR code could encode. Humanitix puts the
 * payload in `qrCodeData`; the ticket id and number are kept as fallbacks.
 * Ids shared by every ticket (event, ticket type) are never codes.
 */
function codesOf(t: Rec): string[] {
  const out = new Set<string>();
  for (const s of leaves(t["qrCodeData"])) {
    const v = s.trim().toLowerCase();
    if (v.length >= 5 && v.length <= 400) out.add(v);
  }
  for (const k of ["_id", "id", "number", "ticketNumber", "barcode", "code"]) {
    const v = str(t, k)?.toLowerCase();
    if (v && v.length >= 5 && v.length <= 80) out.add(v);
  }
  return [...out];
}

/** "9" for digits, "a" for letters: the shape of a value without its content. */
const shape = (s: string) => s.replace(/[0-9]/g, "9").replace(/[a-z]/gi, "a");

function phoneOf(...sources: (Rec | null)[]): string {
  for (const r of sources) {
    if (!r) continue;
    for (const k of Object.keys(r)) {
      if (/phone|mobile/i.test(k)) {
        const v = str(r, k);
        if (v) return v;
      }
    }
  }
  return "";
}

function fullName(r: Rec | null): string {
  if (!r) return "";
  const n = `${str(r, "firstName", "first_name") ?? ""} ${str(r, "lastName", "last_name") ?? ""}`.trim();
  return n || str(r, "name", "fullName") || "";
}

type Built = { ok: true; data: DoorRoster } | { ok: false; error: string };

async function buildRoster(): Promise<Built> {
  if (!humanitixConfigured()) {
    return { ok: false, error: "HUMANITIX_API_KEY is not set on this environment." };
  }
  const evs = await listHumanitixEvents();
  if (!evs.ok) return { ok: false, error: evs.error };
  const event = pickEvent(evs.data);
  if (!event) return { ok: false, error: "No Humanitix event found." };

  const id = encodeURIComponent(event.id);
  const [rawEvent, tickets, orders] = await Promise.all([
    humanitix<unknown>(`/events/${id}`),
    fetchAllPages(`/events/${id}/tickets`, "tickets"),
    fetchAllPages(`/events/${id}/orders`, "orders"),
  ]);
  if (!tickets.ok) return { ok: false, error: tickets.error };
  const evRec = rawEvent.ok ? rec(rawEvent.data) : null;
  const labels = evRec ? questionLabels(evRec) : new Map<string, string>();

  const orderById = new Map<string, Rec>();
  if (orders.ok) {
    for (const o of orders.data) {
      const oid = str(o, "_id", "id", "orderId");
      if (oid) orderById.set(oid, o);
    }
  }

  const parties = new Map<string, DoorParty>();
  for (const t of tickets.data) {
    if (isCancelled(str(t, "status"))) continue;
    const tid = str(t, "_id", "id", "ticketId");
    if (!tid) continue;
    const oid = str(t, "orderId", "order_id") ?? `solo-${tid}`;
    const order = orderById.get(oid) ?? null;
    const buyerRec = rec(order?.["buyer"]) ?? rec(order?.["customer"]) ?? rec(order?.["user"]);

    let party = parties.get(oid);
    if (!party) {
      const email = (
        str(order, "email", "buyerEmail", "customerEmail") ??
        str(buyerRec, "email") ??
        str(t, "email") ??
        ""
      ).toLowerCase();
      party = {
        orderId: oid,
        buyer: fullName(order) || fullName(buyerRec) || str(t, "orderName") || "",
        email,
        phone: phoneOf(order, buyerRec, t),
        tickets: [],
        orderAnswers: answersOf(order?.["additionalFields"], labels),
      };
      parties.set(oid, party);
    }

    const ticketType = str(t, "ticketTypeName", "ticketType") ?? "Ticket";
    const answers = answersOf(t["additionalFields"], labels);
    const shirt = shirtOf(answers);
    const ticket: DoorTicket = {
      id: tid,
      name: fullName(t) || party.buyer || "Guest",
      ticketType,
      shirt,
      perks: perksOf(ticketType, shirt),
      answers: answers.filter((a) => a.a !== shirt),
      codes: [...new Set([tid.toLowerCase(), oid.toLowerCase(), ...codesOf(t)])],
      hxChecked:
        t["checkedIn"] === true ||
        Boolean(str(t, "checkInDate", "checkinDate", "checkedInAt")) ||
        (Array.isArray(t["checkInHistory"]) && t["checkInHistory"].length > 0),
    };
    party.tickets.push(ticket);
    if (!party.buyer) party.buyer = ticket.name;
  }

  // A code on more than one ticket (other than the booking id) can't pick one out.
  const freq = new Map<string, number>();
  for (const p of parties.values()) {
    for (const t of p.tickets) for (const c of t.codes) freq.set(c, (freq.get(c) ?? 0) + 1);
  }
  for (const p of parties.values()) {
    const oid = p.orderId.toLowerCase();
    for (const t of p.tickets) t.codes = t.codes.filter((c) => c === oid || freq.get(c) === 1);
  }

  const first = tickets.data[0];
  const qr = first ? leaves(first["qrCodeData"]).join("|") : "";
  const firstOrder = orders.ok ? orders.data[0] : undefined;
  const diag = [
    `tickets ${tickets.data.length}, orders ${orders.ok ? orders.data.length : "failed"}`,
    `ticket keys: ${first ? Object.keys(first).join(", ") : "none"}`,
    `order keys: ${firstOrder ? Object.keys(firstOrder).join(", ") : "none"}`,
    `questions known: ${labels.size}`,
    `qr payload: ${typeof first?.["qrCodeData"]}, ${qr.length} chars, shape ${shape(qr).slice(0, 60)}`,
    `already checked in at Humanitix: ${[...parties.values()].reduce((n, p) => n + p.tickets.filter((t) => t.hxChecked).length, 0)}`,
  ];

  return {
    ok: true,
    data: {
      eventId: event.id,
      eventName: event.name,
      startDate: event.startDate,
      parties: [...parties.values()].sort((a, b) =>
        (a.tickets[0]?.name ?? a.buyer).localeCompare(b.tickets[0]?.name ?? b.buyer),
      ),
      fetchedAt: new Date().toISOString(),
      diag,
    },
  };
}

// Humanitix is paged and slow, and every phone polls: one shared copy per instance.
const ROSTER_TTL_MS = 45_000;
let cache: { at: number; data: DoorRoster } | null = null;
let inflight: Promise<Built> | null = null;

export async function getDoorRoster(force = false): Promise<Built> {
  if (!force && cache && Date.now() - cache.at < ROSTER_TTL_MS) {
    return { ok: true, data: cache.data };
  }
  inflight ??= buildRoster().finally(() => {
    inflight = null;
  });
  const res = await inflight;
  if (res.ok) cache = { at: Date.now(), data: res.data };
  else if (cache) return { ok: true, data: cache.data };
  return res;
}

// ------------------------------------------------------------------ check-ins

const MISSING_TABLE = /door_checkins|relation|schema cache|does not exist/i;

export async function getDoorState(eventId: string): Promise<DoorState> {
  const { data, error } = await getAdminSupabase()
    .from("door_checkins")
    .select("ticket_id, checked_in_at, checked_in_by")
    .eq("event_id", eventId)
    .limit(5000);
  if (error) {
    if (MISSING_TABLE.test(error.message)) return { checkins: {}, needsSetup: true };
    throw new Error(error.message);
  }
  const checkins: DoorState["checkins"] = {};
  for (const r of data ?? []) {
    checkins[r.ticket_id as string] = {
      at: r.checked_in_at as string,
      by: (r.checked_in_by as string | null) ?? null,
    };
  }
  return { checkins };
}

export async function setDoorCheckins(
  roster: DoorRoster,
  action: "in" | "undo",
  ticketIds: string[],
  by: string,
) {
  const orderOf = new Map<string, string>();
  for (const p of roster.parties) for (const t of p.tickets) orderOf.set(t.id, p.orderId);
  const ids = [...new Set(ticketIds)].filter((id) => orderOf.has(id));
  if (ids.length === 0) return;
  const db = getAdminSupabase();
  if (action === "in") {
    const { error } = await db.from("door_checkins").upsert(
      ids.map((id) => ({
        ticket_id: id,
        event_id: roster.eventId,
        order_id: orderOf.get(id),
        checked_in_by: by.slice(0, 40) || null,
      })),
      { onConflict: "ticket_id", ignoreDuplicates: true },
    );
    if (error) throw new Error(error.message);
  } else {
    const { error } = await db.from("door_checkins").delete().in("ticket_id", ids);
    if (error) throw new Error(error.message);
  }
}
