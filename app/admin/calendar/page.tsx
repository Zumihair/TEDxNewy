import Link from "next/link";
import { Newspaper, Send, Share2 } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { PageHeader } from "../ui";
import { asStage } from "../stages";
import {
  isVideo,
  statusFor,
  type ChannelId,
  type SocialPostRow,
} from "../socials/shared";
import CalendarBoard from "./CalendarBoard";
import {
  addDays,
  currentSydneyMonday,
  isDayKey,
  mondayOf,
  rangeLabel,
  sydneyDateKey,
  sydneyTimeLabel,
  todayKey,
  utcBoundsFor,
  weeksFrom,
} from "./dates";
import type { CalendarItem, EventItem, NewsletterItem } from "./types";

const WEEKS = 4;

type MediaRow = {
  image_url: string;
  display_order: number;
  media_type?: string | null;
};

type NoteRow = {
  id: string;
  day: string;
  title: string;
  body: string | null;
};

/** Ordered image URLs, same rule as the socials list's `mediaUrls`. */
function mediaUrls(rows: MediaRow[] | null | undefined): string[] {
  return [...(rows ?? [])]
    .sort((a, b) => a.display_order - b.display_order)
    .map((m) => m.image_url);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  await requireAdmin();
  const { start } = await searchParams;
  const supabase = await getServerSupabase();

  // Snap whatever arrived to a Monday, so a hand-typed or stale date still
  // lines the grid up with its weekday columns.
  const startKey = isDayKey(start) ? mondayOf(start) : currentSydneyMonday();
  const days = WEEKS * 7;
  const endKey = addDays(startKey, days - 1);
  const { fromIso, toIso } = utcBoundsFor(startKey, days);

  // Two queries per table rather than one `.or()`: a post can be anchored by
  // either its planned date or the date it actually went out, and merging by
  // id here is clearer than a nested PostgREST filter over ISO strings.
  const socialSelect =
    "*, social_post_media(image_url, display_order, media_type)";
  const [
    plannedPosts,
    postedPosts,
    scheduledSends,
    sentSends,
    eventRows,
    noteRows,
  ] = await Promise.all([
    supabase
      .from("social_posts")
      .select(socialSelect)
      .gte("publish_at", fromIso)
      .lt("publish_at", toIso),
    supabase
      .from("social_posts")
      .select(socialSelect)
      .gte("posted_at", fromIso)
      .lt("posted_at", toIso),
    // select("*") on newsletters on purpose: naming `stage` would fail the
    // whole query if the draft-stages migration hasn't been applied.
    supabase
      .from("newsletters")
      .select("*")
      .gte("scheduled_at", fromIso)
      .lt("scheduled_at", toIso),
    supabase
      .from("newsletters")
      .select("*")
      .gte("sent_at", fromIso)
      .lt("sent_at", toIso),
    supabase
      .from("cms_events")
      .select("id, title, starts_at, kind")
      .gte("starts_at", fromIso)
      .lt("starts_at", toIso),
    // Notes bound by plain day keys, NOT the UTC instants above: `day` is a
    // date column, so comparing it to an ISO timestamp would be both wrong
    // and a needless conversion.
    supabase
      .from("calendar_notes")
      .select("*")
      .gte("day", startKey)
      .lte("day", endKey),
  ]);

  type PostRow = SocialPostRow & { social_post_media?: MediaRow[] | null };
  const posts = new Map<string, PostRow>();
  for (const row of [
    ...((plannedPosts.data ?? []) as PostRow[]),
    ...((postedPosts.data ?? []) as PostRow[]),
  ]) {
    posts.set(row.id, row);
  }

  type SendRow = Record<string, unknown> & { id: string };
  const sends = new Map<string, SendRow>();
  for (const row of [
    ...((scheduledSends.data ?? []) as SendRow[]),
    ...((sentSends.data ?? []) as SendRow[]),
  ]) {
    sends.set(row.id, row);
  }

  const itemsByDay: Record<string, CalendarItem[]> = {};
  const push = (item: CalendarItem) => {
    (itemsByDay[item.day] ??= []).push(item);
  };

  for (const post of posts.values()) {
    // Posted wins: where it actually went out is the truthful anchor.
    const anchor = post.posted_at ?? post.publish_at;
    if (!anchor) continue;
    push({
      kind: "social",
      id: post.id,
      day: sydneyDateKey(anchor),
      time: sydneyTimeLabel(anchor),
      title: post.title || "Untitled post",
      status: statusFor({
        publishAt: post.publish_at,
        posted: !!post.posted_at,
      }),
      stage: asStage(post.stage),
      channels: (post.channels ?? []) as ChannelId[],
      caption: post.caption ?? "",
      channelCaptions: post.channel_captions ?? {},
      media: mediaUrls(post.social_post_media),
      isVideo: (post.social_post_media ?? []).some((m) => isVideo(m)),
    });
  }

  for (const send of sends.values()) {
    const scheduledAt = (send.scheduled_at as string | null) ?? null;
    const sentAt = (send.sent_at as string | null) ?? null;
    const anchor = sentAt ?? scheduledAt;
    if (!anchor) continue;
    const item: NewsletterItem = {
      kind: "newsletter",
      id: send.id,
      day: sydneyDateKey(anchor),
      time: sydneyTimeLabel(anchor),
      title: (send.title as string) || "Untitled newsletter",
      status: (send.status as NewsletterItem["status"]) ?? "draft",
      stage: asStage(send.stage),
      subject: (send.subject as string) ?? "",
      preheader: (send.preheader as string) ?? "",
      blocks: send.blocks ?? [],
      scheduledAt,
    };
    push(item);
  }

  // Earliest first within a day, undated last. Notes have no time, so this
  // sorts them to the end of the day, under whatever is actually going out.
  const timeOf = (i: CalendarItem) => (i.kind === "note" ? "" : (i.time ?? ""));
  for (const list of Object.values(itemsByDay)) {
    list.sort((a, b) => timeOf(a).localeCompare(timeOf(b)));
  }

  // Notes go in after the sort so they always sit last in a day, whatever
  // else is on it.
  for (const note of (noteRows.data ?? []) as NoteRow[]) {
    push({
      kind: "note",
      id: note.id,
      day: note.day,
      title: note.title || "Untitled note",
      body: note.body ?? "",
    });
  }

  const eventsByDay: Record<string, EventItem[]> = {};
  for (const e of eventRows.data ?? []) {
    if (!e.starts_at) continue;
    const day = sydneyDateKey(e.starts_at);
    (eventsByDay[day] ??= []).push({
      id: e.id,
      day,
      title: e.title,
      eventKind: e.kind,
    });
  }

  const linkCls =
    "inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3.5 py-2 text-[12.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Community"
        title="Calendar"
        description="Four weeks of everything going out: scheduled social posts, newsletter campaigns, and the events they line up against. Click anything to preview it or open its editor. Add notes to plan against a day."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin/socials" className={linkCls}>
          <Share2 className="h-3.5 w-3.5" strokeWidth={2.25} />
          Socials
        </Link>
        <Link href="/admin/newsletter/campaigns" className={linkCls}>
          <Newspaper className="h-3.5 w-3.5" strokeWidth={2.25} />
          Newsletter
        </Link>
        <Link href="/admin/emails" className={linkCls}>
          <Send className="h-3.5 w-3.5" strokeWidth={2.25} />
          Quick email
        </Link>
      </div>

      <CalendarBoard
        weeks={weeksFrom(startKey, WEEKS)}
        itemsByDay={itemsByDay}
        eventsByDay={eventsByDay}
        today={todayKey()}
        label={rangeLabel(startKey, endKey)}
        prevHref={`/admin/calendar?start=${addDays(startKey, -7)}`}
        nextHref={`/admin/calendar?start=${addDays(startKey, 7)}`}
      />
    </div>
  );
}
