import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/cms-auth";
import { listArchivedTickets } from "@/lib/ticket-archive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** The archived tickets for an event as a CSV (our own copy, not Humanitix's). */
export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  await requireAdmin({ readOnly: true });
  const { eventId } = await params;
  const res = await listArchivedTickets(eventId);
  if (!res.ok) return new NextResponse(res.error, { status: 502 });
  const cols = [
    "ticket_id", "order_id", "email", "first_name", "last_name",
    "ticket_type", "status", "price", "checked_in", "purchased_at",
  ] as const;
  const body = [
    cols.join(","),
    ...res.rows.map((r) => cols.map((c) => cell((r as Record<string, unknown>)[c])).join(",")),
  ].join("\r\n");
  return new NextResponse(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="tickets-${eventId}.csv"`,
    },
  });
}
