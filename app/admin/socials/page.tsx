import Link from "next/link";
import { CalendarClock, Hand, ImageIcon, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Card, Flash, NotSetUp, PageHeader } from "../ui";
import { PendingButton } from "../PendingButtons";
import { createPost } from "./actions";
import ConnectionsCard from "./ConnectionsCard";
import DeleteDraftButton from "./DeleteDraftButton";
import {
  CHANNELS,
  STATUSES,
  STATUS_CHIP,
  statusLabel,
  type PostStatus,
  type SocialConnectionRow,
  type SocialPostRow,
} from "./shared";

export const metadata = {
  title: "Socials · Admin · TEDxNewy",
};

type PostWithMedia = SocialPostRow & {
  social_post_media: { image_url: string; display_order: number }[];
};

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Australia/Sydney",
  });
}

export default async function AdminSocialsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; deleted?: string; error?: string }>;
}) {
  await requireAdmin();
  const { status: filter, deleted, error: flashError } = await searchParams;
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("social_posts")
    .select("*, social_post_media(image_url, display_order)")
    .order("updated_at", { ascending: false });
  const { data: connectionRows } = await supabase
    .from("social_connections")
    .select("*");

  const posts = (data ?? []) as PostWithMedia[];
  const counts = STATUSES.map((s) => ({
    ...s,
    count: posts.filter((p) => p.status === s.id).length,
  }));
  const shown =
    filter && STATUSES.some((s) => s.id === filter)
      ? posts.filter((p) => p.status === filter)
      : posts;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Community · Socials"
        title="Socials"
        description="The drafts log for Instagram, Facebook and LinkedIn. Write the caption, design the graphics, and move each post through review to Ready. Posting itself is still done by hand on each channel."
        actions={
          !error && (
            <form action={createPost}>
              <PendingButton icon={<Plus className="h-4 w-4" strokeWidth={2.25} />}>
                New draft
              </PendingButton>
            </form>
          )
        }
      />

      {deleted && <Flash tone="ok">Deleted.</Flash>}
      {flashError === "create" && (
        <Flash tone="error">Could not create a draft. Try again.</Flash>
      )}

      <Card className="flex items-start gap-4 p-5">
        <span
          className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e02214]/10 text-[#b91404]"
          aria-hidden
        >
          <Hand className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <div className="font-sans text-[14.5px] font-medium text-[#141210]">
            Connected channels publish for real
          </div>
          <p className="mt-1 max-w-[70ch] text-[13px] leading-[1.6] text-[#6b6459]">
            When a post reaches Ready to post, open it: a connected channel
            gets a Publish button that shows a final preview before it goes
            out live. Any channel not connected below still needs its caption
            copied and posted by hand.
          </p>
        </div>
      </Card>

      <ConnectionsCard connections={(connectionRows ?? []) as SocialConnectionRow[]} />

      {error ? (
        <NotSetUp title="Socials isn't set up yet">
          The socials database update (20260719b_social_posts.sql)
          hasn&rsquo;t been applied yet. Run it in the Supabase SQL editor,
          then reload this page.
        </NotSetUp>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <FilterChip href="/admin/socials" active={!filter}>
              All · {posts.length}
            </FilterChip>
            {counts.map((s) => (
              <FilterChip
                key={s.id}
                href={`/admin/socials?status=${s.id}`}
                active={filter === s.id}
              >
                {s.label} · {s.count}
              </FilterChip>
            ))}
          </div>

          {shown.length === 0 ? (
            <Card className="px-6 py-14 text-center">
              <div className="font-sans text-[16px] font-medium text-[#141210]">
                {filter ? "Nothing with this status" : "No drafts yet"}
              </div>
              <p className="mx-auto mt-1.5 max-w-[48ch] text-[13.5px] leading-[1.6] text-[#6b6459]">
                {filter
                  ? "Posts move between statuses from inside their editor."
                  : "Start a draft, write the caption, and design the graphics without leaving the admin."}
              </p>
            </Card>
          ) : (
            <ul className="space-y-3">
              {shown.map((p) => {
                const media = [...(p.social_post_media ?? [])].sort(
                  (a, b) => a.display_order - b.display_order,
                );
                const planned = fmtDate(p.publish_at);
                const posted = fmtDate(p.posted_at);
                return (
                  <li key={p.id}>
                    <Card className="flex items-center gap-3 p-4 pr-3 transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <Link
                        href={`/admin/socials/${p.id}`}
                        className="flex min-w-0 flex-1 items-center gap-5"
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[10px] border border-[rgba(20,18,16,0.08)] bg-[#1a1714]">
                          {media[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={media[0].image_url}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-white/35">
                              <ImageIcon className="h-6 w-6" strokeWidth={1.5} />
                            </div>
                          )}
                          {media.length > 1 && (
                            <span className="absolute bottom-1 right-1 rounded-md bg-black/65 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                              {media.length}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="truncate font-sans text-[15.5px] font-medium tracking-[-0.01em] text-[#141210]">
                              {p.title}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase ${STATUS_CHIP[p.status as PostStatus] ?? ""}`}
                              style={{ letterSpacing: "0.18em" }}
                            >
                              {statusLabel(p.status)}
                            </span>
                          </div>
                          {p.caption && (
                            <p className="mt-1 line-clamp-1 text-[13px] text-[#6b6459]">
                              {p.caption}
                            </p>
                          )}
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#6b6459]">
                            <span>
                              {p.channels.length
                                ? p.channels
                                    .map(
                                      (c) =>
                                        CHANNELS.find((x) => x.id === c)?.label ?? c,
                                    )
                                    .join(" · ")
                                : "No channels picked"}
                            </span>
                            {posted ? (
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarClock className="h-3.5 w-3.5" strokeWidth={2} />
                                Posted {posted}
                              </span>
                            ) : planned ? (
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarClock className="h-3.5 w-3.5" strokeWidth={2} />
                                Planned for {planned}
                              </span>
                            ) : null}
                          </div>
                          {p.status === "needs_changes" && p.status_note && (
                            <p className="mt-1.5 text-[12.5px] font-medium text-[#b91404]">
                              {p.status_note}
                            </p>
                          )}
                        </div>
                      </Link>
                      <DeleteDraftButton id={p.id} title={p.title} />
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-colors ${
        active
          ? "bg-[#141210] text-white"
          : "bg-[rgba(20,18,16,0.06)] text-[#141210] hover:bg-[rgba(20,18,16,0.10)]"
      }`}
    >
      {children}
    </Link>
  );
}
