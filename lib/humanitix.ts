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
    const email = str(t, "email")?.toLowerCase() ?? "";
    if (email.includes("@")) {
      buyers.push({ email, createdAt: created, checkedIn });
    }
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
    },
  };
}

/** Complete (non-cancelled) tickets as importable attendees. */
export async function listHumanitixAttendees(
  eventId: string,
): Promise<HxResult<HxAttendee[]>> {
  const res = await fetchTickets(eventId);
  if (!res.ok) return res;
  const attendees: HxAttendee[] = [];
  for (const t of res.data) {
    if (isCancelled(str(t, "status"))) continue;
    const email = str(t, "email")?.toLowerCase() ?? "";
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
