/**
 * Shared, data-only definitions for the Socials drafts log. Imported by both
 * server (pages, actions) and client (editor) code, so no JSX and no
 * server-only imports here.
 *
 * Drafts are prepared and approved here. A channel connected via Buffer
 * (see lib/buffer-social.ts) gets a real Publish button with a preview
 * confirm; an unconnected channel falls back to the original manual
 * pipeline (copy the caption, post it by hand, mark it posted).
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

/**
 * Matches the newsletter campaigns model (Draft/Scheduled/Sent).
 *
 * Nobody sets "scheduled" by hand any more: it is derived from the planned
 * date (see `statusFor`). What a human judges is the draft `stage`
 * (app/admin/stages.ts), which is a separate field.
 */
export type PostStatus = "draft" | "scheduled" | "posted";

export const STATUSES: {
  id: PostStatus;
  label: string;
  blurb: string;
}[] = [
  {
    id: "draft",
    label: "Draft",
    blurb: "No date on it yet.",
  },
  {
    id: "scheduled",
    label: "Scheduled",
    blurb: "Has a schedule date. Publish it from here, or by hand on any unconnected channel.",
  },
  {
    id: "posted",
    label: "Posted",
    blurb: "Published on its channels.",
  },
];

/**
 * The lifecycle status a post should have, given its dates. Posted is
 * terminal and always wins; otherwise a planned date is what makes a post
 * scheduled. One rule, so the tab a post sits in is always explainable by
 * something visible on the post itself.
 */
export function statusFor(opts: {
  publishAt: string | null;
  posted: boolean;
}): PostStatus {
  if (opts.posted) return "posted";
  return opts.publishAt ? "scheduled" : "draft";
}

export function statusLabel(id: string): string {
  return STATUSES.find((s) => s.id === id)?.label ?? id;
}

/** Badge classes per status, matching the admin chrome. */
export const STATUS_CHIP: Record<PostStatus, string> = {
  draft: "bg-[#f59e0b]/15 text-[#a16207]",
  scheduled: "bg-[#3b82f6]/12 text-[#1e40af]",
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
  /** Editorial stage: early / polish / ready. See app/admin/stages.ts. */
  stage: string | null;
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

export type MediaType = "image" | "video";

export type SocialMediaRow = {
  id: string;
  created_at: string;
  post_id: string;
  display_order: number;
  /** The file URL. Holds the video URL too when media_type is "video". */
  image_url: string;
  source_image_url: string | null;
  /** The Creative Studio PostSpec that produced image_url, if designed here.
   *  Always null for video: the studio is an image tool. */
  spec: Record<string, unknown> | null;
  /** Missing on rows written before the 20260817 migration, hence the
   *  fallback in `mediaType()` rather than reading this directly. */
  media_type?: MediaType | null;
};

/** What a row carries. Takes a loose shape on purpose: Supabase returns the
 *  column as a plain string, and rows written before the 20260817 migration
 *  don't have it at all. Anything that isn't "video" reads as an image. */
type HasMediaType = { media_type?: string | null };

export function mediaType(m: HasMediaType): MediaType {
  return m.media_type === "video" ? "video" : "image";
}

export function isVideo(m: HasMediaType): boolean {
  return mediaType(m) === "video";
}

/** Video files we accept, and the matching `accept` attribute for the picker.
 *  MP4 first because it is what every one of the three platforms takes. */
export const VIDEO_MIME = ["video/mp4", "video/quicktime"];
export const VIDEO_ACCEPT = VIDEO_MIME.join(",");
export const IMAGE_ACCEPT =
  "image/png,image/jpeg,image/webp,image/gif,image/avif";

/**
 * Why a post is either one video or images, never a mix.
 *
 * Buffer's `assets` array takes one of image/video per entry, but the
 * platforms are the real constraint: Instagram publishes a single video as a
 * Reel and will not take a video alongside photos in one post. Rather than
 * let a draft be built that only fails at publish time, the admin refuses the
 * combination up front (and a partial unique index backs it in Postgres).
 *
 * Returns an error string, or null when the addition is fine.
 */
export function mediaAddError(
  existing: HasMediaType[],
  adding: MediaType,
): string | null {
  const hasVideo = existing.some(isVideo);
  if (hasVideo) {
    return adding === "video"
      ? "This post already has a video. Remove it first: one video per post, which is what Instagram accepts for a Reel."
      : "This post has a video on it. A post is either one video or a set of images, not both.";
  }
  if (adding === "video" && existing.length > 0) {
    return "Remove the images first. A post is either one video or a set of images, not both.";
  }
  return null;
}

/** The caption that should actually go out on a given channel. */
export function captionFor(post: SocialPostRow, channel: ChannelId): string {
  const override = post.channel_captions?.[channel];
  return (override && override.trim()) || post.caption;
}
