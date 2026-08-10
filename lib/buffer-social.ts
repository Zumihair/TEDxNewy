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
    `query GetChannels($organizationId: String!) {
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

export type PublishInput = {
  channelId: string;
  caption: string;
  imageUrls: string[];
};

export type PublishResult =
  | { ok: true; permalink: string | null }
  | { ok: false; error: string };

/** Publishes immediately (mode: shareNow) — matches the existing "preview,
 * then Yes post it now" confirm flow; no scheduling introduced. Whether
 * `assets` accepts more than one image for a real multi-image post is
 * unverified until the first live multi-image test. */
export async function publish({
  channelId,
  caption,
  imageUrls,
}: PublishInput): Promise<PublishResult> {
  try {
    const assets = imageUrls.map((url) => ({ image: { url } }));
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
          ...(assets.length > 0 ? { assets } : {}),
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
