/**
 * Publishing layer for /admin/socials, via Composio's TEDxNewy-only account
 * (a separate Composio project from any other business's — see
 * COMPOSIO_API_KEY below). Server-only: the API key must never reach the
 * browser.
 *
 * Composio-managed OAuth is used for all three toolkits (no separate Meta or
 * LinkedIn developer app to register): startConnection() finds or creates an
 * auth config and returns a hosted OAuth link for Will to complete while
 * logged into TEDxNewy's own Instagram/Facebook/LinkedIn.
 *
 * Env:
 *   COMPOSIO_API_KEY - from the TEDxNewy Composio project's dashboard.
 */
import "server-only";
import { Composio, ConnectedAccountStatuses } from "@composio/core";
import type { ChannelId } from "@/app/admin/socials/shared";

const COMPOSIO_USER_ID = "tedxnewy";

let client: Composio | null = null;

export function composioConfigured(): boolean {
  return Boolean(process.env.COMPOSIO_API_KEY);
}

function getComposio(): Composio {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) throw new Error("COMPOSIO_API_KEY is not set.");
  if (!client) client = new Composio({ apiKey });
  return client;
}

function toMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

// ---- connecting an account ----

export type StartConnectionResult = {
  connectedAccountId: string;
  redirectUrl: string | null;
};

/** Finds or creates a Composio-managed auth config for the toolkit, then
 * returns a hosted OAuth link. `allowMultiple` because reconnecting after an
 * expired/revoked token would otherwise throw on the still-listed old one. */
export async function startConnection(
  channel: ChannelId,
): Promise<StartConnectionResult> {
  const composio = getComposio();
  const existing = await composio.authConfigs.list({ toolkit: channel });
  let authConfigId = existing.items[0]?.id;
  if (!authConfigId) {
    const created = await composio.authConfigs.create(channel);
    authConfigId = created.id;
  }
  const request = await composio.connectedAccounts.link(
    COMPOSIO_USER_ID,
    authConfigId,
    { allowMultiple: true },
  );
  return {
    connectedAccountId: request.id,
    redirectUrl: request.redirectUrl ?? null,
  };
}

export type LiveConnectionStatus = "pending" | "connected" | "failed";

export async function getConnectionStatus(
  connectedAccountId: string,
): Promise<LiveConnectionStatus> {
  const composio = getComposio();
  const account = await composio.connectedAccounts.get(connectedAccountId);
  if (account.status === ConnectedAccountStatuses.ACTIVE) return "connected";
  if (
    account.status === ConnectedAccountStatuses.FAILED ||
    account.status === ConnectedAccountStatuses.EXPIRED ||
    account.status === ConnectedAccountStatuses.REVOKED
  ) {
    return "failed";
  }
  return "pending";
}

export type FinalizedAccount = {
  externalAccountId: string;
  externalAccountName: string | null;
};

/**
 * Once a connection is Active, resolve the platform-specific id needed at
 * publish time. Field paths here follow Composio's documented plan for each
 * toolkit; first real connect (see task: end-to-end test) is what confirms
 * them against live responses.
 */
export async function finalizeConnection(
  channel: ChannelId,
  connectedAccountId: string,
): Promise<FinalizedAccount> {
  const composio = getComposio();
  const exec = (slug: string, args: Record<string, unknown> = {}) =>
    composio.tools.execute(slug, {
      userId: COMPOSIO_USER_ID,
      connectedAccountId,
      arguments: args,
      dangerouslySkipVersionCheck: true,
    });

  if (channel === "instagram") {
    const res = await exec("INSTAGRAM_GET_USER_INFO", { ig_user_id: "me" });
    const data = res.data as Record<string, unknown>;
    const id = String(data.id ?? data.user_id ?? "");
    if (!res.successful || !id) {
      throw new Error(
        toMessage(res.error, "Could not resolve the Instagram business account."),
      );
    }
    const username = typeof data.username === "string" ? data.username : null;
    return {
      externalAccountId: id,
      externalAccountName: username ? `@${username}` : null,
    };
  }

  if (channel === "facebook") {
    const res = await exec("FACEBOOK_LIST_MANAGED_PAGES", {});
    const data = res.data as Record<string, unknown>;
    const pages = (data.data ?? data.pages ?? []) as Array<Record<string, unknown>>;
    const page = pages[0];
    if (!res.successful || !page) {
      throw new Error(
        toMessage(res.error, "No Facebook Page found for this login."),
      );
    }
    return {
      externalAccountId: String(page.id),
      externalAccountName: typeof page.name === "string" ? page.name : null,
    };
  }

  // linkedin
  const res = await exec("LINKEDIN_GET_COMPANY_INFO", {});
  const data = res.data as Record<string, unknown>;
  const orgs = (data.elements ?? data.data ?? []) as Array<Record<string, unknown>>;
  const org = orgs[0];
  if (!res.successful || !org) {
    throw new Error(
      toMessage(res.error, "No LinkedIn organisation found for this login."),
    );
  }
  const rawUrn =
    (typeof org.organization === "string" && org.organization) ||
    (typeof org.organizationalTarget === "string" && org.organizationalTarget) ||
    String(org.id ?? "");
  if (!rawUrn) throw new Error("Could not resolve the LinkedIn organisation.");
  const externalAccountId = rawUrn.startsWith("urn:")
    ? rawUrn
    : `urn:li:organization:${rawUrn}`;
  const name =
    typeof org.localizedName === "string"
      ? org.localizedName
      : typeof org.vanityName === "string"
        ? org.vanityName
        : null;
  return { externalAccountId, externalAccountName: name };
}

// ---- publishing ----

export type PublishInput = {
  connectedAccountId: string;
  externalAccountId: string;
  caption: string;
  imageUrls: string[];
};

export type PublishResult =
  | { ok: true; permalink: string | null }
  | { ok: false; error: string };

export async function publish(
  channel: ChannelId,
  input: PublishInput,
): Promise<PublishResult> {
  try {
    if (channel === "instagram") return await publishInstagram(input);
    if (channel === "facebook") return await publishFacebook(input);
    return await publishLinkedIn(input);
  } catch (err) {
    return { ok: false, error: toMessage(err, "Publish failed.") };
  }
}

async function publishInstagram({
  connectedAccountId,
  externalAccountId,
  caption,
  imageUrls,
}: PublishInput): Promise<PublishResult> {
  if (imageUrls.length === 0) {
    return { ok: false, error: "Add at least one image before publishing." };
  }
  const composio = getComposio();
  const exec = (slug: string, args: Record<string, unknown>) =>
    composio.tools.execute(slug, {
      userId: COMPOSIO_USER_ID,
      connectedAccountId,
      arguments: args,
      dangerouslySkipVersionCheck: true,
    });

  let creationId: string;
  if (imageUrls.length === 1) {
    const res = await exec("INSTAGRAM_POST_IG_USER_MEDIA", {
      ig_user_id: externalAccountId,
      image_url: imageUrls[0],
      caption,
    });
    if (!res.successful) {
      return {
        ok: false,
        error: toMessage(res.error, "Could not prepare the Instagram post."),
      };
    }
    creationId = String((res.data as Record<string, unknown>).id ?? "");
  } else {
    const childIds: string[] = [];
    for (const url of imageUrls.slice(0, 10)) {
      const child = await exec("INSTAGRAM_POST_IG_USER_MEDIA", {
        ig_user_id: externalAccountId,
        image_url: url,
        is_carousel_item: true,
      });
      if (!child.successful) {
        return {
          ok: false,
          error: toMessage(
            child.error,
            "Could not prepare one of the carousel images.",
          ),
        };
      }
      childIds.push(String((child.data as Record<string, unknown>).id ?? ""));
    }
    const carousel = await exec("INSTAGRAM_CREATE_CAROUSEL_CONTAINER", {
      ig_user_id: externalAccountId,
      caption,
      children: childIds,
    });
    if (!carousel.successful) {
      return {
        ok: false,
        error: toMessage(carousel.error, "Could not assemble the carousel."),
      };
    }
    creationId = String((carousel.data as Record<string, unknown>).id ?? "");
  }
  if (!creationId) {
    return { ok: false, error: "Instagram did not return a container id." };
  }

  const published = await exec("INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH", {
    ig_user_id: externalAccountId,
    creation_id: creationId,
  });
  if (!published.successful) {
    return {
      ok: false,
      error: toMessage(published.error, "Instagram publish failed."),
    };
  }
  const mediaId = String((published.data as Record<string, unknown>).id ?? "");

  let permalink: string | null = null;
  if (mediaId) {
    try {
      const details = await exec("INSTAGRAM_GET_IG_MEDIA", {
        ig_media_id: mediaId,
        fields: "permalink",
      });
      const link = (details.data as Record<string, unknown> | undefined)
        ?.permalink;
      if (typeof link === "string") permalink = link;
    } catch {
      // Best-effort only: the post is live either way.
    }
  }
  return { ok: true, permalink };
}

async function publishFacebook({
  connectedAccountId,
  externalAccountId,
  caption,
  imageUrls,
}: PublishInput): Promise<PublishResult> {
  if (imageUrls.length === 0) {
    return { ok: false, error: "Add at least one image before publishing." };
  }
  // FACEBOOK_CREATE_PHOTO_POST is single-photo only; a carousel/multi-photo
  // post would need a different, unbuilt flow. Known v1 limitation.
  const composio = getComposio();
  const res = await composio.tools.execute("FACEBOOK_CREATE_PHOTO_POST", {
    userId: COMPOSIO_USER_ID,
    connectedAccountId,
    arguments: {
      page_id: externalAccountId,
      url: imageUrls[0],
      message: caption,
    },
    dangerouslySkipVersionCheck: true,
  });
  if (!res.successful) {
    return { ok: false, error: toMessage(res.error, "Facebook publish failed.") };
  }
  const data = res.data as Record<string, unknown>;
  const postId =
    typeof data.post_id === "string"
      ? data.post_id
      : typeof data.id === "string"
        ? data.id
        : null;
  return { ok: true, permalink: postId ? `https://www.facebook.com/${postId}` : null };
}

async function publishLinkedIn({
  connectedAccountId,
  externalAccountId,
  caption,
  imageUrls,
}: PublishInput): Promise<PublishResult> {
  const composio = getComposio();
  // LinkedIn's `images` field takes Composio-hosted file references, not raw
  // URLs (unlike Instagram/Facebook) — route each image through Composio's
  // own file store first.
  let images:
    | Array<{ name: string; mimetype: string; s3key: string }>
    | undefined;
  if (imageUrls.length > 0) {
    images = await Promise.all(
      imageUrls.slice(0, 20).map((url) =>
        composio.files.upload({
          file: url,
          toolSlug: "LINKEDIN_CREATE_LINKED_IN_POST",
          toolkitSlug: "linkedin",
        }),
      ),
    );
  }

  const res = await composio.tools.execute("LINKEDIN_CREATE_LINKED_IN_POST", {
    userId: COMPOSIO_USER_ID,
    connectedAccountId,
    arguments: {
      author: externalAccountId,
      commentary: caption,
      ...(images ? { images } : {}),
    },
    dangerouslySkipVersionCheck: true,
  });
  if (!res.successful) {
    return { ok: false, error: toMessage(res.error, "LinkedIn publish failed.") };
  }
  const data = res.data as Record<string, unknown>;
  const id =
    typeof data.id === "string"
      ? data.id
      : typeof data.x_restli_id === "string"
        ? data.x_restli_id
        : null;
  return {
    ok: true,
    permalink: id ? `https://www.linkedin.com/feed/update/${encodeURIComponent(id)}` : null,
  };
}
