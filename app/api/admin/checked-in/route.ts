import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/cms-auth";
import { getDoorRoster, getDoorState } from "@/lib/door";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OWN_EMAILS = new Set(["will@tedxnewy.com.au"]);

function cell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().replace(/\s+/g, " ").split(" ");
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
}

/**
 * Everyone who was checked in on the day (door app or scanned at Humanitix) as
 * first name, last name, email. Guests carry their booking's email, since that
 * is the only address the roster holds. Exact duplicates are merged and the
 * team's own address is left out.
 */
export async function GET() {
  await requireAdmin({ readOnly: true });
  const roster = await getDoorRoster(true);
  if (!roster.ok) return new NextResponse(roster.error, { status: 502 });
  const state = await getDoorState(roster.data.eventId);

  const rows = new Map<string, string>();
  for (const party of roster.data.parties) {
    const email = (party.email ?? "").trim().toLowerCase();
    if (!email || OWN_EMAILS.has(email)) continue;
    for (const t of party.tickets) {
      if (!(t.hxChecked || state.checkins[t.id])) continue;
      const { first, last } = splitName(t.name || party.buyer || "");
      const key = `${first.toLowerCase()}|${last.toLowerCase()}|${email}`;
      if (!rows.has(key)) rows.set(key, [first, last, email].map(cell).join(","));
    }
  }
  const body = ["first_name,last_name,email", ...[...rows.values()].sort()].join("\r\n");
  return new NextResponse(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="signal-checked-in.csv"',
    },
  });
}
