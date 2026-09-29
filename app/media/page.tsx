import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import PhotoFill from "@/components/PhotoFill";
import { getEvents, getPhotosForEvent, type EventPhoto } from "@/lib/cms-content";
import { ORG } from "@/lib/data";
import { CopyButton, LogoCards, Swatch } from "./MediaKit";

export const revalidate = 60;

export const metadata = {
  alternates: { canonical: "/media" },
  title: "Media · TEDxNewy",
  description:
    "Logos, colours, photos, a ready-to-use description and our social handles for anyone working with TEDxNewy, an independently licensed TED event in Newcastle, Australia.",
};

const DESCRIPTION = `TEDxNewy is an independently licensed TED event based in Newcastle, on Awabakal and Worimi Country. Formerly TEDxCooksHill, it is run entirely by volunteers, aiming to promote ideas worth spreading. TEDxNewy stages talks, salons and community events that bring Novocastrians together around ideas that matter.`;

const HASHTAGS = ["#TEDxNewy", "#IdeasChangeEverything", "#Newcastle"];

/**
 * Preferred thumbnails for galleries whose first photos show the old
 * TEDxCooksHill branding (Reframe 2025 was staged under that name). Matched
 * as a substring of the thumbnail URL; anything not found falls back to the
 * gallery's own order.
 */
const PREFERRED_THUMBS: Record<string, string[]> = {
  "reframe-2025": ["_036_thumb", "_038_thumb", "_044_thumb"],
};

function pickThumbs(slug: string, photos: EventPhoto[]): EventPhoto[] {
  const picked: EventPhoto[] = [];
  for (const needle of PREFERRED_THUMBS[slug] ?? []) {
    const hit = photos.find((p) => p.thumbUrl.includes(needle));
    if (hit) picked.push(hit);
  }
  for (const p of photos) {
    if (picked.length >= 3) break;
    if (!picked.includes(p)) picked.push(p);
  }
  return picked.slice(0, 3);
}

const subStyle = {
  fontSize: "clamp(1.35rem, 2.2vw, 1.75rem)",
  lineHeight: 1.1,
  fontWeight: 500,
  letterSpacing: "-0.02em",
  fontVariationSettings: '"opsz" 96',
} as const;

const h2Style = {
  fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
  lineHeight: 1.05,
  fontWeight: 500,
  fontVariationSettings: '"opsz" 144',
} as const;

const btnRed =
  "inline-flex items-center gap-2 rounded-full bg-[#e62b1e] px-6 py-3 font-sans text-[14px] font-medium text-white transition-all duration-300 hover:-translate-y-px hover:bg-[#b91404]";
const btnLine =
  "inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.18)] bg-transparent px-6 py-3 font-sans text-[14px] font-medium text-[#000000] transition-colors duration-300 hover:border-[#000000] hover:bg-[#000000] hover:text-white";

export default async function MediaPage() {
  // Every past event that has photos catalogued against it, the same source
  // the homepage gallery row uses, so a newly published gallery shows up here
  // on its own and no card can ever link to an empty (404) gallery.
  const pastEvents = await getEvents({ status: "past" });
  const galleries = (
    await Promise.all(
      pastEvents.map(async (event) => ({
        event,
        photos: await getPhotosForEvent(event.id),
      })),
    )
  ).filter((g) => g.photos.length > 0);

  return (
    <>
      <BreadcrumbJsonLd name="Media" path="/media" />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#2a0604] pb-16 pt-[132px] text-white md:pb-[104px] md:pt-[176px]">
        <div className="absolute inset-0">
          <Image
            src="/images/media/hero.webp"
            alt="A full house watching a talk at a TEDxNewy event"
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "60% 50%" }}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(42,6,4,0.82)_0%,rgba(42,6,4,0.78)_100%)] md:bg-[linear-gradient(90deg,rgba(42,6,4,0.94)_0%,rgba(42,6,4,0.72)_50%,rgba(42,6,4,0.35)_100%),linear-gradient(180deg,rgba(42,6,4,0.5)_0%,rgba(42,6,4,0)_35%,rgba(42,6,4,0.7)_100%)]"
          />
          <div className="grain grain-dark absolute inset-0" />
        </div>
        <div className="relative z-[2] mx-auto max-w-[1100px] px-5 md:px-6">
          <h1
            className="max-w-[14ch] font-sans tracking-[-0.025em] text-white balance"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              lineHeight: 0.98,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Let&rsquo;s make something together.
          </h1>
          <p className="mt-8 max-w-[56ch] text-[17px] leading-[1.65] text-white/90 md:text-[18px]">
            Working with TEDxNewy on a collab post, a partnership, a story or
            an event listing? Whatever the event or the season, everything you
            need is on this page: our description, logos, photos and handles.
          </p>
          <p className="mt-4 max-w-[56ch] text-[17px] leading-[1.65] text-white/90 md:text-[18px]">
            If something is missing, email us and we&rsquo;ll send it over.
          </p>
        </div>
      </section>

      {/* Brand kit */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-[1100px] px-5 md:px-6">
          <h2
            className="max-w-[22ch] font-sans tracking-[-0.025em] text-[#000000] balance"
            style={h2Style}
          >
            Brand kit
          </h2>

          <h3 className="mt-10 font-sans text-[#000000]" style={subStyle}>
            Logos
          </h3>
          <p className="mt-4 max-w-[62ch] text-[16.5px] leading-[1.7] text-[#2a2521]">
            Please keep the logos clear and unmodified, and don&rsquo;t
            recolour or stretch them. Each file is cropped tight, so it sits
            cleanly in your design. Use the light version on white or cream,
            and the dark version on black or a darkened photo.
          </p>
          <LogoCards />

          <div className="mt-16">
            <h3 className="font-sans text-[#000000]" style={subStyle}>
              About us
            </h3>
            <p className="mt-4 text-[14px] text-[#6b6459]">
              A short description of TEDxNewy for captions, articles, listings
              and programmes.
            </p>
            <blockquote className="mt-6 rounded-[12px] border border-[rgba(0,0,0,0.13)] bg-white p-6 text-[16px] leading-[1.7] text-[#2a2521] md:p-8 md:text-[17px]">
              {DESCRIPTION}
            </blockquote>
            <div className="mt-5 flex flex-wrap gap-3">
              <CopyButton
                text={DESCRIPTION}
                label="Copy description"
                className={btnLine}
              />
            </div>
          </div>

          <div className="mt-16">
            <h3 className="font-sans text-[#000000]" style={subStyle}>
              Colours and fonts
            </h3>
            <div className="mt-5 flex flex-wrap gap-3">
              <Swatch name="TED Red" hex="#E62B1E" fill="#e62b1e" />
              <Swatch name="Black" hex="#000000" fill="#000000" />
              <Swatch name="White" hex="#FFFFFF" fill="#ffffff" />
            </div>
            <div className="mt-6 flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5">
              <b
                className="text-[26px] font-bold tracking-[-0.01em]"
                style={{
                  fontFamily:
                    'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',
                }}
              >
                Inter
              </b>
              <span className="text-[14.5px] text-[#6b6459]">
                Our preferred font for slides, documents and print. Helvetica is
                also fine.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Event Photos */}
      {galleries.length > 0 && (
        <section className="pb-12 md:pb-14">
          <div className="mx-auto max-w-[1100px] px-5 md:px-6">
            <h3 className="font-sans text-[#000000]" style={subStyle}>
              Event Photos
            </h3>
            <p className="mt-4 max-w-[62ch] text-[16.5px] leading-[1.7] text-[#2a2521]">
              Open an event, tap a photo and download it. You&rsquo;re welcome
              to use them in posts you share with us. Please tag{" "}
              <b className="font-semibold">@tedxnewy</b>.
            </p>
            <div className="carousel-scrollbar -mx-5 mt-6 flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto px-5 pb-3 md:-mx-6 md:scroll-pl-6 md:px-6">
              {galleries.map(({ event, photos }) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}/gallery`}
                  className="group flex w-[240px] shrink-0 snap-start flex-col rounded-[8px] border border-[rgba(0,0,0,0.08)] bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)]"
                >
                  <div className="grid grid-cols-3 gap-1.5">
                    {pickThumbs(event.slug, photos).map((p) => (
                      <div
                        key={p.id}
                        className="relative aspect-square overflow-hidden rounded-[8px] bg-[#1a1714]"
                      >
                        <PhotoFill src={p.thumbUrl} alt="" sizes="80px" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 font-sans text-[16px] font-medium leading-tight tracking-[-0.01em] text-[#000000] group-hover:text-[#b91404]">
                    {event.title}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[12.5px] text-[#6b6459]">
                    <span>{event.dateLabel ?? event.shortDate}</span>
                    <ArrowUpRight
                      className="h-4 w-4 shrink-0 text-[#b91404]"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Our socials */}
      <section className="pb-16 md:pb-20">
        <div className="mx-auto max-w-[1100px] px-5 md:px-6">
          <h3 className="font-sans text-[#000000]" style={subStyle}>
            Our socials
          </h3>
          <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
            <div>
              <div
                className="text-[10.5px] font-semibold uppercase text-[#b91404]"
                style={{ letterSpacing: "0.22em" }}
              >
                Our handles
              </div>
              <ul className="mt-4 grid gap-2.5">
                <Handle name={ORG.handles.instagram} network="Instagram">
                  <InstagramIcon />
                </Handle>
                <Handle name={ORG.handles.linkedin} network="LinkedIn">
                  <LinkedInIcon />
                </Handle>
                <Handle name={ORG.handles.tiktok} network="TikTok">
                  <TikTokIcon />
                </Handle>
              </ul>
            </div>
            <div>
              <div
                className="text-[10.5px] font-semibold uppercase text-[#b91404]"
                style={{ letterSpacing: "0.22em" }}
              >
                Suggested hashtags
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {HASHTAGS.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[rgba(0,0,0,0.13)] bg-white px-4 py-2 text-[14px] font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <p className="mt-3.5 text-[14px] text-[#6b6459]">
                These are suggestions. Use whichever suit your post.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <CopyButton
                  text={HASHTAGS.join(" ")}
                  label="Copy hashtags"
                  className={btnLine}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="pb-20 md:pb-24">
        <div className="mx-auto max-w-[1100px] px-5 md:px-6">
          <h2
            className="max-w-[22ch] font-sans tracking-[-0.025em] text-[#000000] balance"
            style={h2Style}
          >
            Something missing?
          </h2>
          <p className="mt-6 max-w-[62ch] text-[16.5px] leading-[1.7] text-[#2a2521]">
            For anything else, email us at {ORG.email}. We aim to reply within
            two business days.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`mailto:${ORG.email}?subject=Media`} className={btnRed}>
              <Mail className="h-4 w-4" strokeWidth={2} />
              Email us
            </a>
            <Link href="/contact" className={btnLine}>
              Contact form
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Handle({
  name,
  network,
  children,
}: {
  name: string;
  network: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 rounded-[8px] border border-[rgba(0,0,0,0.08)] bg-white px-4 py-3.5">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#000000] text-white">
        {children}
      </span>
      <div>
        <b className="block text-[15px] font-medium">{name}</b>
        <small className="text-[12.5px] text-[#6b6459]">{network}</small>
      </div>
    </li>
  );
}

function InstagramIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}
