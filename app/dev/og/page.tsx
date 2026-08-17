import { notFound } from "next/navigation";
import { OG_PAGES, OG_GROUPS, type OgGroup } from "@/lib/og-content";
import { SIGNAL_LIVE, SIGNAL_PREVIEW_TOKEN } from "@/lib/feature-flags";

/**
 * Local-only gallery of every social share card.
 * Visit http://localhost:3000/dev/og while running `npm run dev`.
 * Returns 404 in production so it never ships publicly.
 *
 * Two things are shown per page, because a share is both of them: the
 * generated image (straight from that route's own `opengraph-image`, so what
 * you see here is exactly what a scraper fetches) and the headline block,
 * read live out of the page's rendered `<head>`. The metadata is not
 * duplicated here from a config: it is fetched, so if a page's `og:title`
 * drifts from its card, this preview shows the drift rather than hiding it.
 */
export const metadata = {
  title: "Social card previews · TEDxNewy (dev)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const GROUP_ORDER: OgGroup[] = [
  "Main",
  "Events",
  "Recaps",
  "Get involved",
  "About",
  "Utility",
];

type Share = {
  route: string;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  pageTitle: string | null;
  error?: string;
};

function meta(html: string, property: string): string | null {
  // Attribute order varies, so match either ordering rather than assuming one.
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)="${property}"[^>]+content="([^"]*)"`, "i"),
    new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="${property}"`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decode(m[1]);
  }
  return null;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&#x2F;/g, "/");
}

/**
 * While `SIGNAL_LIVE` is false, `/signal` redirects to `/signature`, so a
 * plain fetch would quietly show Signature's metadata under Signal's card.
 * The preview token bypasses the redirect, which is the whole point of it,
 * and is the only way to review the card Signal will actually ship with.
 */
function fetchPath(route: string): string {
  if (route === "/signal" && !SIGNAL_LIVE) {
    return `/signal?preview=${SIGNAL_PREVIEW_TOKEN}`;
  }
  return route;
}

async function readShare(origin: string, route: string): Promise<Share> {
  try {
    const res = await fetch(`${origin}${fetchPath(route)}`, { cache: "no-store" });
    if (!res.ok) {
      return {
        route,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        pageTitle: null,
        error: `HTTP ${res.status}`,
      };
    }
    const html = await res.text();
    const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return {
      route,
      ogTitle: meta(html, "og:title"),
      ogDescription: meta(html, "og:description"),
      ogImage: meta(html, "og:image"),
      pageTitle: titleTag ? decode(titleTag[1]) : null,
    };
  } catch (err) {
    return {
      route,
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
      pageTitle: null,
      error: err instanceof Error ? err.message : "fetch failed",
    };
  }
}

export default async function OgPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const origin = "http://localhost:3000";
  const routes = Object.keys(OG_PAGES);
  const shares = await Promise.all(routes.map((r) => readShare(origin, r)));
  const byRoute = new Map(shares.map((s) => [s.route, s]));

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    routes: routes.filter((r) => OG_GROUPS[r] === g),
  })).filter((g) => g.routes.length > 0);

  const ungrouped = routes.filter((r) => !OG_GROUPS[r]);

  return (
    <main className="min-h-screen bg-[#f4efe6] px-5 py-10 text-[#141210] md:px-10">
      <div className="mx-auto max-w-[1280px]">
        <header className="mb-10">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            Dev · Social cards
          </div>
          <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.02em]">
            What every page looks like when it is shared
          </h1>
          <p className="mt-3 max-w-[75ch] text-[14.5px] leading-[1.65] text-[#6b6459]">
            Each tile is the real generated image for that route plus the
            headline and description a scraper actually reads out of the page.
            Images come from <code className="font-mono">lib/og-card.tsx</code>{" "}
            (the shared design) and their words from{" "}
            <code className="font-mono">lib/og-content.ts</code> (one entry per
            page). Edit either and refresh. Event pages under{" "}
            <code className="font-mono">/events/[slug]</code> build their card
            from the CMS row instead, so they are not listed here.
          </p>
          <p className="mt-3 text-[13px] text-[#6b6459]">
            {routes.length} pages ·{" "}
            <span className="text-[#b91404]">
              {shares.filter((s) => s.error).length} failed to load
            </span>
          </p>
        </header>

        {grouped.map(({ group, routes: rs }) => (
          <section key={group} className="mb-12">
            <h2
              className="mb-4 font-mono text-[11px] font-semibold uppercase text-[#6b6459]"
              style={{ letterSpacing: "0.2em" }}
            >
              {group}
            </h2>
            <div className="grid gap-7 lg:grid-cols-2">
              {rs.map((route) => (
                <Card key={route} route={route} share={byRoute.get(route)} />
              ))}
            </div>
          </section>
        ))}

        {ungrouped.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 font-mono text-[11px] font-semibold uppercase text-[#6b6459]">
              Ungrouped
            </h2>
            <div className="grid gap-7 lg:grid-cols-2">
              {ungrouped.map((route) => (
                <Card key={route} route={route} share={byRoute.get(route)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Card({ route, share }: { route: string; share?: Share }) {
  const page = OG_PAGES[route];
  // Cache-bust so an edit to the card design shows on refresh rather than
  // serving the image the browser already has for this route.
  const imgSrc = `${route === "/" ? "" : route}/opengraph-image?t=${Date.now()}`;
  const host = "tedxnewy.com.au";

  return (
    <article className="overflow-hidden rounded-[14px] border border-[rgba(20,18,16,0.12)] bg-white">
      <div className="flex items-center justify-between border-b border-[rgba(20,18,16,0.08)] px-4 py-2.5">
        <code className="font-mono text-[12.5px] font-semibold text-[#141210]">
          {route}
        </code>
        <div className="flex items-center gap-3">
          {share?.error && (
            <span className="rounded-full bg-[#fde8e6] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-[#b91404]">
              {share.error}
            </span>
          )}
          {route === "/signal" && !SIGNAL_LIVE && (
            <span
              className="rounded-full bg-[#fff3d6] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-[#a5780f]"
              title="SIGNAL_LIVE is false, so /signal redirects to /signature. Read here through the preview token; the card ships as-is when the flag flips."
            >
              Gated
            </span>
          )}
          {!page.image && (
            <span className="rounded-full bg-[#f4efe6] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-[#6b6459]">
              No photo
            </span>
          )}
          <a
            href={route}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] text-[#b91404] underline-offset-4 hover:underline"
          >
            open page
          </a>
        </div>
      </div>

      {/* The share card as a platform renders it: image on top, then the
          headline block pulled off the page's own meta tags. */}
      <div className="bg-[#f4efe6]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={page.alt}
          width={1200}
          height={630}
          className="block w-full"
        />
        <div className="border-t border-[rgba(20,18,16,0.10)] bg-[#f7f5f1] px-4 py-3">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#8b8378]">
            {host}
          </div>
          <div className="mt-1 text-[15px] font-semibold leading-[1.3] text-[#141210]">
            {share?.ogTitle ?? share?.pageTitle ?? "(no og:title)"}
          </div>
          <div className="mt-1 line-clamp-2 text-[13px] leading-[1.45] text-[#6b6459]">
            {share?.ogDescription ?? "(no og:description)"}
          </div>
        </div>
      </div>

      <div className="space-y-1.5 px-4 py-3 text-[12px] leading-[1.5] text-[#6b6459]">
        <Row label="Card title" value={page.title} />
        {page.eyebrow && <Row label="Eyebrow" value={page.eyebrow} />}
        <Row label="Photo" value={page.image ?? "brand gradient"} mono />
        {page.crop !== undefined && (
          <Row label="Crop" value={`${page.crop} (0 = top of photo, 1 = bottom)`} />
        )}
        <Row label="Alt" value={page.alt} />
        {share?.ogImage && (
          <Row
            label="og:image"
            value={share.ogImage.replace(/^https?:\/\/[^/]+/, "")}
            mono
          />
        )}
      </div>
    </article>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <span className="w-[68px] shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-[#a39a8d]">
        {label}
      </span>
      <span className={mono ? "font-mono text-[11px]" : ""}>{value}</span>
    </div>
  );
}
