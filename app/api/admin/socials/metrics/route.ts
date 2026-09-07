import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/cms-auth";
import { bufferConfigured, getPostMetrics, type PostMetric } from "@/lib/buffer-social";
import type { ChannelId, SocialPostMetrics } from "@/app/admin/socials/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reactions/comments/shares/reach for a set of posted social_posts rows, off
 * Buffer's per-post metrics query. Split into its own route and fetched
 * client-side for the same reason as /api/admin/newsletter/reports: it's a
 * live third-party call, and the Posted list should render immediately from
 * the local Supabase query rather than block on it.
 */
export async function POST(req: NextRequest) {
  await requireAdmin();
  if (!bufferConfigured()) return NextResponse.json({});

  const body = (await req.json().catch(() => null)) as {
    items?: { id: string; bufferPostIds: Partial<Record<ChannelId, string>> }[];
  } | null;
  const items = body?.items ?? [];
  if (items.length === 0) return NextResponse.json({});

  const allIds = new Set<string>();
  for (const item of items) {
    for (const id of Object.values(item.bufferPostIds)) if (id) allIds.add(id);
  }
  const metricsById = await getPostMetrics([...allIds]);

  const sum = (metrics: PostMetric[], type: string): number =>
    metrics.find((m) => m.type === type)?.value ?? 0;
  const pick = (metrics: PostMetric[], type: string): number | null =>
    metrics.some((m) => m.type === type) ? sum(metrics, type) : null;

  const out: Record<string, SocialPostMetrics> = {};
  for (const item of items) {
    const acc: SocialPostMetrics = {
      reactions: 0,
      comments: 0,
      shares: 0,
      reach: null,
      impressions: null,
      channels: [],
    };
    let sawAny = false;
    for (const [channel, bufferPostId] of Object.entries(item.bufferPostIds) as [
      ChannelId,
      string,
    ][]) {
      const metrics = bufferPostId ? metricsById.get(bufferPostId) : undefined;
      // No entry means "not fetched yet / not available", not "zero" — skip
      // rather than let it drag the total down to nothing.
      if (!metrics) continue;
      sawAny = true;
      acc.channels.push(channel);
      acc.reactions += sum(metrics, "reactions");
      acc.comments += sum(metrics, "comments");
      acc.shares += sum(metrics, "shares");
      const reach = pick(metrics, "reach");
      const impressions = pick(metrics, "impressions");
      if (reach !== null) acc.reach = (acc.reach ?? 0) + reach;
      if (impressions !== null) acc.impressions = (acc.impressions ?? 0) + impressions;
    }
    if (sawAny) out[item.id] = acc;
  }
  return NextResponse.json(out);
}
