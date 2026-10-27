import PhotoFill from "@/components/PhotoFill";
import { Button } from "@/components/ds";

/**
 * The homepage hero between seasons (2026-10-27): the sold-out Signal room,
 * full bleed under a maroon scrim, with the house line on top. It replaces
 * the text-only `CursorSpotlightHero` on the homepage; that component still
 * exists for any page that wants it.
 *
 * The photo is committed in `public/images/home/` rather than read from the
 * CMS because the Signal gallery is not published yet. Once it is, the hero
 * can keep this file or swap to a gallery photo; nothing else depends on it.
 *
 * Copy rules worth keeping: the Signal talks are still being edited, so
 * nothing here offers to play them. "Relive the 2026 season" goes to the
 * season row further down, not to /talks.
 */
export default function HomeHero() {
  return (
    <section className="relative flex min-h-[640px] flex-col bg-[#2a0604] text-white md:min-h-[calc(100svh-var(--banner-offset,0px))]">
      <PhotoFill
        src="/images/home/signal-audience.webp"
        alt="A full house watching Signal at the Newcastle Conservatorium of Music, October 2026."
        sizes="100vw"
        priority
        hoverZoom={false}
        objectPosition="center 35%"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(42,6,4,0.72) 0%, rgba(42,6,4,0.35) 38%, rgba(42,6,4,0.88) 78%, #2a0604 100%)",
        }}
      />

      <div className="relative mx-auto mt-auto flex w-full max-w-[1240px] flex-col gap-7 px-5 pb-14 pt-32 md:px-10 md:pb-20">
        <h1
          className="max-w-[12ch] font-sans text-white balance"
          style={{
            fontSize: "clamp(3.5rem, 9vw, 8rem)",
            lineHeight: 0.92,
            letterSpacing: "-0.035em",
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          Ideas change everything.
        </h1>
        <p className="max-w-[40rem] text-[18px] leading-[1.5] text-white/85 md:text-[20px]">
          Ideas worth spreading, from Newcastle. Our 2026 season closed with a
          sold-out Signal at the Conservatorium. Thank you to everyone who
          filled the room. 2027 is already taking shape.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="#join" variant="accent" size="lg">
            Be first to hear about 2027
          </Button>
          <Button href="#season" variant="secondary" size="lg" onDark>
            Relive the 2026 season
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-6 text-[14px] text-white/75">
          <span className="inline-flex items-center gap-2 font-semibold text-white">
            <span aria-hidden className="h-2 w-2 rounded-full bg-[#e62b1e]" />
            Signal sold out
          </span>
          <span>24 October 2026 · Newcastle Conservatorium of Music</span>
        </div>
      </div>
    </section>
  );
}
