/**
 * Minimal Humanitix client for the admin ticket dashboard.
 *
 * The Humanitix public API is read-only, so this module only ever reports:
 *  - the event list with capacity and ticket types;
 *  - per-event ticket stats (sold, by type, revenue, recent velocity);
 *  - the attendee list, for importing into event_attendees.
 *
 * Server-only: the key comes from HUMANITIX_API_KEY and must never reach the
 * client. Every function returns a soft failure ({ ok: false, error }) so the
 * admin UI can show what happened rather than 500ing. Humanitix response
 * shapes are not pinned by a published schema we control, so all parsing is
 * defensive: unknown in, best-effort numbers out.
 */
import "server-only";

const BASE = "https://api.humanitix.com/v1";
const PAGE_SIZE = 100;
// Plenty for TEDxNewy-sized events; stops a runaway loop if the API misreports.
const MAX_PAGES = 30;

export function humanitixConfigured(): boolean {
  return Boolean(process.env.HUMANITIX_API_KEY);
}

type HxResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function humanitix<T>(path: string): Promise<HxResult<T>> {
  const key = process.env.HUMANITIX_API_KEY;
  if (!key) {
    return { ok: false, error: "HUMANITIX_API_KEY is not set on this environment." };
  }
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "x-api-key": key, Accept: "application/json" },
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      const pick = (k: string): string | null => {
        if (json && typeof json === "object" && k in json) {
          const v = (json as Record<string, unknown>)[k];
          if (typeof v === "string" && v.length > 0) return v;
        }
        return null;
      };
      const msg =
        pick("message") ?? pick("error") ?? `Humanitix returned ${res.status}.`;
      return { ok: false, error: msg };
    }
    return { ok: true, data: json as T };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Humanitix request failed.",
    };
  }
}

// ------------------------------------------------------------ tolerant reads

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function str(r: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return null;
}

function num(r: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

/** The list payloads vary between {events: []}, {tickets: []}, {data: []}. */
function items(v: unknown, ...keys: string[]): Record<string, unknown>[] {
  const r = asRecord(v);
  if (!r) return [];
  for (const k of [...keys, "data"]) {
    const arr = r[k];
    if (Array.isArray(arr)) {
      return arr.map(asRecord).filter((x): x is Record<string, unknown> => !!x);
    }
  }
  return [];
}

async function fetchAllPages(
  pathBase: string,
  listKey: string,
): Promise<HxResult<Record<string, unknown>[]>> {
  const all: Record<string, unknown>[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const sep = pathBase.includes("?") ? "&" : "?";
    const res = await humanitix<unknown>(
      `${pathBase}${sep}page=${page}&pageSize=${PAGE_SIZE}`,
    );
    if (!res.ok) return res;
    const batch = items(res.data, listKey);
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }
  return { ok: true, data: all };
}

// ------------------------------------------------------------------- events

export type HxTicketType = {
  id: string | null;
  name: string;
  price: number | null;
  /** Total stock for this ticket type, null when Humanitix doesn't report one (e.g. unlimited). */
  quantity: number | null;
};

export type HxEvent = {
  id: string;
  name: string;
  /** URL slug, e.g. "tedxnewy-signal" in events.humanitix.com/tedxnewy-signal. */
  slug: string | null;
  startDate: string | null;
  endDate: string | null;
  capacity: number | null;
  ticketTypes: HxTicketType[];
};

/** The Humanitix slug from a ticket URL, or null if it isn't a Humanitix link. */
export function humanitixSlugFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!/(^|\.)humanitix\.com$/i.test(u.hostname)) return null;
    const seg = u.pathname.split("/").filter(Boolean)[0];
    return seg ? seg.toLowerCase() : null;
  } catch {
    return null;
  }
}

export async function listHumanitixEvents(): Promise<HxResult<HxEvent[]>> {
  const res = await fetchAllPages("/events?inFutureOnly=false", "events");
  if (!res.ok) return res;
  const events: HxEvent[] = [];
  for (const r of res.data) {
    const id = str(r, "_id", "id", "eventId");
    const name = str(r, "name", "title");
    if (!id || !name) continue;
    const types: HxTicketType[] = items(r["ticketTypes"], "ticketTypes").map(
      (t) => ({
        id: str(t, "_id", "id"),
        name: str(t, "name") ?? "Ticket",
        price: num(t, "price"),
        quantity: num(t, "quantity", "totalQuantity"),
      }),
    );
    // ticketTypes is usually a plain array on the event, not a wrapped list.
    if (types.length === 0 && Array.isArray(r["ticketTypes"])) {
      for (const raw of r["ticketTypes"] as unknown[]) {
        const t = asRecord(raw);
        if (!t) continue;
        types.push({
          id: str(t, "_id", "id"),
          name: str(t, "name") ?? "Ticket",
          price: num(t, "price"),
          quantity: num(t, "quantity", "totalQuantity"),
        });
      }
    }
    events.push({
      id,
      name,
      slug: str(r, "slug")?.toLowerCase() ?? null,
      startDate: str(r, "startDate", "startDateTime", "start"),
      endDate: str(r, "endDate", "endDateTime", "end"),
      capacity: num(r, "totalCapacity", "capacity"),
      ticketTypes: types,
    });
  }
  return { ok: true, data: events };
}

// ------------------------------------------------------------------ tickets

export type HxAttendee = {
  fullName: string;
  email: string;
  ticketType: string;
};

export type HxBuyerRecord = {
  email: string;
  createdAt: string | null;
  checkedIn: boolean;
};

/**
 * One complete ticket with whatever the checkout questions captured. Every
 * answer is optional: events differ in which questions they ask, and buyers
 * skip them. `beenBefore` is the "Have you been to a TEDxNewy event before?"
 * answer, `shirt` the t-shirt size as typed (used as a rough gender read).
 */
export type HxTicketProfile = {
  email: string;
  orderId: string | null;
  ticketType: string;
  postcode: string | null;
  beenBefore: boolean | null;
  shirt: string | null;
};

/**
 * Checkout answers live in an array of {question, value} objects whose key
 * and field names vary (additionalFields / additionalQuestions / questions /
 * customFields; question / label / name; value / answer / response). Walk the
 * ticket and its nested buyer/order records and return every pair found.
 */
function collectAnswers(t: Record<string, unknown>): { q: string; v: string }[] {
  const out: { q: string; v: string }[] = [];
  const seen = new Set<unknown>();
  const visit = (node: unknown, depth: number) => {
    if (depth > 3 || !node || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      for (const item of node) {
        const r = asRecord(item);
        if (!r) continue;
        const q = str(r, "question", "label", "name", "title", "key", "questionId");
        let v: string | null = str(r, "value", "answer", "response", "text");
        if (!v && typeof r["value"] === "number") v = String(r["value"]);
        if (!v && typeof r["value"] === "boolean") v = r["value"] ? "Yes" : "No";
        if (!v && Array.isArray(r["values"])) {
          v = (r["values"] as unknown[]).filter((x) => typeof x === "string").join(", ");
        }
        // Humanitix ticket payloads carry a questionId, not the question text,
        // so `q` is usually an opaque id. profileFor() classifies those by the
        // shape of the answer instead.
        if (v) out.push({ q: q ?? "", v });
        else visit(r, depth + 1);
      }
      return;
    }
    const r = node as Record<string, unknown>;
    for (const k of Object.keys(r)) {
      if (/field|question|answer|custom|buyer|order|data/i.test(k)) visit(r[k], depth + 1);
    }
  };
  visit(t, 0);
  return out;
}

function yesNo(v: string): boolean | null {
  if (/^\s*(yes|y|true)\b/i.test(v)) return true;
  if (/^\s*(no|n|false)\b/i.test(v)) return false;
  return null;
}

/**
 * Buyer-level facts from the orders endpoint, keyed by order id. Tickets
 * carry no email of their own and the once-per-order checkout questions
 * (postcode, been-before) sit on the order, so every per-ticket read joins
 * through here. Empty map when the orders call failed.
 */
type OrderIndex = Map<string, { email: string; answers: { q: string; v: string }[] }>;

function buildOrderIndex(orders: Record<string, unknown>[]): OrderIndex {
  const index: OrderIndex = new Map();
  for (const o of orders) {
    const id = str(o, "_id", "id", "orderId");
    if (!id) continue;
    const buyer = asRecord(o["buyer"]) ?? asRecord(o["customer"]) ?? asRecord(o["user"]);
    const email = (
      str(o, "email", "buyerEmail", "customerEmail") ??
      (buyer ? str(buyer, "email") : null) ??
      ""
    ).toLowerCase();
    index.set(id, { email, answers: collectAnswers(o) });
  }
  return index;
}

async function fetchOrderIndex(eventId: string): Promise<OrderIndex> {
  const res = await fetchAllPages(`/events/${encodeURIComponent(eventId)}/orders`, "orders");
  return res.ok ? buildOrderIndex(res.data) : new Map();
}

function ticketEmail(t: Record<string, unknown>, orders: OrderIndex): string {
  const own = str(t, "email", "buyerEmail")?.toLowerCase() ?? "";
  if (own.includes("@")) return own;
  const oid = str(t, "orderId", "order_id", "orderNumber");
  return (oid && orders.get(oid)?.email) || "";
}

function profileFor(
  t: Record<string, unknown>,
  email: string,
  ticketType: string,
  orderAnswers: { q: string; v: string }[] = [],
): HxTicketProfile {
  // Ticket-level answers first (per-person questions like shirt size), then
  // the order-level ones (asked once per checkout: postcode, been before).
  const answers = [...collectAnswers(t), ...orderAnswers];
  let postcode: string | null = null;
  let beenBefore: boolean | null = null;
  let shirt: string | null = null;
  for (const { q, v } of answers) {
    const byText = /post\s*code|postcode|zip|been to|attended|before|shirt|size/i.test(q);
    if (byText) {
      if (!postcode && /post\s*code|postcode|zip/i.test(q)) {
        const m = v.match(/\b(\d{4})\b/);
        if (m) postcode = m[1];
      } else if (beenBefore === null && /been to|attended|before/i.test(q)) {
        beenBefore = yesNo(v);
      } else if (!shirt && /shirt|size/i.test(q)) {
        shirt = v.trim();
      }
      continue;
    }
    // No readable question text: classify by what the answer looks like.
    const t = v.trim();
    if (!postcode && /^\s*(nsw\s*)?\d{4}\s*$/i.test(t)) {
      postcode = t.match(/\d{4}/)![0];
    } else if (beenBefore === null && /^(yes|no)\b/i.test(t)) {
      beenBefore = yesNo(t);
    } else if (!shirt && /^(ladies|womens|women's|mens|men's|unisex)\b/i.test(t)) {
      shirt = t;
    }
  }
  // Some exports flatten the questions onto the ticket itself.
  if (!postcode) {
    const m = (str(t, "postcode", "postCode", "zip") ?? "").match(/\b(\d{4})\b/);
    if (m) postcode = m[1];
  }
  return {
    email,
    orderId: str(t, "orderId", "order_id", "orderNumber"),
    ticketType,
    postcode,
    beenBefore,
    shirt,
  };
}

export type HxEventStats = {
  sold: number;
  cancelled: number;
  revenue: number;
  byType: { name: string; sold: number }[];
  /** Angel-type tickets sold (each funds a second seat). */
  angel: number;
  /** Complete tickets created in the last 7 / 28 days. */
  last7: number;
  last28: number;
  /** Tickets scanned at the door; 0 when the team didn't scan. */
  checkedIn: number;
  /** One record per complete ticket with an email, for audience analysis. */
  buyers: HxBuyerRecord[];
  /** Completed (non-cancelled) orders; 0 when the orders call failed. */
  orders: number;
  /** One profile per complete ticket, with the checkout answers we could read. */
  profiles: HxTicketProfile[];
  /**
   * Top-level keys of the first ticket payload. Only surfaced by the UI when no
   * checkout answers were found at all, so a shape change is diagnosable from
   * the dashboard rather than a log dive.
   */
  sampleKeys: string[];
};

function isCancelled(status: string | null): boolean {
  return status !== null && /cancel|refund|void/i.test(status);
}

async function fetchTickets(
  eventId: string,
): Promise<HxResult<Record<string, unknown>[]>> {
  return fetchAllPages(
    `/events/${encodeURIComponent(eventId)}/tickets`,
    "tickets",
  );
}

export async function getHumanitixEventStats(
  event: HxEvent,
): Promise<HxResult<HxEventStats>> {
  const res = await fetchTickets(event.id);
  if (!res.ok) return res;

  // Order count rides along for basket metrics (tickets per order, average
  // order value). A failed orders call degrades to 0 rather than failing the
  // whole stats read. Listing views/conversion are dashboard-only at
  // Humanitix; their public API does not expose them.
  let orderCount = 0;
  let orders: OrderIndex = new Map();
  const ordersRes = await fetchAllPages(
    `/events/${encodeURIComponent(event.id)}/orders`,
    "orders",
  );
  if (ordersRes.ok) {
    orderCount = ordersRes.data.filter(
      (o) => !isCancelled(str(o, "status", "financialStatus")),
    ).length;
    orders = buildOrderIndex(ordersRes.data);
  }

  const priceByType = new Map<string, number>();
  for (const t of event.ticketTypes) {
    if (t.price !== null) priceByType.set(t.name.toLowerCase(), t.price);
  }

  const byType = new Map<string, number>();
  let sold = 0;
  let cancelled = 0;
  let revenue = 0;
  let angel = 0;
  let last7 = 0;
  let last28 = 0;
  let checkedInCount = 0;
  const buyers: HxBuyerRecord[] = [];
  const profiles: HxTicketProfile[] = [];
  const first = res.data[0];
  const sampleKeys = first ? Object.keys(first) : [];
  // One raw additionalFields entry, trimmed, for the dashboard's empty state.
  if (first && Array.isArray(first["additionalFields"]) && first["additionalFields"].length > 0) {
    sampleKeys.push(
      `additionalFields[0]=${JSON.stringify(first["additionalFields"][0]).slice(0, 300)}`,
    );
  }
  const firstOrder = ordersRes.ok ? ordersRes.data[0] : undefined;
  if (firstOrder) {
    sampleKeys.push(`order keys: ${Object.keys(firstOrder).join(", ")}`);
    if (Array.isArray(firstOrder["additionalFields"]) && firstOrder["additionalFields"].length > 0) {
      sampleKeys.push(
        `order.additionalFields[0]=${JSON.stringify(firstOrder["additionalFields"][0]).slice(0, 300)}`,
      );
    }
  }
  const now = Date.now();

  for (const t of res.data) {
    const status = str(t, "status");
    if (isCancelled(status)) {
      cancelled++;
      continue;
    }
    sold++;
    const typeName = str(t, "ticketTypeName", "ticketType") ?? "Ticket";
    byType.set(typeName, (byType.get(typeName) ?? 0) + 1);
    if (/angel/i.test(typeName)) angel++;
    const price =
      num(t, "netPrice", "price", "totalPrice", "total") ??
      priceByType.get(typeName.toLowerCase()) ??
      0;
    revenue += price;
    const created = str(t, "createdAt", "created", "orderCreatedAt");
    if (created) {
      const age = now - Date.parse(created);
      if (Number.isFinite(age)) {
        if (age <= 7 * 86400_000) last7++;
        if (age <= 28 * 86400_000) last28++;
      }
    }
    const checkedIn =
      t["checkedIn"] === true ||
      Boolean(str(t, "checkInDate", "checkinDate", "checkedInAt"));
    if (checkedIn) checkedInCount++;
    const email = ticketEmail(t, orders);
    if (email.includes("@")) {
      buyers.push({ email, createdAt: created, checkedIn });
    }
    const oid = str(t, "orderId", "order_id", "orderNumber");
    profiles.push(profileFor(t, email, typeName, oid ? orders.get(oid)?.answers : []));
  }

  return {
    ok: true,
    data: {
      sold,
      cancelled,
      revenue,
      byType: [...byType.entries()]
        .map(([name, n]) => ({ name, sold: n }))
        .sort((a, b) => b.sold - a.sold),
      angel,
      last7,
      last28,
      checkedIn: checkedInCount,
      buyers,
      orders: orderCount,
      profiles,
      sampleKeys,
    },
  };
}

/** Complete (non-cancelled) tickets as importable attendees. */
export async function listHumanitixAttendees(
  eventId: string,
): Promise<HxResult<HxAttendee[]>> {
  const res = await fetchTickets(eventId);
  if (!res.ok) return res;
  // Tickets don't carry the buyer email; it's on the order.
  const orders = await fetchOrderIndex(eventId);
  const attendees: HxAttendee[] = [];
  for (const t of res.data) {
    if (isCancelled(str(t, "status"))) continue;
    const email = ticketEmail(t, orders);
    if (!email.includes("@")) continue;
    const first = str(t, "firstName") ?? "";
    const last = str(t, "lastName") ?? "";
    attendees.push({
      fullName: `${first} ${last}`.trim() || email,
      email,
      ticketType: str(t, "ticketTypeName", "ticketType") ?? "Ticket",
    });
  }
  return { ok: true, data: attendees };
}
