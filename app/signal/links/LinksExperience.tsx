"use client";

/**
 * Signal event-day link tree. Two screens: an Acknowledgement of Country
 * that fades in on load, then (on Continue) a fade-out/fade-in crossfade
 * into the resource hub itself. Every tile on the hub opens an in-page
 * modal (`TileModal`) rather than navigating away or opening a file, per
 * Will's direction: someone who scanned a QR code for this shouldn't lose
 * the page mid-event.
 *
 * Deliberately NOT built from the public site's usual page components (Nav,
 * Footer, PageHero, the cream/ink system): this reads as a standalone
 * microsite reached only via a QR code on the day, distinct from
 * tedxnewy.com.au's normal browsing experience. It borrows Signal's own
 * dark palette (bg #0d0503, accent #e02214, the "Authenticity" event
 * artwork) so it still feels like the same event, just a different kind of
 * page. `motion/react` (already a dependency — see components/Nav.tsx)
 * drives every transition here, matching how the rest of the site animates.
 *
 * **Entry fade, and why it no longer flickers.** The whole shell used to be
 * a `motion.div` with `initial={{opacity:0}}` inside `AnimatePresence`.
 * That flickered on load: Next.js server-renders this "use client"
 * component's markup with NO inline style (motion's effects only run on
 * the client), so the very first paint showed the fully-opaque page, and
 * only once React hydrated did Framer Motion's layout effect snap opacity
 * to 0 and animate it back up — a visible flash-then-fade rather than one
 * clean fade. The fix is a plain `mounted` boolean driving a CSS
 * `transition-opacity` class on the root element instead: `useState(false)`
 * renders `opacity-0` in the SERVER-rendered HTML too (no JS needed for
 * that first value to be correct), so the very first paint is already
 * invisible, and a single `useEffect` flips it true one frame later for one
 * smooth fade with nothing to snap. `AnimatePresence initial={false}` on
 * the inner screen-swap then stops Framer Motion from ALSO trying to fade
 * in the acknowledgement screen on that same first mount, which would have
 * stacked a second, independently-timed fade on top of this one.
 *
 * **Mobile scroll fix.** The root used to be `overflow-hidden`, which was
 * fine on desktop (everything fit) but meant that on a short phone
 * viewport, anything that didn't fit was silently CLIPPED rather than
 * scrollable — a dead swipe gesture with nothing visibly happening reads
 * exactly like the "glitchy, not smooth" mobile-only report this was.
 * `overflow-hidden` is gone from the root; the actual content column below
 * the fixed background is `overflow-y-auto` with momentum scrolling and
 * `overscroll-behavior: contain`, so on a phone too short for the tile
 * grid to fit at once, it scrolls properly instead of eating the gesture.
 * `100dvh` (not `100vh`) is used throughout, which already accounts for
 * iOS Safari's dynamic toolbar changing the visible viewport height.
 *
 * **Tile-open flicker (root cause found, third report of flicker/jank on
 * this page — this one was real, not a guess).** Will kept seeing the
 * link-tree page itself flash briefly right as a tile's modal opened, on
 * mobile only. The mechanism: `TileModal`'s scroll lock (see that file)
 * pins `document.body` in place with `position: fixed` — the standard fix
 * for iOS Safari not respecting `overflow: hidden` on `<body>`. That was
 * correct advice for a page that scrolls at the `<body>` level. This page
 * does not, not since the mobile-scroll fix above moved scrolling onto
 * this component's own inner `overflow-y-auto` div. Locking `<body>` (which
 * was never the scrolling element to begin with) locked nothing real: the
 * actual scroll container underneath a modal was still free to move. Any
 * residual scroll momentum from the tap gesture that opened the modal, or
 * any layout nudge while the modal's content loaded, could shift that
 * still-unlocked background layer during the same ~280ms the modal's scrim
 * is still semi-transparent and animating up to its resting 88% opacity —
 * so what Will saw was a genuinely MOVING background, briefly visible
 * through a not-yet-fully-opaque scrim, not a static one. `anyModalOpen`
 * below drives this div's own `overflow` directly (React state, not a
 * second imperative DOM effect racing the first), which is the actual fix:
 * the one real scrollable element on this page now genuinely stops moving
 * the instant a modal opens. `TileModal`'s own body-level lock stays as a
 * defence-in-depth (harmless here, and correct if that shell is ever reused
 * on a normally-scrolling page), but it was never the mechanism doing the
 * real work on THIS page.
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  CalendarDays,
  FileText,
  Handshake,
  Info,
  Mic2,
  Sparkles,
} from "lucide-react";
import PhotoFill from "@/components/PhotoFill";
import SpeakerModal from "@/components/SpeakerModal";
import type { SpeakerWithTalk } from "@/lib/cms-content";
import type { Sponsor } from "@/lib/data";
import { SIGNAL_AGENDA, SIGNAL_LOGO_SCALE } from "@/lib/signal-content";
import TileModal from "./TileModal";
import GuideGallery from "./GuideGallery";

type Screen = "acknowledgement" | "links";
type TileKey =
  | "program"
  | "speakers"
  | "guide"
  | "sponsors"
  | "about"
  | "signal-activity";

type Tile = {
  key: TileKey;
  label: string;
  icon: typeof CalendarDays;
  badge?: string;
  muted?: boolean;
};

const TILES: Tile[] = [
  { key: "program", label: "Program", icon: CalendarDays },
  { key: "speakers", label: "Speakers", icon: Mic2 },
  { key: "guide", label: "Event Week Guide", icon: FileText },
  { key: "sponsors", label: "Sponsors", icon: Handshake },
  { key: "about", label: "About TEDxNewy", icon: Info },
  {
    key: "signal-activity",
    label: "Signal Activity",
    icon: Sparkles,
    badge: "Soon",
    muted: true,
  },
];

type AboutStats = { staged: number; talks: number; volunteers: number };

export default function LinksExperience({
  speakers,
  sponsors,
  aboutStats,
}: {
  speakers: SpeakerWithTalk[];
  sponsors: Sponsor[];
  aboutStats: AboutStats;
}) {
  const [screen, setScreen] = useState<Screen>("acknowledgement");
  const [openTile, setOpenTile] = useState<TileKey | null>(null);
  const anyModalOpen = openTile !== null;

  // Single, CSS-driven entry fade (see the file-level note on why this
  // replaced a framer-motion `initial` fade). `mounted` starts false on
  // both server and client, so the very first paint is already opacity-0;
  // flipping it true one frame later is the only state change involved.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Warm the browser cache for speaker and sponsor photos as soon as the
  // link tree is up, well before anyone has tapped a tile, so those
  // modals' images are already decoded by the time they open (a real
  // contributor to reported modal-open jank). The Event Week Guide's own
  // 9 pages are deliberately NOT in this list any more: an earlier pass
  // eagerly fetched all nine full-size originals the moment this screen
  // loaded, which worked against "loads fast" on mobile data far more than
  // it helped one modal's open animation. GuideGallery now preloads only
  // the page either side of whichever one is showing.
  useEffect(() => {
    if (screen !== "links") return;
    const urls = [
      ...speakers.map((s) => s.image).filter((u): u is string => Boolean(u)),
      ...sponsors.map((s) => s.logoUrl).filter((u): u is string => Boolean(u)),
    ];
    const images = urls.map((src) => {
      const img = new window.Image();
      img.src = src;
      return img;
    });
    return () => {
      images.forEach((img) => {
        img.src = "";
      });
    };
  }, [screen, speakers, sponsors]);

  return (
    <div
      className={`relative min-h-[100dvh] w-full bg-[#0d0503] text-white transition-opacity duration-700 ease-out ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop: the 2026 event artist's "Authenticity" piece. Fixed so it
          holds steady regardless of whether the content column below ends
          up scrolling. */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/signal-authenticity-artwork.webp"
          alt=""
          fill
          priority
          className="object-cover opacity-[0.34]"
          sizes="100vw"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(13,5,3,0.55) 0%, rgba(13,5,3,0.7) 45%, rgba(13,5,3,0.9) 100%)",
          }}
        />
        <div className="grain grain-dark pointer-events-none absolute inset-0 opacity-30" />
      </div>

      {/* The scrollable content layer. overflow-y-auto (not overflow-hidden
          on the root, see file note) with momentum scrolling and
          overscroll-behavior: contain, so anything that doesn't fit a short
          phone viewport scrolls smoothly instead of getting clipped.
          Switches to overflow-hidden the instant any modal is open — see
          the file-level note on the tile-open flicker: this is the ACTUAL
          scroll lock for this page, not TileModal's own body-level one. */}
      <div
        className={`relative z-10 flex min-h-[100dvh] w-full flex-col overscroll-contain ${
          anyModalOpen ? "overflow-hidden" : "overflow-y-auto"
        }`}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* initial={false}: this AnimatePresence's children should NOT play
            an enter animation on the very first mount (that's the root
            div's own CSS fade above, already in progress). It still
            animates normally once `screen` actually changes afterwards. */}
        <AnimatePresence mode="wait" initial={false}>
          {screen === "acknowledgement" ? (
            <motion.div
              key="acknowledgement"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex min-h-[100dvh] w-full flex-1 items-center justify-center px-6 py-16"
            >
              <AcknowledgementScreen onContinue={() => setScreen("links")} />
            </motion.div>
          ) : (
            <motion.div
              key="links"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex min-h-[100dvh] w-full flex-1 flex-col items-center px-5 py-6 md:px-6 md:py-10"
            >
              <LinksScreen onOpenTile={setOpenTile} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* One modal instance, fed different content per tile, rather than a
          separate modal (and separate open/close state) per tile. */}
      <TileModal
        open={openTile === "program"}
        onClose={() => setOpenTile(null)}
        title="Program"
        subtitle="Saturday 24 October"
      >
        <ProgramModalContent />
      </TileModal>

      <TileModal
        open={openTile === "speakers"}
        onClose={() => setOpenTile(null)}
        title="Speakers"
        subtitle="The 2026 Signal lineup"
      >
        <SpeakersModalContent speakers={speakers} />
      </TileModal>

      <TileModal
        open={openTile === "guide"}
        onClose={() => setOpenTile(null)}
        title="Event Week Guide"
        subtitle="Offers across event week, 19 to 25 October"
      >
        <GuideGallery />
      </TileModal>

      <TileModal
        open={openTile === "sponsors"}
        onClose={() => setOpenTile(null)}
        title="Sponsors"
        subtitle="Made possible by"
      >
        <SponsorsModalContent sponsors={sponsors} />
      </TileModal>

      <TileModal
        open={openTile === "about"}
        onClose={() => setOpenTile(null)}
        title="About TEDxNewy"
      >
        <AboutModalContent stats={aboutStats} />
      </TileModal>

      <TileModal
        open={openTile === "signal-activity"}
        onClose={() => setOpenTile(null)}
        title="Signal Activity"
      >
        <SignalActivityModalContent />
      </TileModal>
    </div>
  );
}

function AcknowledgementScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="w-full max-w-[520px] text-center">
      <Image
        src="/brand/tedxnewy-white.png"
        alt="TEDxNewy"
        width={376}
        height={100}
        className="mx-auto h-auto w-[190px] opacity-90"
        priority
      />
      <div
        className="mt-8 font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
        style={{ letterSpacing: "0.24em" }}
      >
        Acknowledgement of Country
      </div>
      <p className="mt-6 text-[16px] leading-[1.75] text-white/85 md:text-[17px]">
        TEDxNewy acknowledges the Awabakal and Worimi people, the Traditional
        Custodians of the land on which we gather today.
      </p>
      <p className="mt-4 text-[16px] leading-[1.75] text-white/85 md:text-[17px]">
        We pay our respects to Elders past and present, and extend that
        respect to all Aboriginal and Torres Strait Islander people joining
        us.
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#e02214] px-8 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        Continue
        <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}

function LinksScreen({
  onOpenTile,
}: {
  onOpenTile: (key: TileKey) => void;
}) {
  return (
    <div className="flex w-full max-w-[420px] flex-1 flex-col">
      <div className="flex flex-col items-center text-center">
        <Image
          src="/brand/tedxnewy-white.png"
          alt="TEDxNewy"
          width={376}
          height={100}
          className="h-auto w-[160px] opacity-90"
        />
        <div
          className="mt-4 font-sans tracking-[-0.02em] text-white"
          style={{
            fontSize: "clamp(2rem, 9vw, 3rem)",
            fontWeight: 500,
            lineHeight: 0.95,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          SIGNAL
        </div>
        <p className="mt-2 text-[13px] font-medium text-white/60">
          Saturday 24 October &middot; Conservatorium of Music
        </p>
      </div>

      {/* 3 rows x 2 columns: every tile fits on one phone screen without
          scrolling on a typical modern device (Will's ask). Icon + label
          only, no per-tile description any more, which is what makes a
          6-tile grid fit comfortably instead of cramped. */}
      <div className="mt-6 grid flex-1 grid-cols-2 gap-3">
        {TILES.map((tile) => (
          <TileCard key={tile.key} tile={tile} onOpen={onOpenTile} />
        ))}
      </div>

      <div className="pb-1 pt-4 text-center">
        <Link
          href="/"
          className="text-[12px] font-medium text-white/45 underline-offset-4 hover:text-white/70 hover:underline"
        >
          tedxnewy.com.au
        </Link>
      </div>
    </div>
  );
}

function TileCard({
  tile,
  onOpen,
}: {
  tile: Tile;
  onOpen: (key: TileKey) => void;
}) {
  const Icon = tile.icon;

  return (
    <button
      type="button"
      onClick={() => onOpen(tile.key)}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-5 text-center transition-all hover:-translate-y-0.5 ${
        tile.muted
          ? "border-dashed border-white/15 bg-white/[0.02] hover:border-white/25"
          : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]"
      }`}
    >
      {tile.badge && (
        <span className="absolute right-2.5 top-2.5 inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-white/55">
          {tile.badge}
        </span>
      )}
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[#ff9b8f]">
        <Icon className="h-5.5 w-5.5" strokeWidth={1.8} />
      </span>
      <span className="font-sans text-[13.5px] font-medium leading-tight tracking-[-0.01em] text-white">
        {tile.label}
      </span>
    </button>
  );
}

function ProgramModalContent() {
  return (
    <div className="divide-y divide-white/10">
      {SIGNAL_AGENDA.map((item) => (
        <div key={item.title} className="py-5 first:pt-0 last:pb-0">
          <div
            className="font-mono text-[12px] font-semibold text-[#ff9b8f]"
            style={{ letterSpacing: "0.04em" }}
          >
            {item.time}
          </div>
          <h3 className="mt-1.5 font-sans text-[16px] font-medium tracking-[-0.01em] text-white">
            {item.title}
          </h3>
          <p className="mt-1 text-[14px] leading-[1.55] text-white/70">
            {item.body}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * A compact, mobile-first speaker grid built specifically for this page,
 * NOT a reuse of /signal's own SpeakerLineup / SignalSpeakerCard /
 * SignalSpeakerPuzzle (Will's explicit direction: this page needs its own
 * simpler resource-hub look, not the main event page's showcase pattern).
 * Photo, name, one-line title.
 *
 * **Two bugs fixed here, both confirmed against the actual code, not
 * guessed:**
 *
 * 1. Photos weren't rendering. The very first version used a raw
 *    `next/image` `<Image>` with a Supabase Storage URL. next/image
 *    refuses to optimise a remote host that isn't whitelisted in
 *    `next.config.js` (`images.remotePatterns`), and this repo's config
 *    has no such whitelist. Every other place on the site that shows a
 *    speaker photo (`SignalSpeakerCard`, `SpeakerModal`) goes through
 *    `components/PhotoFill.tsx` instead, which detects an absolute
 *    `https://` URL and passes `unoptimized` for exactly that reason (see
 *    that file's own comment). Using a bare `<Image>` here skipped that
 *    check, so the photo request was rejected. Swapped to `PhotoFill`.
 * 2. Tapping a speaker used to navigate to `/signal?speaker=<slug>` to
 *    reuse that page's bio modal. Will wants to never leave this page.
 *    `SpeakerModal` (the actual bio-rendering component `/signal` uses:
 *    photo, name, title, blurb, talk video, socials, prev/next) is a
 *    plain, self-contained component that takes `speakers`/`index` as
 *    props — it doesn't require `/signal`'s `SpeakerLineup` wrapper to
 *    render, `SpeakerLineup` is just ONE way of driving it (adds URL sync
 *    this page doesn't want). So it's rendered here directly, driven by
 *    local `activeIndex` state, stacked on top of this modal (it's
 *    `fixed`, z-[100], already higher than TileModal's z-[60] — that
 *    layering was written for exactly this kind of nesting). No
 *    navigation, no URL change, same page throughout.
 */
function SpeakersModalContent({ speakers }: { speakers: SpeakerWithTalk[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (speakers.length === 0) {
    return (
      <p className="text-[14.5px] leading-[1.6] text-white/70">
        Our lineup for Signal is still being locked in. Check back soon, or
        keep an eye on Instagram (@tedxnewy) for the first announcements.
      </p>
    );
  }

  const close = () => setActiveIndex(null);
  const prev = () =>
    setActiveIndex((i) =>
      i === null ? null : (i - 1 + speakers.length) % speakers.length,
    );
  const next = () =>
    setActiveIndex((i) => (i === null ? null : (i + 1) % speakers.length));

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {speakers.map((s, i) => {
          const title = cleanText(s.title);
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => setActiveIndex(i)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-left transition-colors hover:border-white/20 hover:bg-white/[0.07]"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-[#1a0604]">
                {s.image && (
                  <PhotoFill
                    src={s.image}
                    alt={s.name}
                    sizes="200px"
                    hoverZoom={false}
                  />
                )}
              </div>
              <div className="p-3">
                <div className="line-clamp-1 text-[14px] font-medium tracking-[-0.005em] text-white">
                  {s.name}
                </div>
                {title && (
                  <div className="mt-0.5 line-clamp-1 text-[12px] text-white/55">
                    {title}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <Link
        href="/signal#speakers"
        className="mt-6 flex items-center justify-center gap-1.5 text-[13.5px] font-medium text-white/70"
      >
        See the full lineup on our site
        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
      </Link>

      <SpeakerModal
        speakers={speakers}
        index={activeIndex}
        onClose={close}
        onPrev={prev}
        onNext={next}
      />
    </div>
  );
}

// Drops the placeholder copy the CMS uses before a real value is entered
// (same convention as components/SpeakerModal.tsx's own `clean` helper).
function cleanText(v?: string) {
  return v && !v.toLowerCase().includes("to be added") ? v : "";
}

function SponsorsModalContent({ sponsors }: { sponsors: Sponsor[] }) {
  if (sponsors.length === 0) {
    return (
      <p className="text-[14.5px] leading-[1.6] text-white/70">
        Our Signal partners are being confirmed. Check{" "}
        <Link href="/sponsors" className="underline underline-offset-2">
          tedxnewy.com.au/sponsors
        </Link>{" "}
        for the full, current list.
      </p>
    );
  }

  return (
    <div>
      <p className="text-[14.5px] leading-[1.65] text-white/80">
        None of this happens without the organisations who back us. Take a
        moment today to check out our partners below, they&rsquo;re a huge
        part of what makes Signal possible.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-7">
        {sponsors.map((s) => {
          const logo = s.logoUrl ? (
            <div
              className="flex items-center justify-center"
              style={{ height: 32 * (SIGNAL_LOGO_SCALE[s.name] ?? 1) }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.logoUrl}
                alt={s.name}
                style={{ maxWidth: 220 * (SIGNAL_LOGO_SCALE[s.name] ?? 1) }}
                className="h-full w-auto object-contain brightness-0 invert opacity-80"
              />
            </div>
          ) : (
            <div className="font-sans text-[16px] font-medium tracking-[-0.01em] text-white/80">
              {s.name}
            </div>
          );

          return (
            <div key={s.name} className="flex flex-col items-center gap-2">
              {s.websiteUrl ? (
                <a
                  href={s.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Visit ${s.name}`}
                  className="transition-opacity hover:opacity-100"
                >
                  {logo}
                </a>
              ) : (
                logo
              )}
            </div>
          );
        })}
      </div>
      <Link
        href="/sponsors"
        className="mt-7 flex items-center justify-center gap-1.5 text-[13.5px] font-medium text-white/70"
      >
        See all our partners
        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
      </Link>
    </div>
  );
}

function AboutModalContent({ stats }: { stats: AboutStats }) {
  return (
    <div>
      <p className="text-[14.5px] leading-[1.7] text-white/80">
        TEDxNewy is an independently licensed TED event in Newcastle,
        Australia, on Awabakal and Worimi Country.
      </p>
      <p className="mt-3 text-[14.5px] leading-[1.7] text-white/80">
        We believe in the power of ideas, and in giving a platform to those
        worth sharing.
      </p>
      <p className="mt-3 text-[14.5px] leading-[1.7] text-white/80">
        In a world where anyone can share an opinion, we care about
        curating credible, reliable, local voices, and sharing with the
        world the innovation and thinking happening right here in Newy.
      </p>
      <p className="mt-3 text-[14.5px] leading-[1.7] text-white/80">
        We&rsquo;re not-for-profit and 100% volunteer-run, formerly TEDxCooks
        Hill.
      </p>

      <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-5">
        {[
          { n: String(stats.staged), l: "events staged since 2024" },
          { n: String(stats.talks), l: "talks online" },
          { n: String(stats.volunteers), l: "volunteers" },
        ].map((s) => (
          <div key={s.l}>
            <dt className="sr-only">{s.l}</dt>
            <dd className="font-sans text-[24px] font-medium leading-none tracking-[-0.02em] text-white">
              {s.n}
            </dd>
            <dd className="mt-1 text-[11.5px] text-white/55">{s.l}</dd>
          </div>
        ))}
      </dl>

      <Link
        href="/mission"
        className="mt-7 flex items-center justify-center gap-1.5 text-[13.5px] font-medium text-white/70"
      >
        Read our full story
        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
      </Link>
    </div>
  );
}

function SignalActivityModalContent() {
  return (
    <div className="text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] text-[#ff9b8f]">
        <Sparkles className="h-6 w-6" strokeWidth={1.8} />
      </span>
      <p className="mt-5 text-[14.5px] leading-[1.6] text-white/80">
        Something fun for the break is in the works: a live, digitally
        interactive intermission challenge.
      </p>
      <p className="mt-3 text-[14.5px] leading-[1.6] text-white/60">
        Not built yet. Check back closer to the day.
      </p>
    </div>
  );
}
