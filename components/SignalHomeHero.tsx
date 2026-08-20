import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PhotoFill from "@/components/PhotoFill";

/**
 * The homepage hero WHILE TICKETS ARE ON SALE. Swapped in for
 * CursorSpotlightHero from app/page.tsx on SIGNAL_LIVE, so opening sales
 * changes the homepage in the same one-line flip that opens /signal, the
 * nav CTA, the site banner and the pop-up. When sales close, flipping the
 * flag back brings "Ideas that refuse to sit still" straight back; that
 * hero is paused, not deleted.
 *
 * Deliberately a split image/text layout rather than another full-bleed
 * photo with the words on top: /signal's own hero is already that, and the
 * foyer shot is a wide crowd scene whose subject sits right where a centred
 * headline would land. Splitting keeps the photo readable and the type on a
 * flat surface. On a phone the photo leads and the panel sits under it, so
 * the first thing above the fold is still the room, not a wall of text.
 *
 * Server component on purpose: no interactivity here, so the homepage keeps
 * its hero in the SSR HTML (the old hero is a client component only because
 * of its cursor spotlight).
 */
const HERO_LINKS = [
  { href: "/signal", label: "Signal · 24 October" },
  { href: "/talks", label: "Watch past talks" },
  { href: "/partner", label: "Partner with us" },
];

export default function SignalHomeHero() {
  return (
    <section className="relative bg-[#2a0604] text-white">
      {/* The whole hero, quick links included, is meant to be one screen.
          `100vh` here would push the links row out of view, so the split
          takes the viewport MINUS the links row (63px at md) and minus the
          banner, which `body` has already used as its padding-top. */}
      <div className="grid md:min-h-[calc(100vh-var(--banner-offset,0px)-63px)] md:grid-cols-2">
        {/* PHOTO — first in the markup so it leads on a phone, and moved to
            the right-hand column from md up with `md:order-2`. */}
        <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/9] md:order-2 md:aspect-auto md:h-full">
          <PhotoFill
            src="/images/signal-home-hero.webp"
            alt="A full house of guests watching a talk at a TEDxNewy event."
            sizes="(min-width: 768px) 50vw, 100vw"
            priority
            hoverZoom={false}
          />
          {/* Blends the photo into the panel: downwards on a phone (where
              the panel is below it), leftwards on desktop (where it is
              beside it), so there is never a hard seam between the two. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgba(42,6,4,0.35)] via-[rgba(42,6,4,0)] to-[rgba(42,6,4,0.9)] md:bg-gradient-to-r md:from-[rgba(42,6,4,0.98)] md:via-[rgba(42,6,4,0.18)] md:to-[rgba(42,6,4,0)]"
          />
          {/* A second, vertical pass on desktop only. The left-to-right fade
              alone leaves the photo's bright ceiling reading as a separate
              image sitting next to the panel rather than part of it. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden md:block"
            style={{
              background:
                "linear-gradient(180deg, rgba(42,6,4,0.45) 0%, rgba(42,6,4,0) 30%, rgba(42,6,4,0) 70%, rgba(42,6,4,0.5) 100%)",
            }}
          />
        </div>

        {/* PANEL */}
        <div className="relative flex items-center overflow-hidden md:order-1">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 20% 30%, rgba(224,34,20,0.42) 0%, rgba(138,13,5,0.22) 45%, rgba(42,6,4,0) 72%)",
            }}
          />
          <div className="grain grain-dark pointer-events-none absolute inset-0 opacity-40" />

          <div className="relative z-10 w-full px-6 py-16 md:ml-auto md:max-w-[640px] md:px-12 md:py-24 lg:px-16">
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#ff3626] opacity-70 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff6e62]" />
              </span>
              <span
                className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
                style={{ letterSpacing: "0.26em" }}
              >
                Tickets on sale now
              </span>
            </div>

            {/* Set as the event's name, matching /signal's own hero, rather
                than as a sentence. Weight 500 and the tighter tracking are
                what stop a single all-caps word reading as a banner. */}
            <h1
              className="hero-entrance hero-delay-1 mt-6 font-sans tracking-[-0.03em] text-white"
              style={{
                fontSize: "clamp(4rem, 9vw, 7.5rem)",
                lineHeight: 0.94,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              SIGNAL.
            </h1>

            <p
              className="hero-entrance hero-delay-2 mt-7 max-w-[46ch] text-white/85"
              style={{
                fontSize: "clamp(1rem, 1.4vw, 1.2rem)",
                lineHeight: 1.6,
              }}
            >
              TEDxNewy&rsquo;s biggest stage yet: an afternoon of talks and
              performances, and the chance to see, hear and speak with the
              people sending signals worth following.
            </p>

            <div className="hero-entrance hero-delay-3 mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                href="/signal"
                className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                Check out Signal
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </Link>
              <span className="text-[14px] font-medium text-white/70">
                Saturday 24 October
                <span className="mx-2 text-white/30">·</span>
                Conservatorium of Music
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links row, the same shape the paused hero carries, so the
          homepage keeps its shortcuts into the rest of the site. */}
      <div className="relative z-10 border-t border-white/15 bg-black/20">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
          {HERO_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group flex items-center justify-between gap-3 px-6 py-4 text-[11.5px] font-medium uppercase tracking-[0.14em] text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white md:justify-center md:px-8 md:py-5"
            >
              <span>{l.label}</span>
              <ArrowUpRight
                className="h-3.5 w-3.5 shrink-0 text-white/50 transition-colors group-hover:text-[#ff9b8f]"
                strokeWidth={2.5}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
