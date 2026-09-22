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
 * **Entry and screen transitions are plain CSS on purpose.** Two earlier
 * attempts fought each other here. First the shell was a `motion.div` with
 * `initial={{opacity:0}}`, which flashed: Next.js server-renders a "use
 * client" component's markup with no inline style, so the first paint was
 * fully opaque and motion only snapped it to 0 after hydration. Replacing
 * that with a `mounted` boolean driving the root's opacity fixed the flash
 * but caused the opposite problem — the acknowledgement's own CSS entrance
 * animations start at FIRST PAINT, while the root was still gated on a
 * post-hydration flag, so the fade played out invisibly and the text
 * appeared to snap in fully formed.
 *
 * So: no hydration-gated opacity anywhere. The acknowledgement's entrance is
 * a pure CSS animation (`fade-in` in globals.css) that is correct in the
 * server-rendered HTML and needs no JavaScript to be right. The screen swap
 * is a CSS opacity transition that fades out, swaps while invisible, and
 * fades back in — so the incoming screen mounts and paints at zero opacity
 * instead of during its own animation, the same principle as `TileModal`.
 * `AnimatePresence mode="wait"` used to leave a gap where neither screen was
 * mounted, which read as a flash on the Continue tap.
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
 * **Tile-open flicker.** Reported four times, and the first three fixes each
 * found something real but not the thing people were actually seeing. The
 * mechanism, finally: several costs landed on the single frame a tile was
 * tapped, and the page's own backdrop made one of them unusually expensive.
 * `TileModal`'s file note has the full account; the part that lives here is
 * the backdrop itself. Its `.grain` overlay is `mix-blend-mode`, which forces
 * a read-back and re-composite of everything under it, so any full-viewport
 * repaint dragged the whole backdrop — image, gradient and blended grain —
 * through paint again. That is why it only ever showed on a phone: a desktop
 * GPU has the headroom to hide it. The backdrop is now isolated and promoted
 * to its own layer so it rasterises once, and `TileModal` no longer triggers
 * the document-wide reflow that was pulling it back in.
 *
 * `anyModalOpen` below still drives this div's own `overflow` directly, and
 * that stays the real scroll lock for this page — `TileModal` deliberately no
 * longer pins `<body>`, which never did anything here except force that
 * reflow.
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  FileText,
  Handshake,
  Info,
  Mic2,
  Sparkles,
} from "lucide-react";
import PhotoFill from "@/components/PhotoFill";
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

const SCREEN_FADE_MS = 420;

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

  // Screen swap: fade out, swap while invisible, fade back in. The swap
  // happening at zero opacity is the point — the incoming screen mounts and
  // paints before anything animates, same principle as TileModal.
  const [swapping, setSwapping] = useState(false);
  const goToLinks = () => {
    setSwapping(true);
    setTimeout(() => {
      setScreen("links");
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setSwapping(false)),
      );
    }, SCREEN_FADE_MS);
  };

  // Warm the browser cache for speaker and sponsor photos as soon as the
  // link tree is up, well before anyone has tapped a tile, so those
  // modals' images are already decoded by the time they open (a real
  // contributor to reported modal-open jank). The Event Week Guide is not
  // in this list: since its 2026-09-23 rebuild as real HTML (see
  // GuideGallery.tsx), only one of its 9 pages (the map) is an image at
  // all, and it's small enough not to need pre-warming.
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
      className="relative min-h-[100dvh] w-full bg-[#0d0503] text-white"
    >
      {/* Backdrop: the 2026 event artist's "Authenticity" piece. Fixed so it
          holds steady regardless of whether the content column below ends
          up scrolling.

          `isolation` + `translateZ(0)` are load-bearing, not cargo cult: the
          `.grain` overlay below is `mix-blend-mode`, which has to read back
          and re-composite everything beneath it. Left unisolated and
          unpromoted, any full-viewport repaint elsewhere on the page drags
          this whole layer — full-bleed image, gradient and blended grain —
          back through paint with it, which is what made opening a modal
          stutter on a phone while looking fine on desktop. Isolated and
          promoted, it rasterises once and stays a cached texture. */}
      <div
        className="fixed inset-0 z-0"
        style={{ isolation: "isolate", transform: "translateZ(0)" }}
      >
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
        <div
          className={`flex w-full flex-1 flex-col transition-opacity ease-in-out ${
            swapping ? "opacity-0" : "opacity-100"
          }`}
          style={{ transitionDuration: `${SCREEN_FADE_MS}ms` }}
        >
          {screen === "acknowledgement" ? (
            <div className="flex min-h-[100dvh] w-full flex-1 items-center justify-center px-6 py-16">
              <AcknowledgementScreen onContinue={goToLinks} />
            </div>
          ) : (
            <div className="flex min-h-[100dvh] w-full flex-1 flex-col items-center px-5 py-6 md:px-6 md:py-10">
              <LinksScreen onOpenTile={setOpenTile} />
            </div>
          )}
        </div>
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

// Slow, staggered entrance via the `fade-in` utilities in globals.css.
// Deliberately a pure CSS animation on server-rendered markup and NOT gated
// behind any mounted/hydration state: an earlier version gated the whole
// shell's opacity on a post-hydration flag while these animations ran from
// first paint, so the fade played out while the page was still invisible and
// the acknowledgement appeared to snap in fully formed.
function AcknowledgementScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="w-full max-w-[520px] text-center">
      <div className="fade-in">
        <Image
          src="/brand/tedxnewy-white.png"
          alt="TEDxNewy"
          width={376}
          height={100}
          className="mx-auto h-auto w-[190px] opacity-90"
          priority
        />
      </div>
      <div
        className="fade-in fade-in-d1 mt-8 font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
        style={{ letterSpacing: "0.24em" }}
      >
        Acknowledgement of Country
      </div>
      <p className="fade-in fade-in-d2 mt-6 text-[16px] leading-[1.75] text-white/85 md:text-[17px]">
        TEDxNewy acknowledges the Awabakal and Worimi people, the Traditional
        Custodians of the land on which we gather today.
      </p>
      <p className="fade-in fade-in-d3 mt-4 text-[16px] leading-[1.75] text-white/85 md:text-[17px]">
        We pay our respects to Elders past and present, and extend that
        respect to all Aboriginal and Torres Strait Islander people joining
        us.
      </p>
      <div className="fade-in fade-in-d4">
        <button
          type="button"
          onClick={onContinue}
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#e02214] px-8 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          Continue
          <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
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
 * 2. Tapping a speaker first navigated to `/signal?speaker=<slug>`, which
 *    left this page — the one thing this page exists not to do. The second
 *    attempt rendered the site's own `SpeakerModal` stacked on top at
 *    z-[100], which kept people here but put a modal inside a modal: its
 *    header rendered underneath TileModal's, cropped. Now the bio is just
 *    another view of the SAME modal (`SpeakerDetail` below) — the tile
 *    modal is already near-fullscreen, so there was never anything for a
 *    second layer to add.
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

  const step = (delta: number) =>
    setActiveIndex((i) =>
      i === null ? null : (i + delta + speakers.length) % speakers.length,
    );

  if (activeIndex !== null) {
    return (
      <SpeakerDetail
        speaker={speakers[activeIndex]}
        position={activeIndex}
        total={speakers.length}
        onBack={() => setActiveIndex(null)}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
      />
    );
  }

  // Three across: this is the whole lineup, and it has to land on one screen
  // without scrolling on a small phone, so the grid carries photo and name
  // only. Everything else lives in the detail view.
  return (
    <div className="grid grid-cols-3 gap-x-2.5 gap-y-4">
      {speakers.map((s, i) => (
        <button
          key={s.slug}
          type="button"
          onClick={() => setActiveIndex(i)}
          className="group flex flex-col text-left"
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-[#1a0604] transition-colors group-hover:border-white/25">
            {s.image && (
              <PhotoFill
                src={s.image}
                alt={s.name}
                sizes="140px"
                hoverZoom={false}
              />
            )}
          </div>
          <div className="mt-2 line-clamp-2 text-[11.5px] font-medium leading-[1.3] tracking-[-0.005em] text-white/90">
            {s.name}
          </div>
        </button>
      ))}
    </div>
  );
}

// The speaker bio, rendered INLINE inside the tile modal rather than as a
// second modal stacked on top of it. The nested version cropped its own
// header behind the tile modal's, and a modal over a modal is the wrong
// shape for this page anyway: the tile modal is already near-fullscreen, so
// this simply swaps what it is showing and offers a way back.
function SpeakerDetail({
  speaker,
  position,
  total,
  onBack,
  onPrev,
  onNext,
}: {
  speaker: SpeakerWithTalk;
  position: number;
  total: number;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const title = cleanText(speaker.title);
  const bio = cleanText(speaker.blurb);
  const talk = speaker.linkedTalk;
  const talkTitle = talk?.title ?? cleanText(speaker.talk);
  const talkBlurb = talk?.blurb ?? "";
  const youtubeId = talk?.youtubeId;

  const socials = [
    speaker.linkedinUrl && { label: "LinkedIn", href: speaker.linkedinUrl },
    speaker.instagramUrl && { label: "Instagram", href: speaker.instagramUrl },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="-ml-1 inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-[13px] font-medium text-white/65 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        All speakers
      </button>

      <div className="mt-4 flex items-start gap-4">
        <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#1a0604]">
          {speaker.image && (
            <PhotoFill
              src={speaker.image}
              alt={speaker.name}
              sizes="84px"
              hoverZoom={false}
            />
          )}
        </div>
        <div className="min-w-0 pt-1">
          <h3
            className="font-sans tracking-[-0.015em] text-white"
            style={{ fontSize: "19px", fontWeight: 500, lineHeight: 1.15 }}
          >
            {speaker.name}
          </h3>
          {title && (
            <p className="mt-1.5 text-[13px] leading-[1.45] text-white/60">
              {title}
            </p>
          )}
        </div>
      </div>

      {socials.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {socials.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-[12px] font-medium text-white/75 transition-colors hover:border-white/30 hover:text-white"
            >
              {label}
              <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
            </a>
          ))}
        </div>
      )}

      {bio && (
        <p className="mt-5 text-[14.5px] leading-[1.65] text-white/80">{bio}</p>
      )}

      {(talkTitle || youtubeId) && (
        <div className="mt-6 border-t border-white/10 pt-5">
          <div
            className="font-mono text-[10px] font-semibold uppercase text-[#ff9b8f]"
            style={{ letterSpacing: "0.2em" }}
          >
            Their talk
          </div>
          {talkTitle && (
            <div className="mt-2 text-[15px] font-medium leading-[1.35] text-white">
              {talkTitle}
            </div>
          )}
          {youtubeId && (
            <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                title={talkTitle || speaker.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          )}
          {talkBlurb && (
            <p className="mt-3 text-[14px] leading-[1.6] text-white/70">
              {talkBlurb}
            </p>
          )}
        </div>
      )}

      {total > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous speaker"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/65 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Prev
          </button>
          <span className="tabular text-[12px] text-white/40">
            {position + 1} / {total}
          </span>
          <button
            type="button"
            onClick={onNext}
            aria-label="Next speaker"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/65 transition-colors hover:text-white"
          >
            Next
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      )}
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

      {/* Generous gap under the thank-you: the logos sat tight under it and
          the whole modal read top-heavy. */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-9">
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
