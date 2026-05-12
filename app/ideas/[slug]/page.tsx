import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getPostBySlug, getPublishedPosts } from "@/lib/cms-content";
import Markdown from "@/components/Markdown";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not found · TEDxNewy" };
  return {
    title: `${post.title} · Online Ideas · TEDxNewy`,
    description: post.summary ?? undefined,
    openGraph: {
      title: post.title,
      description: post.summary ?? undefined,
      images: post.heroImageUrl ? [post.heroImageUrl] : undefined,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const all = await getPublishedPosts();
  const others = all.filter((p) => p.slug !== slug).slice(0, 3);
  const readMinutes = readingMinutes(post.bodyMarkdown);

  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--color-cream)] pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="mx-auto max-w-[800px] px-5 md:px-6">
          <Link
            href="/ideas"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase text-[#6b6459] transition-colors hover:text-[#e02214]"
            style={{ letterSpacing: "0.22em" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
            All ideas
          </Link>
          <div
            className="mt-10 font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            {formatDate(post.publishedAt)}
            {post.author && <> · {post.author}</>}
            {readMinutes > 0 && <> · {readMinutes} min read</>}
          </div>
          <h1
            className="mt-6 font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
              lineHeight: 1.04,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            {post.title}
          </h1>
          {post.summary && (
            <p className="mt-7 max-w-[62ch] text-[18px] leading-[1.6] text-[#2a2521] md:text-[19px]">
              {post.summary}
            </p>
          )}
        </div>
      </section>

      {/* Hero image */}
      {post.heroImageUrl && (
        <section className="mx-auto max-w-[1000px] px-5 md:px-6">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-md)] bg-[#1a1714]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.heroImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </section>
      )}

      {/* Body */}
      <article className="mx-auto max-w-[720px] px-5 py-14 md:px-6 md:py-20">
        <Markdown>{post.bodyMarkdown}</Markdown>
      </article>

      {/* Related */}
      {others.length > 0 && (
        <section className="bg-[#f9f5ec]">
          <div className="mx-auto max-w-[1100px] px-5 py-16 md:px-6 md:py-20">
            <div
              className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
              style={{ letterSpacing: "0.24em" }}
            >
              More ideas
            </div>
            <ul className="mt-8 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((p) => (
                <li key={p.slug}>
                  <Link href={`/ideas/${p.slug}`} className="group block">
                    {p.heroImageUrl && (
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] bg-[#1a1714]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.heroImageUrl}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                    )}
                    <div className={p.heroImageUrl ? "mt-4" : ""}>
                      <div
                        className="font-mono text-[10px] font-semibold uppercase text-[#6b6459]"
                        style={{ letterSpacing: "0.24em" }}
                      >
                        {formatDate(p.publishedAt)}
                      </div>
                      <h3 className="mt-2 font-sans text-[18px] font-medium leading-[1.2] tracking-[-0.005em] text-[#141210] group-hover:text-[#e02214]">
                        {p.title}
                      </h3>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#e02214]">
                        Read
                        <ArrowRight className="h-3 w-3" strokeWidth={2.25} />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
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

function readingMinutes(md: string): number {
  const words = md
    .replace(/[#>*_`~\-\[\]\(\)!]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
