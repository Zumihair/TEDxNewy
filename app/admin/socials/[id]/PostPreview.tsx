"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bookmark,
  Globe,
  Heart,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Repeat2,
  Send,
  Share2,
  ThumbsUp,
  X,
} from "lucide-react";
import { CHANNELS, type ChannelId } from "../shared";

/**
 * Phone-frame mockup of how the post reads on each channel, driven by the
 * editor's LIVE state (unsaved edits included). A layout approximation for
 * judging caption + graphics together, not a pixel-faithful render of any
 * platform.
 */
export default function PostPreview({
  channels,
  captions,
  media,
  onClose,
  lockedChannel,
  footer,
}: {
  /** Channels picked in the editor; falls back to all when none picked. */
  channels: ChannelId[];
  /** Effective caption per channel (override or main). */
  captions: Record<ChannelId, string>;
  media: string[];
  onClose: () => void;
  /** When set, shows only this channel with no tab switcher — used for the
   * "is this right before it goes out live" publish confirmation. */
  lockedChannel?: ChannelId;
  /** Extra content rendered under the phone frame, e.g. Publish confirm buttons. */
  footer?: React.ReactNode;
}) {
  const tabs = lockedChannel
    ? [lockedChannel]
    : channels.length
      ? channels
      : CHANNELS.map((c) => c.id);
  const [tab, setTab] = useState<ChannelId>(tabs[0]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const caption = captions[tab] ?? "";

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Post preview"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full flex-col items-center gap-3"
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          {lockedChannel ? (
            <span className="rounded-full bg-white px-4 py-1.5 text-[12.5px] font-medium text-[#141210]">
              {CHANNELS.find((x) => x.id === lockedChannel)!.label}
            </span>
          ) : (
            tabs.map((id) => {
              const c = CHANNELS.find((x) => x.id === id)!;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-colors ${
                    tab === id
                      ? "bg-white text-[#141210]"
                      : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  {c.label}
                </button>
              );
            })
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        {/* phone frame */}
        <div className="w-[375px] max-w-[92vw] overflow-hidden rounded-[44px] border-[10px] border-[#141210] bg-white shadow-2xl">
          <div className="relative h-[70vh] max-h-[660px] overflow-y-auto">
            <div className="pointer-events-none absolute left-1/2 top-2 z-10 h-[18px] w-[110px] -translate-x-1/2 rounded-full bg-[#141210]" />
            <div className="pt-8">
              {tab === "instagram" && (
                <InstagramPreview caption={caption} media={media} />
              )}
              {tab === "facebook" && (
                <FacebookPreview caption={caption} media={media} />
              )}
              {tab === "linkedin" && (
                <LinkedInPreview caption={caption} media={media} />
              )}
            </div>
          </div>
        </div>

        {footer}
      </div>
    </div>,
    document.body,
  );
}

function Avatar({ round, size }: { round: boolean; size: number }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-[#e02214] ${round ? "rounded-full" : "rounded-md"}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className="font-extrabold tracking-tight text-white"
        style={{ fontSize: size * 0.32 }}
      >
        TEDx
      </span>
    </div>
  );
}

function Carousel({ media }: { media: string[] }) {
  if (media.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-[rgba(20,18,16,0.06)] text-[12.5px] text-[#6b6459]">
        No graphics attached yet
      </div>
    );
  }
  return (
    <div className="relative">
      <div className="flex snap-x snap-mandatory overflow-x-auto">
        {media.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={url}
            alt=""
            className="w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>
      {media.length > 1 && (
        <span className="absolute right-2 top-2 rounded-full bg-black/65 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-white">
          1/{media.length}
        </span>
      )}
    </div>
  );
}

function CaptionText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  if (!text.trim()) {
    return (
      <span className={`italic text-[#9a9285] ${className}`}>
        No caption yet
      </span>
    );
  }
  return (
    <span className={`whitespace-pre-wrap break-words ${className}`}>{text}</span>
  );
}

function InstagramPreview({ caption, media }: { caption: string; media: string[] }) {
  return (
    <div className="pb-8">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Avatar round size={32} />
        <span className="text-[13px] font-semibold text-[#141210]">tedxnewy</span>
        <MoreHorizontal className="ml-auto h-4.5 w-4.5 text-[#141210]" strokeWidth={2} />
      </div>
      <Carousel media={media} />
      <div className="flex items-center gap-4 px-3 py-2.5 text-[#141210]">
        <Heart className="h-6 w-6" strokeWidth={1.8} />
        <MessageCircle className="h-6 w-6" strokeWidth={1.8} />
        <Send className="h-6 w-6" strokeWidth={1.8} />
        <Bookmark className="ml-auto h-6 w-6" strokeWidth={1.8} />
      </div>
      <p className="px-3 text-[13px] leading-[1.45] text-[#141210]">
        <span className="font-semibold">tedxnewy</span>{" "}
        <CaptionText text={caption} />
      </p>
    </div>
  );
}

function LinkedInPreview({ caption, media }: { caption: string; media: string[] }) {
  return (
    <div className="min-h-full bg-[#f4f2ee] py-2 pb-8">
      <div className="bg-white">
        <div className="flex items-start gap-2.5 px-3 pt-3">
          <Avatar round={false} size={44} />
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold leading-tight text-[#141210]">
              TEDxNewy
            </div>
            <div className="text-[11.5px] text-[#6b6459]">
              Ideas worth spreading, Newcastle NSW
            </div>
            <div className="flex items-center gap-1 text-[11.5px] text-[#6b6459]">
              Now · <Globe className="h-3 w-3" strokeWidth={2} />
            </div>
          </div>
          <MoreHorizontal className="ml-auto h-4.5 w-4.5 shrink-0 text-[#6b6459]" strokeWidth={2} />
        </div>
        <p className="px-3 py-2.5 text-[13px] leading-[1.5] text-[#141210]">
          <CaptionText text={caption} />
        </p>
        <Carousel media={media} />
        <div className="mx-3 flex items-center justify-between border-t border-[rgba(20,18,16,0.10)] py-1.5">
          {[
            { icon: ThumbsUp, label: "Like" },
            { icon: MessageSquare, label: "Comment" },
            { icon: Repeat2, label: "Repost" },
            { icon: Send, label: "Send" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10.5px] font-medium text-[#6b6459]"
            >
              <Icon className="h-4.5 w-4.5" strokeWidth={2} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FacebookPreview({ caption, media }: { caption: string; media: string[] }) {
  return (
    <div className="min-h-full bg-[#f0f2f5] py-2 pb-8">
      <div className="bg-white">
        <div className="flex items-start gap-2.5 px-3 pt-3">
          <Avatar round size={40} />
          <div>
            <div className="text-[13.5px] font-semibold leading-tight text-[#141210]">
              TEDxNewy
            </div>
            <div className="flex items-center gap-1 text-[11.5px] text-[#6b6459]">
              Just now · <Globe className="h-3 w-3" strokeWidth={2} />
            </div>
          </div>
          <MoreHorizontal className="ml-auto h-4.5 w-4.5 shrink-0 text-[#6b6459]" strokeWidth={2} />
        </div>
        <p className="px-3 py-2.5 text-[13px] leading-[1.5] text-[#141210]">
          <CaptionText text={caption} />
        </p>
        <Carousel media={media} />
        <div className="mx-3 flex items-center justify-around border-t border-[rgba(20,18,16,0.10)] py-1.5">
          {[
            { icon: ThumbsUp, label: "Like" },
            { icon: MessageSquare, label: "Comment" },
            { icon: Share2, label: "Share" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 px-2 py-1 text-[12px] font-medium text-[#6b6459]"
            >
              <Icon className="h-4.5 w-4.5" strokeWidth={2} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
