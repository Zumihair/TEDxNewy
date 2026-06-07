import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getSpeakers, getTalks } from "@/lib/cms-content";
import PhotoFill from "@/components/PhotoFill";

// Re-fetch from Supabase every 60s so admin edits land live without redeploys
export const revalidate = 60;

export default async function SpeakerDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [speakers, talks] = await Promise.all([getSpeakers(), getTalks()]);
  const speaker = speakers.find((s) => s.slug === slug);
  if (!speaker) notFound();

  const idx = speakers.findIndex((s) => s.slug === slug);
  const prev = speakers[(idx - 1 + speakers.length) % speakers.length];
  const next = speakers[(idx + 1) % speakers.length];
  const others = speakers.filter((s) => s.slug !== slug).slice(0, 3);

  const eventLabel =
    speaker.year === 2025
      ? "Reframe · TEDxCooksHill"
      : speaker.year === 2024
        ? "Beyond Boundaries · TEDxCooksHill"
        : `TEDxNewy · ${speaker.year}`;
  const venueLabel =
    speaker.year === 2025
      ? "Conservatorium of Music · October 2025"
      : speaker.year === 2024
        ? "The Playhouse · October 2024"
        : "Newcastle";

  const clean = (v: string | undefined) =>
    v && !v.includes("to be added") ? v : "";
  const titleClean = clean(speaker.title);
  const bioClean = clean(speaker.blurb);

  // Linked talk by id, falling back to a talk that points back at this
  // speaker, then to the legacy free-text talk title.
  const talk =
    talks.find((t) => speaker.talkId && t.id === speaker.talkId) ??
    talks.find((t) => t.speakerSlug === speaker.slug) ??
    null;
  const talkTitle = talk?.title ?? clean(speaker.talk);
  const talkBlurb = talk?.blurb ?? "";
  const youtubeId = talk?.youtubeId;
  const hasTalk = Boolean(talkTitle || youtubeId);

  const socials = [
    speaker.linkedinUrl
      ? { label: "LinkedIn", href: speaker.linkedinUrl, Icon: LinkedInIcon }
      : null,
    speaker.instagramUrl
      ? { label: "Instagram", href: speaker.instagramUrl, Icon: InstagramIcon }
      : null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);

  const firstName = speaker.name.split(" ")[0];

  return (
    <>
      {/* HEADER ===================================================== */}
      <section className="bg-white pt-32 pb-16 md:pt-40">
        <div className="mx-auto max-w-[1100px] px-5 md:px-6">
          <Link
            href="/speakers"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase text-[#6b6459] transition hover:text-[#e02214]"
            style={{ letterSpacing: "0.22em" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
            All speakers
          </Link>

          <div className="mt-12 grid gap-10 md:grid-cols-[1fr_minmax(0,400px)] md:gap-16">
            <div>
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
                style={{ letterSpacing: "0.24em" }}
              >
                {eventLabel}
              </div>
              <h1
                className="mt-6 font-sans tracking-[-0.025em] text-[#141210] balance"
                style={{
                  fontSize: "clamp(2.5rem, 6vw, 5rem)",
                  lineHeight: 0.98,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                {speaker.name}
              </h1>
              {titleClean && (
                <p className="mt-5 max-w-[55ch] text-[17px] leading-[1.6] text-[#2a2521]">
                  {titleClean}
                </p>
              )}

              {socials.length > 0 && (
                <div className="mt-7 flex items-center gap-2.5">
                  {socials.map(({ label, href, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${speaker.name} on ${label}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(20,18,16,0.15)] text-[#6b6459] transition-colors hover:border-[#141210] hover:bg-[#141210] hover:text-white"
                    >
                      <Icon />
                    </a>
                  ))}
                </div>
              )}

              <div
                className="mt-7 font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
                style={{ letterSpacing: "0.22em" }}
              >
                {venueLabel}
              </div>
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] bg-[#1a1714]">
              {speaker.image && (
                <PhotoFill
                  src={speaker.image}
                  alt={speaker.name}
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TALK ======================================================= */}
      {hasTalk && (
        <section className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div className="grid gap-10 md:grid-cols-[200px_1fr] md:gap-16">
            <div
              className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
              style={{ letterSpacing: "0.24em" }}
            >
              The talk
            </div>
            <div className="max-w-[68ch] space-y-7">
              {talkTitle && (
                <h2
                  className="font-sans italic tracking-[-0.015em] text-[#141210]"
                  style={{
                    fontSize: "clamp(1.65rem, 3vw, 2.5rem)",
                    lineHeight: 1.1,
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 96',
                  }}
                >
                  &ldquo;{talkTitle}&rdquo;
                </h2>
              )}
              {youtubeId && (
                <div className="relative aspect-video overflow-hidden rounded-[var(--radius-md)] bg-black">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                    title={talkTitle || speaker.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              )}
              {talkBlurb && (
                <p className="text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
                  {talkBlurb}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* BIO ======================================================== */}
      {bioClean && (
        <section className="border-t border-[rgba(20,18,16,0.08)] bg-[#f9f5ec]">
          <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
            <div className="grid gap-10 md:grid-cols-[200px_1fr] md:gap-16">
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
                style={{ letterSpacing: "0.24em" }}
              >
                About {firstName}
              </div>
              <p className="max-w-[68ch] text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
                {bioClean}
              </p>
            </div>
          </div>
        </section>
      )}

      {!hasTalk && !bioClean && (
        <section className="mx-auto max-w-[1100px] px-5 py-16 md:px-6 md:py-20">
          <p className="max-w-[60ch] text-[16px] leading-[1.65] text-[#6b6459]">
            Talk title and full bio publish alongside the YouTube release.
            Subscribe on the home page to be first to know.
          </p>
        </section>
      )}

      {/* Prev / next ================================================ */}
      <section className="bg-[#f9f5ec]">
        <div className="mx-auto grid max-w-[1100px] gap-4 px-5 py-12 md:grid-cols-2 md:px-6">
          <Link
            href={`/speakers/${prev.slug}`}
            className="group rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f5ec]"
          >
            <div
              className="font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
              style={{ letterSpacing: "0.22em" }}
            >
              ← Previous
            </div>
            <div className="mt-3 font-sans text-[20px] font-medium tracking-[-0.015em] text-[#141210] group-hover:text-[#e02214]">
              {prev.name}
            </div>
          </Link>
          <Link
            href={`/speakers/${next.slug}`}
            className="group rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-6 text-right transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f5ec]"
          >
            <div
              className="font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
              style={{ letterSpacing: "0.22em" }}
            >
              Next →
            </div>
            <div className="mt-3 font-sans text-[20px] font-medium tracking-[-0.015em] text-[#141210] group-hover:text-[#e02214]">
              {next.name}
            </div>
          </Link>
        </div>
      </section>

      {/* Also on this stage ========================================= */}
      <section className="mx-auto max-w-[1100px] px-5 py-24 md:px-6 md:py-28">
        <div
          className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
          style={{ letterSpacing: "0.24em" }}
        >
          Also on this stage
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((s) => (
            <Link
              key={s.slug}
              href={`/speakers/${s.slug}`}
              className="group block focus-visible:outline-none"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] bg-[#1a1714]">
                {s.image && (
                  <PhotoFill
                    src={s.image}
                    alt={s.name}
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                )}
              </div>
              <div className="mt-4">
                <div className="font-sans text-[18px] font-medium tracking-[-0.01em] text-[#141210] group-hover:text-[#e02214]">
                  {s.name}
                </div>
                <div className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6b6459] group-hover:text-[#e02214]">
                  See the talk
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function LinkedInIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}
