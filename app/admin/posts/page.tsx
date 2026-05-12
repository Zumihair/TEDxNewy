import Link from "next/link";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import {
  Badge,
  Card,
  DangerButton,
  Flash,
  PageHeader,
  PrimaryButton,
} from "../ui";
import { deletePost } from "./actions";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  await requireAdmin();
  const { saved, deleted } = await searchParams;
  const supabase = await getServerSupabase();

  const { data: posts } = await supabase
    .from("cms_posts")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  const drafts = (posts ?? []).filter((p) => !p.published_at);
  const published = (posts ?? []).filter((p) => p.published_at);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Online ideas"
        title="The blog"
        description={`${published.length} published, ${drafts.length} draft${drafts.length === 1 ? "" : "s"}. Drives /ideas with ISR every 60s.`}
        actions={
          <Link href="/admin/posts/new">
            <PrimaryButton type="button">
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              New post
            </PrimaryButton>
          </Link>
        }
      />

      {saved && <Flash tone="ok">Saved.</Flash>}
      {deleted && <Flash tone="ok">Deleted.</Flash>}

      {drafts.length > 0 && <PostList title="Drafts" rows={drafts} tone="draft" />}
      {published.length > 0 && (
        <PostList title="Published" rows={published} tone="live" />
      )}

      {(posts?.length ?? 0) === 0 && (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] px-6 py-16 text-center">
          <p className="text-[15px] text-[#2a2521]">
            No posts yet. Hit New post to draft your first idea.
          </p>
        </div>
      )}
    </div>
  );
}

function PostList({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: Array<{
    slug: string;
    title: string;
    summary: string | null;
    hero_image_url: string | null;
    author: string | null;
    published_at: string | null;
    updated_at: string;
  }>;
  tone: "live" | "draft";
}) {
  return (
    <section>
      <div
        className="mb-4 flex items-center gap-3 font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
        style={{ letterSpacing: "0.24em" }}
      >
        <span>
          {title} · {rows.length}
        </span>
        <span className="h-px flex-1 bg-[rgba(20,18,16,0.08)]" />
      </div>
      <Card>
        <ul className="divide-y divide-[rgba(20,18,16,0.08)]">
          {rows.map((p) => (
            <li
              key={p.slug}
              className="grid grid-cols-[80px_1fr_auto] items-center gap-4 px-4 py-3.5 md:gap-5 md:px-5"
            >
              <Link
                href={`/admin/posts/${encodeURIComponent(p.slug)}`}
                className="relative block aspect-[4/3] w-20 overflow-hidden rounded bg-[#1a1714]"
                aria-label={`Edit ${p.title}`}
              >
                {p.hero_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.hero_image_url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/40">
                    <span className="font-mono text-[11px]">no image</span>
                  </div>
                )}
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/posts/${encodeURIComponent(p.slug)}`}
                    className="line-clamp-1 font-sans text-[15px] font-medium tracking-[-0.005em] text-[#141210] hover:text-[#e02214]"
                  >
                    {p.title}
                  </Link>
                  <Badge tone={tone}>{tone === "live" ? "Published" : "Draft"}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6b6459]">
                  {p.author && <span>{p.author}</span>}
                  <span>
                    {p.published_at
                      ? `Published ${formatDate(p.published_at)}`
                      : `Last saved ${formatDate(p.updated_at)}`}
                  </span>
                  <span className="font-mono text-[10.5px] text-[#6b6459]/70">
                    {p.slug}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.published_at && (
                  <Link
                    href={`/ideas/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="View on site"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(20,18,16,0.06)] text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                  >
                    <ExternalLink
                      className="h-3.5 w-3.5"
                      strokeWidth={2.25}
                    />
                  </Link>
                )}
                <Link
                  href={`/admin/posts/${encodeURIComponent(p.slug)}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Edit
                </Link>
                <form action={deletePost}>
                  <input type="hidden" name="slug" value={p.slug} />
                  <DangerButton type="submit">
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                    Delete
                  </DangerButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
