import "server-only";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { fetchAllPages, listHumanitixEvents, humanitixMatches } from "@/lib/humanitix";

/**
 * Copies an event's tickets out of Humanitix into event_ticket_records, raw, so
 * the data is ours. Re-running refreshes the same rows (upsert on event + ticket).
 */

const rec = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const text = (r: Record<string, unknown>, ...keys: string[]): string | null => {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return null;
};

export async function archiveHumanitixTickets(
  event: { id: string; slug: string; title: string },
): Promise<{ archived: number; error?: string }> {
  const hx = await listHumanitixEvents();
  if (!hx.ok) return { archived: 0, error: hx.error };
  const match = hx.data.find((h) => humanitixMatches(event, h));
  if (!match) return { archived: 0, error: `No Humanitix listing matches "${event.title}".` };

  const base = `/events/${encodeURIComponent(match.id)}`;
  const tickets = await fetchAllPages(`${base}/tickets`, "tickets");
  if (!tickets.ok) return { archived: 0, error: tickets.error };
  const orders = await fetchAllPages(`${base}/orders`, "orders");
  const orderById = new Map<string, Record<string, unknown>>();
  if (orders.ok) {
    for (const o of orders.data) {
      const id = text(o, "_id", "id", "orderId");
      if (id) orderById.set(id, o);
    }
  }

  const rows = [];
  for (const t of tickets.data) {
    const ticketId = text(t, "_id", "id", "ticketId");
    if (!ticketId) continue;
    const orderId = text(t, "orderId", "order_id", "orderNumber");
    const order = orderId ? (orderById.get(orderId) ?? null) : null;
    const buyer = order ? (rec(order["buyer"]) ?? rec(order["customer"]) ?? rec(order["user"])) : null;
    const email = (
      text(t, "email", "buyerEmail") ??
      (order ? text(order, "email", "buyerEmail", "customerEmail") : null) ??
      (buyer ? text(buyer, "email") : null) ??
      ""
    ).toLowerCase();
    const price = [t["netPrice"], t["price"], t["totalPrice"]].find((v) => typeof v === "number");
    const created = text(t, "createdAt", "created", "orderCreatedAt");
    rows.push({
      event_id: event.id,
      ticket_id: ticketId,
      order_id: orderId,
      email: email || null,
      first_name: text(t, "firstName"),
      last_name: text(t, "lastName"),
      ticket_type: text(t, "ticketTypeName", "ticketType"),
      status: text(t, "status"),
      price: typeof price === "number" ? price : null,
      checked_in: t["checkedIn"] === true || Boolean(text(t, "checkInDate", "checkinDate", "checkedInAt")),
      purchased_at: created && Number.isFinite(Date.parse(created)) ? new Date(created).toISOString() : null,
      raw: t,
      order_raw: order,
      archived_at: new Date().toISOString(),
    });
  }

  const sb = getAdminSupabase();
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await sb
      .from("event_ticket_records")
      .upsert(rows.slice(i, i + 200), { onConflict: "event_id,ticket_id" });
    if (error) {
      const notSetUp = /event_ticket_records|relation|schema cache/i.test(error.message);
      return {
        archived: i,
        error: notSetUp
          ? "The ticket archive table doesn't exist yet. Run the 20261025e_ticket_archive.sql update first."
          : error.message,
      };
    }
  }
  return { archived: rows.length };
}

/** The archive as a flat list, for the CSV download. */
export async function listArchivedTickets(eventId: string) {
  const sb = getAdminSupabase();
  const { data, error } = await sb
    .from("event_ticket_records")
    .select("ticket_id, order_id, email, first_name, last_name, ticket_type, status, price, checked_in, purchased_at")
    .eq("event_id", eventId)
    .order("purchased_at", { ascending: true });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, rows: data ?? [] };
}
