/**
 * What the calendar grid renders. Built on the server from `social_posts`,
 * `newsletters` and `cms_events`, then handed to the client board, so these
 * carry exactly what a chip, its popover and the existing preview modals need
 * and nothing else.
 *
 * Pure types, no imports beyond the shared data modules.
 */
import type { ChannelId } from "../socials/shared";
import type { DraftStage } from "../stages";

export type SocialItem = {
  kind: "social";
  id: string;
  /** Sydney day key this sits on. */
  day: string;
  /** Sydney time label, e.g. `7:30pm`. */
  time: string | null;
  title: string;
  status: "draft" | "scheduled" | "posted";
  stage: DraftStage;
  channels: ChannelId[];
  /** Everything RowPreviewButton needs, resolved server-side. */
  caption: string;
  channelCaptions: Partial<Record<ChannelId, string>>;
  media: string[];
};

export type NewsletterItem = {
  kind: "newsletter";
  id: string;
  day: string;
  time: string | null;
  title: string;
  status: "draft" | "scheduled" | "sending" | "sent";
  stage: DraftStage;
  /** Everything the newsletter RowPreviewButton needs. */
  subject: string;
  preheader: string;
  blocks: unknown;
  scheduledAt: string | null;
};

/** Read-only context: the thing the comms are lining up against. */
export type EventItem = {
  id: string;
  day: string;
  title: string;
  eventKind: string;
};

export type CalendarItem = SocialItem | NewsletterItem;
