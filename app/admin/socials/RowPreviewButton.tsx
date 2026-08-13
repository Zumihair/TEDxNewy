"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import PostPreview from "./[id]/PostPreview";
import { CHANNELS, type ChannelId } from "./shared";

/**
 * Phone-mockup preview for one row of the socials list, so a post can be
 * checked without opening its editor. Mirrors the newsletter list's
 * RowPreviewButton; the modal itself is the same one the editor uses.
 */
export default function RowPreviewButton({
  channels,
  caption,
  channelCaptions,
  media,
}: {
  channels: ChannelId[];
  caption: string;
  channelCaptions: Partial<Record<ChannelId, string>>;
  media: string[];
}) {
  const [open, setOpen] = useState(false);

  const captions = Object.fromEntries(
    CHANNELS.map((c) => [c.id, (channelCaptions?.[c.id] ?? "").trim() || caption]),
  ) as Record<ChannelId, string>;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Preview"
        aria-label="Preview post"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.08)] hover:text-[#141210]"
      >
        <Eye className="h-4 w-4" strokeWidth={2.25} />
      </button>
      {open && (
        <PostPreview
          channels={channels}
          captions={captions}
          media={media}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
