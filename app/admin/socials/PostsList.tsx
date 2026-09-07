"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarClock, Copy, History, ImageIcon, Loader2 } from "lucide-react";
import { Card } from "../ui";
import { PendingIconButton } from "../PendingButtons";
import { asStage, groupByStage, stageLabel, STAGE_CHIP } from "../stages";
import StageHeading from "../StageHeading";
import { backfillBufferPostIds, duplicatePost } from "./actions";
import RowPreviewButton from "./RowPreviewButton";
import DeleteDraftButton from "./DeleteDraftButton";
import { useToast } from "../Toaster";
import {
  bufferPostIdsFor,
  CHANNELS,
  isVideoPost,
  mediaUrls,
  needsBufferBackfill,
  STATUS_CHIP,
  statusLabel,
  type ChannelId,
  type PostStatus,
  type SocialPostMetrics,
  type SocialPostWithMedia,
} from "./shared";

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Australia/Sydney",
  });
}

function channelLabels(ids: ChannelId[]): string {
  return ids
    .map((id) => CHANNELS.find((c) => c.id === id)?.label ?? id)
    .join(" + ");
}

/** Reactions / comments / shares / reach for one posted post, off Buffer's
 *  per-post metrics. Same 4-cell shape as the newsletter Sent tab's
 *  ResultsStrip (CampaignsList.tsx), reach standing in for opens/clicks. */
function ResultsStrip({ m }: { m: SocialPostMetrics }) {
  const cell = (label: string, value: string, sub: string) => (
    <div className="min-w-0">
      <div
        className="font-mono text-[9.5px] font-semibold uppercase text-[#6b6459]"
        style={{ letterSpacing: "0.18em" }}
      >
        {label}
      </div>
      <div className="mt-0.5 font-sans text-[16px] font-medium leading-none tabular-nums text-[#141210]">
        {value}
      </div>
      <div className="mt-0.5 text-[11.5px] text-[#6b6459]">{sub}</div>
    </div>
  );
  const reachOrImpressions =
    m.reach !== null
      ? { label: "Reach", value: m.reach }
      : m.impressions !== null
        ? { label: "Impressions", value: m.impressions }
        : null;
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 rounded-[var(--radius-sm)] bg-[#f9f5ec] px-4 py-3 sm:grid-cols-4">
      {cell("Reactions", m.reactions.toLocaleString(), "likes and similar")}
      {cell("Comments", m.comments.toLocaleString(), "replies on the post")}
      {cell("Shares", m.shares.toLocaleString(), "reposts and shares")}
      {reachOrImpressions
        ? cell(
            reachOrImpressions.label,
            reachOrImpressions.value.toLocaleString(),
            "accounts reached",
          )
        : cell("Channels", channelLabels(m.channels), "reporting metrics")}
    </div>
  );
}

/** Placeholder shown while a post's metrics are still loading. */
function ResultsStripSkeleton() {
  return (
    <div className="mt-3 flex animate-pulse items-center gap-2 rounded-[var(--radius-sm)] bg-[#f9f5ec] px-4 py-3">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-[rgba(20,18,16,0.15)] border-t-[#6b6459]" />
      <span className="text-[11.5px] text-[#6b6459]">Loading post metrics…</span>
    </div>
  );
}

/**
 * The row list for /admin/socials. A client component, same reason as
 * CampaignsList.tsx on the newsletter side: the Posted tab's Buffer metrics
 * fetch is a live third-party call, so it happens after the list is already
 * on screen instead of blocking the page behind it.
 */
export default function PostsList({
  rows,
  tab,
  grouped,
  bufferOn,
}: {
  rows: SocialPostWithMedia[];
  tab: "drafts" | "scheduled" | "posted";
  grouped: boolean;
  /** Whether BUFFER_API_KEY is set at all; metrics can't exist without it. */
  bufferOn: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const postsWithBufferIds = rows
    .map((p) => ({ id: p.id, bufferPostIds: bufferPostIdsFor(p) }))
    .filter((p) => Object.keys(p.bufferPostIds).length > 0);
  const wantsMetrics = tab === "posted" && bufferOn && postsWithBufferIds.length > 0;
  const [metricsFor, setMetricsFor] = useState<Map<string, SocialPostMetrics>>(
    new Map(),
  );
  const [loadingMetrics, setLoadingMetrics] = useState(wantsMetrics);
  const [backfilling, setBackfilling] = useState(false);
  const backfillCandidates = tab === "posted" && bufferOn && rows.some(needsBufferBackfill);

  const handleBackfill = async () => {
    setBackfilling(true);
    try {
      const res = await backfillBufferPostIds();
      if (!res.ok) throw new Error(res.error);
      const { matched, skipped } = res;
      if (matched > 0 && skipped.length === 0) {
        toast.success(
          `Matched ${matched} post${matched === 1 ? "" : "s"} to their Buffer history.`,
        );
      } else if (matched > 0) {
        toast.warning(
          <div className="space-y-1">
            <div>
              Matched {matched} post{matched === 1 ? "" : "s"}. {skipped.length}{" "}
              couldn&rsquo;t be matched confidently:
            </div>
            {skipped.map((s, i) => (
              <div key={i} className="text-[12px] opacity-80">
                {s.title} ({s.channel}): {s.reason}
              </div>
            ))}
          </div>,
          12000,
        );
      } else {
        toast.warning(
          <div className="space-y-1">
            <div>No posts could be matched confidently.</div>
            {skipped.map((s, i) => (
              <div key={i} className="text-[12px] opacity-80">
                {s.title} ({s.channel}): {s.reason}
              </div>
            ))}
          </div>,
          12000,
        );
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Backfill failed.");
    } finally {
      setBackfilling(false);
    }
  };

  useEffect(() => {
    if (!wantsMetrics) {
      setLoadingMetrics(false);
      return;
    }
    let cancelled = false;
    setLoadingMetrics(true);
    fetch("/api/admin/socials/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: postsWithBufferIds }),
    })
      .then((res) => (res.ok ? res.json() : {}))
      .then((json: Record<string, SocialPostMetrics>) => {
        if (cancelled) return;
        setMetricsFor(new Map(Object.entries(json)));
      })
      .catch(() => {
        // Metrics just don't show; the rest of the list is unaffected.
      })
      .finally(() => {
        if (!cancelled) setLoadingMetrics(false);
      });
    return () => {
      cancelled = true;
    };
    // rows only changes when the tab/query changes, which is what should
    // re-trigger the fetch (same pattern as CampaignsList.tsx).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, bufferOn]);

  const renderRow = (p: SocialPostWithMedia) => {
    const media = mediaUrls(p);
    const stage = asStage(p.stage);
    const planned = fmtDate(p.publish_at);
    const posted = fmtDate(p.posted_at);
    const hasBufferIds = Object.keys(bufferPostIdsFor(p)).length > 0;
    // A channel_results entry with status "posted" means Buffer actually
    // sent this one (lib/social-publish.ts writes it on every publish); the
    // manual "Mark as posted" path (setStatus in actions.ts) never touches
    // channel_results at all. So a Buffer-published post from before this
    // feature existed (no bufferPostId captured yet) still reads as
    // "went via Buffer", just with metrics not available, rather than the
    // wrong claim that it was posted by hand.
    const wentViaBuffer = (p.channels ?? []).some(
      (c) => p.channel_results?.[c]?.status === "posted",
    );
    const metrics = metricsFor.get(p.id);
    return (
      <li key={p.id}>
        <Card className="flex items-center gap-3 p-4 pr-3 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <Link
            href={`/admin/socials/${p.id}`}
            className="flex min-w-0 flex-1 items-center gap-5"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[10px] border border-[rgba(20,18,16,0.08)] bg-[#1a1714]">
              {media[0] && isVideoPost(p) ? (
                // An <img> pointed at an .mp4 renders nothing, so a video row
                // gets a real (muted, inert) frame.
                <video
                  src={media[0]}
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : media[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media[0]}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/35">
                  <ImageIcon className="h-6 w-6" strokeWidth={1.5} />
                </div>
              )}
              {(media.length > 1 || isVideoPost(p)) && (
                <span className="absolute bottom-1 right-1 rounded-md bg-black/65 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                  {isVideoPost(p) ? "Video" : media.length}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="truncate font-sans text-[15.5px] font-medium tracking-[-0.01em] text-[#141210]">
                  {p.title}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase ${STATUS_CHIP[p.status as PostStatus] ?? ""}`}
                  style={{ letterSpacing: "0.18em" }}
                >
                  {statusLabel(p.status)}
                </span>
                {p.status === "draft" && !grouped && (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase ${STAGE_CHIP[stage]}`}
                    style={{ letterSpacing: "0.18em" }}
                  >
                    {stageLabel(stage, "social")}
                  </span>
                )}
              </div>
              {p.caption && (
                <p className="mt-1 line-clamp-1 text-[13px] text-[#6b6459]">
                  {p.caption}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#6b6459]">
                <span>
                  {p.channels.length
                    ? p.channels
                        .map((c) => CHANNELS.find((x) => x.id === c)?.label ?? c)
                        .join(" · ")
                    : "No channels picked"}
                </span>
                {posted ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" strokeWidth={2} />
                    Posted {posted}
                  </span>
                ) : planned ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" strokeWidth={2} />
                    Scheduled for {planned}
                  </span>
                ) : null}
              </div>
              {p.status_note && (
                <p className="mt-1.5 line-clamp-1 text-[12.5px] text-[#6b6459]">
                  {p.status_note}
                </p>
              )}
              {tab === "posted" &&
                bufferOn &&
                (hasBufferIds ? (
                  loadingMetrics ? (
                    <ResultsStripSkeleton />
                  ) : metrics ? (
                    <ResultsStrip m={metrics} />
                  ) : (
                    <div className="mt-2 text-[11.5px] text-[#8a8278]">
                      Metrics not available for this post yet. Buffer can take
                      up to a day to report them.
                    </div>
                  )
                ) : wentViaBuffer ? (
                  <div className="mt-2 text-[11.5px] text-[#8a8278]">
                    Posted before metrics tracking was added, so there&rsquo;s
                    no history for it yet. Try &ldquo;Backfill from
                    Buffer&rdquo; above, or posts from now on will pick it up
                    on their own.
                  </div>
                ) : (
                  <div className="mt-2 text-[11.5px] text-[#8a8278]">
                    Posted manually, so there&rsquo;s no Buffer metrics for it.
                  </div>
                ))}
            </div>
          </Link>
          <div className="flex shrink-0 items-center">
            <RowPreviewButton
              channels={p.channels ?? []}
              caption={p.caption ?? ""}
              channelCaptions={
                (p.channel_captions ?? {}) as Partial<Record<ChannelId, string>>
              }
              media={media}
              isVideo={isVideoPost(p)}
            />
            <form action={duplicatePost}>
              <input type="hidden" name="id" value={p.id} />
              <PendingIconButton
                ariaLabel={`Duplicate ${p.title}`}
                title="Duplicate to drafts"
              >
                <Copy className="h-4 w-4" strokeWidth={2.25} />
              </PendingIconButton>
            </form>
            <DeleteDraftButton id={p.id} title={p.title} />
          </div>
        </Card>
      </li>
    );
  };

  const backfillBanner = backfillCandidates && (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[rgba(20,18,16,0.10)] bg-[#f9f5ec] px-4 py-3">
      <p className="max-w-[60ch] text-[12.5px] leading-[1.5] text-[#6b6459]">
        Some of these went out through Buffer before metrics tracking
        existed, so they&rsquo;re missing what&rsquo;s needed to fetch their
        numbers. Buffer keeps its own history of what it sent, so this can
        look for a match.
      </p>
      <button
        type="button"
        onClick={handleBackfill}
        disabled={backfilling}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3.5 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {backfilling ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
        ) : (
          <History className="h-3.5 w-3.5" strokeWidth={2.25} />
        )}
        {backfilling ? "Matching against Buffer…" : "Backfill from Buffer"}
      </button>
    </div>
  );

  if (grouped) {
    return (
      <div className="space-y-7">
        {backfillBanner}
        {groupByStage(rows, (p) => p.stage).map((g) => (
          <div key={g.stage}>
            <StageHeading stage={g.stage} kind="social" count={g.rows.length} />
            <ul className="mt-3 space-y-3">{g.rows.map(renderRow)}</ul>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {backfillBanner}
      <ul className="space-y-3">{rows.map(renderRow)}</ul>
    </div>
  );
}
