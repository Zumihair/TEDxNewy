import { NextResponse, type NextRequest } from "next/server";
import { syncTicketHolderSegment } from "@/lib/mailchimp";
import { fetchTicketPurchaserEmails } from "@/lib/segment-audiences";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Daily: keep Mailchimp's "Ticket holders" segment in step with Humanitix.
 * New buyers are added to the audience and segment, refunded or cancelled
 * tickets are taken out of the segment. Reads Humanitix live (not the
 * 5 minute cache). Same CRON_SECRET auth as the newsletter cron.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const emails = await fetchTicketPurchaserEmails();
    const result = await syncTicketHolderSegment(emails);
    return NextResponse.json({ ok: true, ticketHolders: emails.length, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err).slice(0, 500) }, { status: 500 });
  }
}
