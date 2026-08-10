/**
 * Shared, data-only definitions for the Socials drafts log. Imported by both
 * server (pages, actions) and client (editor) code, so no JSX and no
 * server-only imports here.
 *
 * The whole feature is a MANUAL pipeline on purpose: drafts are prepared and
 * approved here, then posted by hand on each channel and marked as posted.
 * Nothing auto-publishes until a scheduler (Buffer, Composio or similar) is
 * connected.
 */

export type ChannelId = "instagram" | "facebook" | "linkedin";

export const CHANNELS: {
  id: ChannelId;
  label: string;
  /** Caption character limit enforced by the platform. */
  captionLimit: number;
  /** Where to go to post by hand. */
  postUrl: string;
}[] = [
  {
    id: "instagram",
    label: "Instagram",
    captionLimit: 2200,
    postUrl: "https://www.instagram.com/",
  },
  {
    id: "facebook",
    label: "Facebook",
    captionLimit: 63206,
    postUrl: "https://www.facebook.com/",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    captionLimit: 3000,
    postUrl: "https://www.linkedin.com/company/tedxnewy/",
  },
];

export type PostStatus = "draft" | "needs_changes" | "ready" | "posted";

export const STATUSES: {
  id: PostStatus;
  label: string;
  blurb: string;
}[] = [
  {
    id: "draft",
    label: "Draft",
    blurb: "Still being written or designed.",
  },
  {
    id: "needs_changes",
    label: "Changes needed",
    blurb: "Reviewed, and edits are required before it can go out.",
  },
  {
    id: "ready",
    label: "Ready to post",
    blurb: "Approved. Post it by hand on each channel, then mark it posted.",
  },
  {
    id: "posted",
    label: "Posted",
    blurb: "Published on its channels.",
  },
];

export function statusLabel(id: string): string {
  return STATUSES.find((s) => s.id === id)?.label ?? id;
}

/** Badge classes per status, matching the admin chrome. */
export const STATUS_CHIP: Record<PostStatus, string> = {
  draft: "bg-[#f59e0b]/15 text-[#a16207]",
  needs_changes: "bg-[#e02214]/10 text-[#b91404]",
  ready: "bg-[#3b82f6]/12 text-[#1e40af]",
  posted: "bg-[#22c55e]/15 text-[#15803d]",
};

export type SocialPostRow = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  title: string;
  caption: string;
  channel_captions: Partial<Record<ChannelId, string>>;
  channels: ChannelId[];
  status: PostStatus;
  status_note: string | null;
  publish_at: string | null;
  posted_at: string | null;
  posted_by: string | null;
  channel_results: Partial<Record<ChannelId, ChannelResult>>;
};

/** What happened the last time this post was published to a given channel. */
export type ChannelResult = {
  status: "posted" | "failed";
  permalink: string | null;
  postedAt: string;
  error: string | null;
};

/** The last publish result for a channel, if any. */
export function resultFor(
  post: SocialPostRow,
  channel: ChannelId,
): ChannelResult | null {
  return post.channel_results?.[channel] ?? null;
}

export type ConnectionStatus =
  | "disconnected"
  | "pending"
  | "needs_pick"
  | "connected"
  | "failed";

/** One Page/organisation the logged-in account manages, offered when a
 * personal login manages more than one and we can't guess which is TEDxNewy's. */
export type AccountCandidate = { id: string; name: string | null };

export type SocialConnectionRow = {
  channel: ChannelId;
  connected_account_id: string | null;
  external_account_id: string | null;
  external_account_name: string | null;
  status: ConnectionStatus;
  connected_at: string | null;
  connected_by: string | null;
  pending_candidates: AccountCandidate[] | null;
};

export type SocialMediaRow = {
  id: string;
  created_at: string;
  post_id: string;
  display_order: number;
  image_url: string;
  source_image_url: string | null;
  /** The Creative Studio PostSpec that produced image_url, if designed here. */
  spec: Record<string, unknown> | null;
};

/** The caption that should actually go out on a given channel. */
export function captionFor(post: SocialPostRow, channel: ChannelId): string {
  const override = post.channel_captions?.[channel];
  return (override && override.trim()) || post.caption;
}
