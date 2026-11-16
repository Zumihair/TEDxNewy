/**
 * Builds the Slack message for one published social post (pure: no I/O, no
 * imports, so it can be dry run from a plain script).
 *
 * Layout, top to bottom:
 *  1. (only if something failed) "*Error: N channel(s) not posted* ..." with a
 *     link to the post in the admin.
 *  2. the post title
 *  3. caption preview
 *  4. one line per channel with its live link (Instagram, LinkedIn, Facebook)
 *  5. the attached images (image blocks, capped), then "+N more images"
 *
 * Plain text, no dashes, Australian spelling.
 */

export type ChannelOutcome = {
  /** Channel id, e.g. "instagram". */
  channel: string;
  label: string;
  /** live: has a link. nolink: posted but Buffer gave no link in time.
   *  failed: did not go out (our publish failed, or Buffer reported an error). */
  state: "live" | "nolink" | "failed";
  link: string | null;
};

export type SlackMessageInput = {
  title: string;
  caption: string;
  adminUrl: string;
  outcomes: ChannelOutcome[];
  /** Public https image URLs, already filtered to formats Slack can show. */
  imageUrls: string[];
};

export const MAX_IMAGES = 4;
const CAPTION_PREVIEW = 220;
/** Display order in the message. Anything not listed follows alphabetically. */
const ORDER = ["instagram", "linkedin", "facebook"];

export function slackEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function preview(caption: string): string {
  const flat = caption.replace(/\s+/g, " ").trim();
  return flat.length > CAPTION_PREVIEW ? `${flat.slice(0, CAPTION_PREVIEW - 3)}...` : flat;
}

export type SlackPayload = {
  text: string;
  blocks: Array<Record<string, unknown>>;
};

export function buildSlackPostMessage(
  input: SlackMessageInput,
  opts: { images?: boolean } = {},
): SlackPayload {
  const withImages = opts.images !== false;
  const outcomes = [...input.outcomes].sort((a, b) => {
    const ia = ORDER.indexOf(a.channel);
    const ib = ORDER.indexOf(b.channel);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.channel.localeCompare(b.channel);
  });
  const failed = outcomes.filter((o) => o.state === "failed");
  const shown = outcomes.filter((o) => o.state !== "failed");
  const blocks: SlackPayload["blocks"] = [];

  if (failed.length > 0) {
    const n = failed.length;
    const names = failed.map((o) => o.label).join(", ");
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:warning: *Error: ${n} ${n === 1 ? "channel" : "channels"} not posted* (${names}). Check in the admin portal here: <${input.adminUrl}|open the post>`,
      },
    });
  }

  blocks.push({
    type: "section",
    text: { type: "mrkdwn", text: `:mega: *${slackEscape(input.title)}*` },
  });

  const cap = preview(input.caption);
  if (cap) {
    blocks.push({ type: "section", text: { type: "mrkdwn", text: `> ${slackEscape(cap)}` } });
  }

  if (shown.length > 0) {
    const lines = shown.map((o) =>
      o.state === "live" && o.link
        ? `*${o.label}:* <${o.link}|View post>`
        : `*${o.label}:* posted, but Buffer has not given us a link yet (<${input.adminUrl}|check the admin>)`,
    );
    blocks.push({ type: "section", text: { type: "mrkdwn", text: lines.join("\n") } });
  }

  if (withImages && input.imageUrls.length > 0) {
    for (const url of input.imageUrls.slice(0, MAX_IMAGES)) {
      blocks.push({ type: "image", image_url: url, alt_text: input.title.slice(0, 200) || "Post image" });
    }
    const more = input.imageUrls.length - MAX_IMAGES;
    if (more > 0) {
      blocks.push({
        type: "context",
        elements: [{ type: "mrkdwn", text: `+${more} more ${more === 1 ? "image" : "images"} on the post` }],
      });
    }
  }

  const text =
    failed.length > 0
      ? `Error: ${failed.length} ${failed.length === 1 ? "channel" : "channels"} not posted: ${input.title}`
      : `New post: ${input.title}`;
  return { text, blocks };
}

/** Slack image blocks only take png, jpg and gif. Anything else (webp, avif,
 *  video) is dropped rather than risking the whole message. */
export function slackFriendlyImage(url: string): boolean {
  if (!/^https:\/\//i.test(url)) return false;
  const path = url.split("?")[0].toLowerCase();
  return /\.(png|jpe?g|gif)$/.test(path);
}
