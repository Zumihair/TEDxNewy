/**
 * Publishing layer for /admin/socials, via Buffer (buffer.com). Channels are
 * connected inside Buffer's own dashboard — an official API partner for
 * Instagram Business, Facebook Pages and LinkedIn Company Pages, so no OAuth
 * app or developer review of our own is needed (unlike LinkedIn directly).
 * This just reads Buffer's already-connected channel list and publishes
 * through Buffer's GraphQL API. Server-only: the API key must never reach
 * the browser.
 *
 * Env:
 *   BUFFER_API_KEY - a personal API key from
 *                    https://publish.buffer.com/settings/api
 */
import "server-only";
import type { ChannelId } from "@/app/admin/socials/shared";

const BUFFER_API_URL = "https://api.buffer.com";

export function bufferConfigured(): boolean {
  return Boolean(process.env.BUFFER_API_KEY);
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const apiKey = process.env.BUFFER_API_KEY;
  if (!apiKey) throw new Error("BUFFER_API_KEY is not set.");
  const res = await fetch(BUFFER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };
  if (!res.ok || (json.errors && json.errors.length > 0)) {
    throw new Error(json.errors?.[0]?.message ?? `Buffer API error (${res.status}).`);
  }
  if (!json.data) throw new Error("Buffer API returned no data.");
  return json.data;
}

// ---- channel sync ----

/** One Buffer channel of the same platform, offered when Buffer has more
 * than one connected and we can't guess which is TEDxNewy's. */
export type AccountCandidate = { id: string; name: string | null };

export type ChannelSyncResult =
  | { status: "resolved"; externalAccountId: string; externalAccountName: string | null }
  | { status: "needsPick"; candidates: AccountCandidate[] }
  | { status: "missing" };

export type SyncResult = Partial<Record<ChannelId, ChannelSyncResult>>;

const SERVICE_TO_CHANNEL: Record<string, ChannelId> = {
  instagram: "instagram",
  facebook: "facebook",
  linkedin: "linkedin",
};

/**
 * Fetches the Buffer organisation and its connected channels, and matches
 * each to instagram/facebook/linkedin by Buffer's `service` field. The exact
 * casing/spelling of `service` is per Buffer's docs (e.g. "instagram") but
 * unverified live — first real sync confirms it.
 */
export async function syncChannels(): Promise<SyncResult> {
  const org = await gql<{ account: { organizations: Array<{ id: string; name: string }> } }>(
    `query GetOrganizations { account { organizations { id name } } }`,
  );
  const organizationId = org.account.organizations[0]?.id;
  if (!organizationId) {
    throw new Error("No Buffer organisation found for this API key.");
  }

  const channelsRes = await gql<{
    channels: Array<{ id: string; name: string | null; service: string }>;
  }>(
    `query GetChannels($organizationId: OrganizationId!) {
      channels(input: { organizationId: $organizationId }) { id name service }
    }`,
    { organizationId },
  );

  const byChannel = new Map<ChannelId, AccountCandidate[]>();
  for (const ch of channelsRes.channels) {
    const mapped = SERVICE_TO_CHANNEL[ch.service.toLowerCase()];
    if (!mapped) continue;
    const list = byChannel.get(mapped) ?? [];
    list.push({ id: ch.id, name: ch.name });
    byChannel.set(mapped, list);
  }

  const result: SyncResult = {};
  for (const channel of Object.keys(SERVICE_TO_CHANNEL) as ChannelId[]) {
    const candidates = byChannel.get(channel) ?? [];
    if (candidates.length === 0) {
      result[channel] = { status: "missing" };
    } else if (candidates.length === 1) {
      result[channel] = {
        status: "resolved",
        externalAccountId: candidates[0].id,
        externalAccountName: candidates[0].name,
      };
    } else {
      result[channel] = { status: "needsPick", candidates };
    }
  }
  return result;
}

// ---- publishing ----

/** One piece of media to publish. `kind` picks which Buffer asset shape to
 *  build: the API's `assets` array takes exactly one of image/video/document/
 *  link per entry. */
export type PublishMedia = { url: string; kind: "image" | "video" };

export type PublishInput = {
  /** Buffer's own id for the channel being published to. */
  channelId: string;
  /** Which platform that id belongs to. Buffer needs per-network metadata
   *  on some services (Instagram, below), so the platform has to travel
   *  with the id rather than being inferred from it. */
  channel: ChannelId;
  caption: string;
  media: PublishMedia[];
};

export type PublishResult =
  | { ok: true; permalink: string | null }
  | { ok: false; error: string };

/**
 * Which KIND of post this is, per network.
 *
 * Every network Buffer publishes to requires one. Its metadata inputs each
 * implement `CommonPostMetadata`, whose `type` field is not optional, and
 * leaving it out fails the post at publish time rather than when the draft
 * is built: "Invalid post: Instagram posts require a type (post, story, or
 * reel)", and the same sentence with Facebook's name in it. Nothing about
 * that is visible in the editor, which is what made it look like a broken
 * publish button rather than a missing field.
 *
 * The answer follows the media, so there is nothing to ask a human and
 * nothing to store on the post:
 *
 *  - Instagram: a video is a Reel. Not a preference, it is how Instagram
 *    publishes video at all, and it is the rule `mediaAddError` already
 *    enforces up front (one video, never mixed with photos).
 *  - Facebook and LinkedIn: an ordinary feed post either way. Facebook does
 *    have Reels, but a Reel carries constraints nothing here enforces
 *    (vertical, length capped), so a landscape recap cut would be rejected
 *    as a Reel and is perfectly fine as a video post. LinkedIn has no Reels
 *    at all.
 *
 * Stories are deliberately never sent. Nothing in the admin models a post
 * that disappears after 24 hours: it would need its own lifecycle, and
 * "Posted" would stop meaning what it means everywhere else.
 */
function postTypeFor(channel: ChannelId, media: PublishMedia[]): string {
  if (channel === "instagram" && media.some((m) => m.kind === "video")) {
    return "reel";
  }
  return "post";
}

/**
 * Per-network extras, keyed by network. Our ChannelId values are already
 * Buffer's own service names, so the channel doubles as the metadata key.
 */
function metadataFor(
  channel: ChannelId,
  media: PublishMedia[],
): { metadata: Record<string, unknown> } {
  return { metadata: { [channel]: { type: postTypeFor(channel, media) } } };
}

/**
 * Publishes immediately (mode: shareNow). That is true of BOTH callers: the
 * "preview, then Yes post it now" confirm in the editor, and the cron, which
 * publishes a scheduled post when its time arrives. Buffer's own scheduling
 * (mode: customScheduled with a dueAt) is deliberately not used, so a post
 * exists in one place only and Unschedule never has to reach into Buffer to
 * cancel something. See lib/social-publish.ts.
 *
 * Whether `assets` accepts more than one image for a real multi-image post is
 * unverified until the first live multi-image test.
 *
 * **Buffer fetches the media URL when the post goes out, not when it is
 * created**, so every URL here has to be public, direct and permanent. Ours
 * are Supabase Storage `cms-uploads` URLs, which are anon-readable and stable;
 * don't switch them to signed or expiring links.
 *
 * Video sends `metadata.thumbnailOffset`, the millisecond mark Buffer grabs
 * the cover frame from. 0 would land on whatever the very first frame is,
 * often a black or blurred one, so it takes a frame a second in.
 */
export async function publish({
  channelId,
  channel,
  caption,
  media,
}: PublishInput): Promise<PublishResult> {
  // Instagram has no text-only post. Buffer would reject this anyway, but
  // its message talks about media containers; this one says what to do.
  if (channel === "instagram" && media.length === 0) {
    return {
      ok: false,
      error: "Instagram needs a photo or a video on the post. Add media, then publish.",
    };
  }
  try {
    const assets = media.map((m) =>
      m.kind === "video"
        ? { video: { url: m.url, metadata: { thumbnailOffset: 1000 } } }
        : { image: { url: m.url } },
    );
    const res = await gql<{
      createPost: { post: { id: string } } | { message: string };
    }>(
      `mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          ... on PostActionSuccess { post { id } }
          ... on MutationError { message }
        }
      }`,
      {
        input: {
          channelId,
          text: caption,
          mode: "shareNow",
          schedulingType: "automatic",
          ...(assets.length > 0 ? { assets } : {}),
          ...metadataFor(channel, media),
        },
      },
    );
    if ("message" in res.createPost) {
      return { ok: false, error: res.createPost.message };
    }
    // Buffer's PostActionSuccess doesn't document a permalink field; leave
    // null unless a follow-up query on the post id turns one up on test.
    return { ok: true, permalink: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Publish failed." };
  }
}
