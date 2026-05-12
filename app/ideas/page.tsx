import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import { getPublishedPosts, type Post } from "@/lib/cms-content";

export const metadata = {
  title: "Online Ideas · TEDxNewy",
  description:
    "Long-reads, notes from the curators, and behind-the-stage thinking from TEDxNewy. Newcastle ideas between events.",
};

export const revalidate = 60;

export default async function IdeasIndexPage() {
  const posts = await getPublishedPosts();
  return (
    <>
      <PageHero
        kicker="Online ideas"
        titleTop="Notes between"
        titleBottom="the stages."
        accent="red"
        intro={
          <>
            Long-reads, behind-the-scenes thinking and curator notes between
            our four annual events. New writing lands here when the team has
            something worth saying.
          </>
        }
      />

      <section className="mx-auto max-w-[1100px] px-5 pb-24 md:px-6 md:pb-32">
        {posts.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <PostCard key={p.slug} post={p} priority={i === 0} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function PostCard({ post, priority }: { post: Post; priority?: boolean }) {
  return (
    <li>
      <Link
        href={`/ideas/${post.slug}`}
        className="group block focus-visible:outline-none"
      >
        {post.heroImageUrl && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] bg-[#1a1714]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.heroImageUrl}
              alt=""
              loading={priority ? "eager" : "lazy"}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        )}
        <div className={post.heroImageUrl ? "mt-5" : ""}>
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            {formatDate(post.publishedAt)}
            {post.author && <> · {post.author}</>}
          </div>
          <h3
            className="mt-3 font-sans text-[22px] font-medium leading-[1.15] tracking-[-0.015em] text-[#141210] balance group-hover:text-[#e02214]"
            style={{ fontVariationSettings: '"opsz" 96' }}
          >
            {post.title}
          </h3>
          {post.summary && (
            <p className="mt-3 text-[14.5px] leading-[1.6] text-[#3d342e]">
              {post.summary}
            </p>
          )}
          <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#e02214]">
            Read more
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
        </div>
      </Link>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] px-6 py-20 text-center">
      <div
        className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
        style={{ letterSpacing: "0.24em" }}
      >
        Coming soon
      </div>
      <p className="mx-auto mt-4 max-w-[44ch] text-[16px] leading-[1.6] text-[#2a2521]">
        We&rsquo;re drafting the first batch of online ideas — notes from the
        curators, deeper dives into past talks, and what we&rsquo;re reading.
      </p>
      <Link
        href="/subscribe"
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#e02214] px-6 py-3 text-[14px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404]"
      >
        Subscribe for the first drop
      </Link>
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
