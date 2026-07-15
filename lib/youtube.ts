/**
 * Thin YouTube Data API v3 client, just enough for stats.
 *
 * Uses `videos.list?part=statistics` in batched calls (up to 50 IDs per
 * request = 1 quota unit each). Total quota budget is 10,000/day, so even
 * with a full refresh every hour we'd consume ~24 units/day.
 *
 * No-op when YOUTUBE_API_KEY is unset — the site keeps working, the /admin
 * refresh button just returns a friendly "not configured" error.
 */

export type VideoStats = {
  youtubeId: string;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
};

export function youtubeApiKey(): string | null {
  return process.env.YOUTUBE_API_KEY?.trim() || null;
}

/**
 * Fetch statistics for the given YouTube video IDs. Deduplicated, batched
 * into groups of 50, and returned in a Map keyed by video id.
 *
 * A missing entry means YouTube didn't return that video (private, deleted,
 * wrong id). Callers should surface a fetch_error in the DB for those.
 */
export async function fetchVideoStats(
  ids: string[],
): Promise<Map<string, VideoStats>> {
  const apiKey = youtubeApiKey();
  if (!apiKey) throw new YouTubeConfigError("YOUTUBE_API_KEY not set");

  const unique = Array.from(new Set(ids.filter(Boolean)));
  const out = new Map<string, VideoStats>();
  if (unique.length === 0) return out;

  // YouTube caps `id` at 50 per call. Batch and issue in parallel.
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 50) chunks.push(unique.slice(i, i + 50));

  const responses = await Promise.all(
    chunks.map(async (chunk) => {
      const url = new URL("https://www.googleapis.com/youtube/v3/videos");
      url.searchParams.set("part", "statistics");
      url.searchParams.set("id", chunk.join(","));
      url.searchParams.set("key", apiKey);
      const res = await fetch(url.toString(), {
        // Server-only; never cached — we're the cache.
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "<no body>");
        throw new YouTubeApiError(res.status, body);
      }
      return res.json() as Promise<{
        items: Array<{
          id: string;
          statistics?: {
            viewCount?: string;
            likeCount?: string;
            commentCount?: string;
          };
        }>;
      }>;
    }),
  );

  for (const r of responses) {
    for (const item of r.items ?? []) {
      out.set(item.id, {
        youtubeId: item.id,
        viewCount: parseCount(item.statistics?.viewCount),
        likeCount: parseCount(item.statistics?.likeCount),
        commentCount: parseCount(item.statistics?.commentCount),
      });
    }
  }
  return out;
}

function parseCount(v: string | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export class YouTubeConfigError extends Error {}
export class YouTubeApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`YouTube API ${status}: ${body.slice(0, 300)}`);
  }
}

/**
 * Human-friendly formatter for view counts. 12,345 → "12.3k".
 */
export function formatCount(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 1 : 0)}M`;
  return `${(n / 1_000_000_000).toFixed(1)}B`;
}
