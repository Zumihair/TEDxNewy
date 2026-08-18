import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import {
  listRecentCampaigns,
  mailchimpConfigured,
  type CampaignReport,
} from "@/lib/mailchimp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Opens/clicks for a set of sent newsletters, off the Mailchimp API.
 *
 * Split out of the campaigns list page so the Sent tab can render
 * immediately from the (fast, local) newsletters query and fetch this
 * separately client-side: `listRecentCampaigns` is a live Mailchimp call
 * and was previously awaited server-side before the page could render at
 * all, which made switching to Sent look hung rather than loading.
 */
export async function POST(req: NextRequest) {
  await requireAdmin();
  if (!mailchimpConfigured()) return NextResponse.json({});

  const body = (await req.json().catch(() => null)) as {
    items?: { id: string; sendBatchId: string | null; subject: string | null }[];
  } | null;
  const items = body?.items ?? [];
  if (items.length === 0) return NextResponse.json({});

  const supabase = await getServerSupabase();
  const batchIds = items
    .map((i) => i.sendBatchId)
    .filter((b): b is string => Boolean(b));

  const [reports, { data: sends }] = await Promise.all([
    listRecentCampaigns(50),
    batchIds.length > 0
      ? supabase
          .from("email_sends")
          .select("batch_id, resend_id")
          .in("batch_id", batchIds)
      : Promise.resolve({ data: [] as { batch_id: string; resend_id: string | null }[] }),
  ]);

  const campaignByBatch = new Map<string, string>();
  for (const s of (sends ?? []) as { batch_id: string; resend_id: string | null }[]) {
    if (s.resend_id) campaignByBatch.set(s.batch_id, s.resend_id);
  }
  const byId = new Map(reports.map((r) => [r.id, r]));
  const bySubject = new Map(reports.map((r) => [r.subject.trim(), r]));

  const out: Record<string, CampaignReport> = {};
  for (const it of items) {
    const cid = it.sendBatchId ? campaignByBatch.get(it.sendBatchId) : undefined;
    const hit =
      (cid && byId.get(cid)) ||
      (it.subject ? bySubject.get(it.subject.trim()) : undefined);
    if (hit) out[it.id] = hit;
  }
  return NextResponse.json(out);
}
