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
 * page.
 *
 * **Every transition here is plain CSS, deliberately NOT `motion/react`**,
 * even though the library is already a dependency and drives the rest of the
 * site. Three earlier attempts fought each other here. First the shell was a
 * `motion.div` with `initial={{opacity:0}}`, which flashed: Next.js
 * server-renders a "use client" component's markup with no inline style, so
 * the first paint was fully opaque and motion only snapped it to 0 after
 * hydration. Replacing that with a `mounted` boolean driving the root's
 * opacity fixed the flash but caused the opposite problem — the
 * acknowledgement's own CSS entrance animations start at FIRST PAINT, while
 * the root was still gated on a post-hydration flag, so the two disagreed
 * about when time started and the fade played out invisibly. Removing the
 * gate and leaving a pure CSS animation fixed THAT, and then hit the third
 * version of the same thing: a CSS animation still starts at first paint,
 * which on a phone opening this from a QR scan is behind the browser's own
 * page transition, so the fade was over before the screen was ever looked at.
 *
 * A fourth version fixed the timing by staggering a transition per element,
 * and that read as the page still loading line by line. See
 * `AcknowledgementScreen` for the measurements and the fix.
 *
 * What holds: ONE element, ONE clock, ONE transition, with a hidden first
 * state already in the server-rendered HTML. Nothing in the acknowledgement
 * can reveal itself independently of the rest of the block. The screen swap
 * is a CSS opacity transition that fades out, swaps while invisible, and
 * fades back in, so the incoming screen mounts and paints at zero opacity
 * instead of during its own animation, the same principle as `TileModal`.
 * `AnimatePresence mode="wait"` used to leave a gap where neither screen was
 * mounted, which read as a flash on the Continue tap.
 *
 * **Reduce Motion is a designed path here, not an accident.** The blanket
 * reduced-motion rule in globals.css collapses every transition duration and
 * leaves every DELAY standing, which silently turned this page's animation
 * into a sequence of hard snaps on the original schedule. The `.rm-fade` and
 * `.rm-fade-slow` classes (defined in that same block) opt the elements that
 * matter back into a plain cross-fade with no transform and no stagger.
 * Anything that scales has to drop the scale itself: see
 * `prefersReducedMotion` in `TileModal`.
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
import { useEffect, useRef, useState } from "react";
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
import TileModal, {
  prefersReducedMotion,
  type ModalOrigin,
} from "./TileModal";
import GuideGallery, { GUIDE_SUMMARY } from "./GuideGallery";

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

// The crossfade between the acknowledgement and the hub. Deliberately
// unhurried: this screen is an Acknowledgement of Country, not a splash.
const SCREEN_FADE_MS = 620;
// Reduce Motion collapses that transition, so waiting the full 620ms before
// swapping would be 620ms of nothing happening after the tap. `.rm-fade`
// restores a 240ms cross-fade, so the wait matches it.
const SCREEN_FADE_REDUCED_MS = 240;

// The acknowledgement's own entrance. ONE fade of the whole block, never a
// staggered one. See AcknowledgementScreen for why that matters.
const ACK_FADE_MS = 1400;
// Longest the block waits for the logo to load before revealing regardless.
const ACK_LOGO_WAIT_MS = 700;

/**
 * Desktop header band: how the TEDxNewy logo is matched to the SIGNAL
 * wordmark beside it. Both are expressed per em of SIGNAL's own font size,
 * so one CSS variable drives the pair at every width.
 *
 * Derived, not guessed. See the comment at the `<Image>` that uses them for
 * the measurements behind each number.
 *   box height  = cap ratio of the type (0.677) / cap ratio of the PNG
 *                 (200/440 = 0.4545) = 1.49
 *   baseline    = how far the logo has to drop for its baseline to sit on
 *                 SIGNAL's. Started from the font metrics, then corrected
 *                 against the rendered page, which is the only way to get
 *                 this right: the first value was 0.283 and measured 0.045em
 *                 long at every width tested, so it is 0.238.
 *
 * Verified after the correction at 1024, 1280, 1440 and 1920 wide: cap
 * heights agree to within half a pixel and the baselines to within a pixel.
 */
const LOGO_BOX_PER_EM = 1.49;
const LOGO_BASELINE_NUDGE_PER_EM = 0.238;

type AboutStats = { staged: number; talks: number };

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

  // Where the modal should grow from: the centre of the tile that was
  // tapped. Deliberately NOT cleared on close, so the panel shrinks back
  // into the same tile it came out of.
  const [origin, setOrigin] = useState<ModalOrigin | null>(null);
  const openTileFrom = (key: TileKey, rect: DOMRect) => {
    setOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setOpenTile(key);
  };

  // Screen swap: fade out, swap while invisible, fade back in. The swap
  // happening at zero opacity is the point — the incoming screen mounts and
  // paints before anything animates, same principle as TileModal.
  const [swapping, setSwapping] = useState(false);
  const goToLinks = () => {
    setSwapping(true);
    setTimeout(
      () => {
        setScreen("links");
        requestAnimationFrame(() =>
          requestAnimationFrame(() => setSwapping(false)),
        );
      },
      prefersReducedMotion() ? SCREEN_FADE_REDUCED_MS : SCREEN_FADE_MS,
    );
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
          className={`rm-fade flex w-full flex-1 flex-col transition-opacity ease-in-out ${
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
              <LinksScreen
                onOpenTile={openTileFrom}
                speakers={speakers}
                sponsors={sponsors}
                aboutStats={aboutStats}
              />
            </div>
          )}
        </div>
      </div>

      {/* One modal instance, fed different content per tile, rather than a
          separate modal (and separate open/close state) per tile. */}
      <TileModal
        open={openTile === "program"}
        onClose={() => setOpenTile(null)}
        origin={origin}
        title="Program"
        subtitle="Saturday 24 October"
        fit="md"
      >
        <ProgramModalContent />
      </TileModal>

      <TileModal
        open={openTile === "speakers"}
        onClose={() => setOpenTile(null)}
        origin={origin}
        title="Speakers"
        subtitle="The 2026 Signal lineup"
      >
        {/* **Not fitted, and this is the second modal where that is a
            measured call rather than an oversight.** This one has two views
            in it, a grid and a bio, and fitting the panel meant swapping
            between them resized the whole dialog: measured on production at
            1440x900 the grid sat at 721 and every bio at 860, and at
            768x1024 it was 579 against 821. Moving BETWEEN speakers was
            stable, but grid to bio jumped every time.
            Full height instead, with the grid stretching to fill it exactly
            the way it does on a phone, so nothing is ever empty and the
            panel height never changes at all. */}
        <SpeakersModalContent speakers={speakers} />
      </TileModal>

      <TileModal
        open={openTile === "guide"}
        onClose={() => setOpenTile(null)}
        origin={origin}
        title="Event Week Guide"
        subtitle="Offers across event week, 19 to 25 October"
      >
        {/* **Deliberately NOT fitted, and this is measured.** It is the one
            modal whose content changes size while it is open, because it is
            a nine-page gallery you swipe through. Fitted at 1440x900 the
            panel height ran 571, then 860 for seven pages, then 495: the
            whole dialog jumped twice while someone was just paging through
            it. A stable full-height panel is worth more here than reclaiming
            the slack on the two short pages, and the tallest pages need
            every pixel anyway (they scroll even at 860). Revisit when the
            Guide component itself is reworked. */}
        <GuideGallery />
      </TileModal>

      {/* `fit`: the sponsors list is short next to the other tiles, and a
          near-empty full-height panel under it read as a mistake. This one
          sizes to its own content instead (still capped at the same
          near-fullscreen maximum). */}
      <TileModal
        open={openTile === "sponsors"}
        onClose={() => setOpenTile(null)}
        origin={origin}
        title="Sponsors"
        subtitle="Made possible by"
        fit="always"
      >
        <SponsorsModalContent sponsors={sponsors} />
      </TileModal>

      <TileModal
        open={openTile === "about"}
        onClose={() => setOpenTile(null)}
        origin={origin}
        title="About TEDxNewy"
        fit="always"
      >
        <AboutModalContent stats={aboutStats} />
      </TileModal>

      <TileModal
        open={openTile === "signal-activity"}
        onClose={() => setOpenTile(null)}
        origin={origin}
        title="Signal Activity"
        fit="always"
        wide={false}
      >
        <SignalActivityModalContent />
      </TileModal>
    </div>
  );
}

/**
 * ONE fade, of the whole block, and nothing that can reveal any part of it
 * independently.
 *
 * **Two earlier versions were both wrong, and the second was wrong in a way
 * that is worth not repeating.** First it was the `fade-in` CSS animation
 * from globals.css, which runs from the element's FIRST PAINT: on a phone
 * opening this from a QR scan, first paint is behind the browser's own page
 * transition, so the fade was over before the screen was looked at. That was
 * replaced with a staggered TRANSITION started a frame after mount, five
 * elements offset by 0, 300, 600, 900 and 1300ms, which fixed the timing and
 * introduced a worse problem: it read as the page still loading, line by
 * line, rather than as a reveal.
 *
 * It read that way for two separate reasons, both measured on the live page
 * rather than guessed at:
 *
 * 1. Even at full duration the five elements sat at wildly different
 *    opacities at any one moment (0.82, 0.63, 0.39, 0.12, 0.00 at t=1.1s),
 *    which is a top-to-bottom cascade, not a fade.
 * 2. Far worse with Reduce Motion on. globals.css's reduced-motion rule
 *    collapses transition-DURATION but leaves transition-DELAY alone, so the
 *    five staged fades became five hard SNAPS still 300ms apart, with no
 *    intermediate frame at all. Traced live: 0 to 1 instantly at roughly
 *    120ms, 450ms, 770ms, 1000ms and 1450ms.
 *
 * So there is no stagger any more and no per-child opacity at all. The
 * container fades once; the children are plain. There is no mechanism left
 * that could reveal one line before another, whatever the motion preference,
 * and `.rm-fade-slow` gives Reduce Motion a shorter version of the same
 * single fade rather than a jump cut.
 *
 * The reveal also waits for the logo to finish loading (capped, see
 * `ACK_LOGO_WAIT_MS`), because an image arriving after the text would be one
 * last thing appearing on its own.
 *
 * Still true from before, and still load-bearing: the hidden state is inline
 * in the server-rendered markup, so there is no opaque first frame to flash,
 * and the `<noscript>` rule means a visitor whose JavaScript never arrives
 * reads the acknowledgement rather than an empty screen.
 */
function AcknowledgementScreen({ onContinue }: { onContinue: () => void }) {
  const [entered, setEntered] = useState(false);
  const [logoReady, setLogoReady] = useState(false);
  const logoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // A cached image can finish before React attaches `onLoad`, in which case
    // that handler never fires. `complete` is the read-back for that case.
    if (logoRef.current?.complete) setLogoReady(true);
    // Cap the wait regardless, so a slow or failed logo can never hold the
    // text hostage.
    const t = setTimeout(() => setLogoReady(true), ACK_LOGO_WAIT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!logoReady) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [logoReady]);

  return (
    <div
      className="ack-stage rm-fade-slow w-full max-w-[520px] text-center"
      style={{
        // Opacity only, no lift: this moment should feel unhurried rather
        // than energetic. One element, one transition, no delay.
        opacity: entered ? 1 : 0,
        transitionProperty: "opacity",
        transitionDuration: `${ACK_FADE_MS}ms`,
        transitionTimingFunction: "ease-out",
      }}
    >
      <noscript>
        <style>{`.ack-stage{opacity:1 !important}`}</style>
      </noscript>
      <Image
        src="/brand/tedxnewy-white.png"
        alt="TEDxNewy"
        width={376}
        height={100}
        className="mx-auto h-auto w-[190px] opacity-90"
        priority
        ref={logoRef}
        onLoad={() => setLogoReady(true)}
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

/**
 * The modal grows out of whatever was tapped, so every opener needs its own
 * box. Measured on pointerdown rather than in the click handler, so the
 * layout read happens while the finger is still down instead of landing on
 * the same frame as the state change that mounts the modal, which is the
 * frame this page has a long history of dropping on a phone. Keyboard
 * activation never fires pointerdown, hence the fallback read.
 *
 * Shared by the phone tile and the desktop card so the pop follows whichever
 * geometry is actually on screen, with no second copy of this to drift.
 */
function useOpenFromSelf(
  key: TileKey,
  onOpen: (key: TileKey, rect: DOMRect) => void,
) {
  const rectRef = useRef<DOMRect | null>(null);
  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      rectRef.current = e.currentTarget.getBoundingClientRect();
    },
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      onOpen(key, rectRef.current ?? e.currentTarget.getBoundingClientRect());
    },
  };
}

/**
 * **Two compositions, one set of tiles, split at `md` (768px).**
 *
 * Below `md` this is the phone hub exactly as it was signed off: a 420px
 * column, a 2x3 grid of icon-and-label tiles, everything on one screen with
 * nothing to scroll. That markup is deliberately untouched and lives in its
 * own `md:hidden` subtree rather than being bent into shape with responsive
 * utilities, because the safest way not to regress a signed-off layout is not
 * to edit it.
 *
 * From `md` up it is a different composition, not a wider version of the same
 * one. The phone layout centred on a desktop read as a tall narrow column in
 * a field of empty space, so the desktop version puts the identity in a
 * horizontal band across the top and lays the tiles out as content cards,
 * two across on a tablet and three across from `lg`, each previewing a real
 * slice of its own modal with a "See more" pill.
 *
 * **Every preview is real and comes from the same data the modal itself
 * renders** (`SIGNAL_AGENDA`, the CMS speakers and sponsors, `GUIDE_SUMMARY`
 * derived from the guide's own pages, the About stats). Nothing here is
 * hand-copied prose that could drift from what opens when you tap it. Signal
 * Activity has no content yet, so it gets an honest "coming soon" card rather
 * than invented filler.
 *
 * The desktop subtree is `display: none` on a phone, so it costs no layout or
 * paint there, and its preview images are `loading="lazy"` so a phone does
 * not fetch them either.
 */
function LinksScreen({
  onOpenTile,
  speakers,
  sponsors,
  aboutStats,
}: {
  onOpenTile: (key: TileKey, rect: DOMRect) => void;
  speakers: SpeakerWithTalk[];
  sponsors: Sponsor[];
  aboutStats: AboutStats;
}) {
  return (
    <>
      <PhoneHub onOpenTile={onOpenTile} />
      <DesktopHub
        onOpenTile={onOpenTile}
        speakers={speakers}
        sponsors={sponsors}
        aboutStats={aboutStats}
      />
    </>
  );
}

// Untouched from the signed-off phone layout apart from the `md:hidden` that
// stands it down on a wider screen. Same single wrapper div, same classes, no
// extra nesting: the flex chain from the page down to the tile grid is what
// makes the grid fill the screen exactly, and adding a level to it is exactly
// how that gets broken by accident.
function PhoneHub({
  onOpenTile,
}: {
  onOpenTile: (key: TileKey, rect: DOMRect) => void;
}) {
  return (
    <div className="flex w-full max-w-[420px] flex-1 flex-col md:hidden">
      <div className="flex flex-col items-center text-center">
        {/* The logo IS the link home now. The site address used to sit in
            small type at the bottom of this screen; it was the only thing
            down there, and putting it on the mark people already read as
            "TEDxNewy" says the same thing without a spare line. */}
        <Link href="/" aria-label="TEDxNewy home">
          <Image
            src="/brand/tedxnewy-white.png"
            alt="TEDxNewy"
            width={376}
            height={100}
            className="h-auto w-[160px] opacity-90 transition-opacity hover:opacity-100"
          />
        </Link>
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
      <div className="mb-1 mt-6 grid flex-1 grid-cols-2 gap-3">
        {TILES.map((tile) => (
          <TileCard key={tile.key} tile={tile} onOpen={onOpenTile} />
        ))}
      </div>
    </div>
  );
}

function TileCard({
  tile,
  onOpen,
}: {
  tile: Tile;
  onOpen: (key: TileKey, rect: DOMRect) => void;
}) {
  const Icon = tile.icon;
  const open = useOpenFromSelf(tile.key, onOpen);

  return (
    <button
      type="button"
      {...open}
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

/* ------------------------------------------------------------------ *
 * Desktop hub (md and up)
 * ------------------------------------------------------------------ */

function DesktopHub({
  onOpenTile,
  speakers,
  sponsors,
  aboutStats,
}: {
  onOpenTile: (key: TileKey, rect: DOMRect) => void;
  speakers: SpeakerWithTalk[];
  sponsors: Sponsor[];
  aboutStats: AboutStats;
}) {
  return (
    // `my-auto` rather than `flex-1`: the phone grid stretches to fill the
    // screen exactly, which is right there because six tiles have to land on
    // one screen. Stretching here instead gave 437px-tall cards on a 1080p
    // display, mostly empty. The cards size to their content and the block
    // sits centred in whatever height is going.
    <div className="my-auto hidden w-full max-w-[1180px] flex-col md:flex">
      {/* Identity as a horizontal band rather than a stacked centred block.
          This is the change that stops the page reading as a tall narrow
          column: the logo, the wordmark and the meta line sit side by side
          and the cards start near the top of the viewport. */}
      <div
        className="flex items-end justify-between gap-8 border-b border-white/10 pb-6"
        style={
          {
            // One size drives the wordmark AND the logo beside it, so the two
            // cannot drift apart if either is ever retuned.
            "--signal-size": "clamp(2.6rem, 4.4vw, 3.6rem)",
          } as React.CSSProperties
        }
      >
        <div className="flex items-end gap-6">
          <Link href="/" aria-label="TEDxNewy home" className="shrink-0">
            {/* **Sized so the logo's CAPS match SIGNAL's caps, not so the two
                boxes match.** Both boxes are mostly not ink, which is why
                this is measured rather than eyeballed:
                  - `tedxnewy-white.png` is 1656x440, and the wordmark's cap
                    height (the T, E and D) runs y=120 to y=319. So caps are
                    200/440 = 0.4545 of the box and the baseline sits at
                    319.5/440 = 0.726 down it. The rest is transparent
                    padding, which is exactly why `w-[150px]` looked so much
                    smaller than SIGNAL: it put 40px of box on screen but
                    only 18px of letter, against SIGNAL's 39px cap.
                  - Bricolage Grotesque's cap height, measured through canvas
                    TextMetrics on the live page at three sizes: 0.684, 0.673
                    and 0.677 of the font size. 0.677 is the value used.
                Box height = font-size * 0.677 / 0.4545 = font-size * 1.49.
                The nudge then drops the logo so the two BASELINES agree:
                bottom-aligning the boxes would leave the wordmark floating
                on its own bottom padding. */}
            <Image
              src="/brand/tedxnewy-white.png"
              alt="TEDxNewy"
              width={1656}
              height={440}
              className="w-auto opacity-90 transition-opacity hover:opacity-100"
              style={{
                height: `calc(var(--signal-size) * ${LOGO_BOX_PER_EM})`,
                transform: `translateY(calc(var(--signal-size) * ${LOGO_BASELINE_NUDGE_PER_EM}))`,
              }}
            />
          </Link>
          <div
            className="font-sans leading-none tracking-[-0.025em] text-white"
            style={{
              fontSize: "var(--signal-size)",
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            SIGNAL
          </div>
        </div>
        <div className="pb-1 text-right">
          <div
            className="font-mono text-[10px] font-semibold uppercase text-[#ff9b8f]"
            style={{ letterSpacing: "0.22em" }}
          >
            Event guide
          </div>
          <p className="mt-1.5 text-[13.5px] font-medium text-white/60">
            Saturday 24 October &middot; Conservatorium of Music
          </p>
        </div>
      </div>

      {/* Two across on a tablet, three from lg. `auto-rows-fr` keeps every
          card in a row the same height so the "See more" pills line up. */}
      <div className="mt-6 grid auto-rows-fr grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5">
        {TILES.map((tile) => (
          <DesktopTileCard key={tile.key} tile={tile} onOpen={onOpenTile}>
            {tile.key === "program" && <ProgramPreview />}
            {tile.key === "speakers" && <SpeakersPreview speakers={speakers} />}
            {tile.key === "guide" && <GuidePreview />}
            {tile.key === "sponsors" && <SponsorsPreview sponsors={sponsors} />}
            {tile.key === "about" && <AboutPreview stats={aboutStats} />}
            {tile.key === "signal-activity" && <ActivityPreview />}
          </DesktopTileCard>
        ))}
      </div>
    </div>
  );
}

/**
 * One desktop card: icon, label, a real slice of the modal's own content,
 * and a "See more" pill pinned to the bottom.
 *
 * Still a single `<button>`, not a link and not a wrapper full of separate
 * controls, so the whole card is one target, the pop still measures one box,
 * and nothing inside can steal the click.
 */
function DesktopTileCard({
  tile,
  onOpen,
  children,
}: {
  tile: Tile;
  onOpen: (key: TileKey, rect: DOMRect) => void;
  children: React.ReactNode;
}) {
  const Icon = tile.icon;
  const open = useOpenFromSelf(tile.key, onOpen);

  return (
    <button
      type="button"
      {...open}
      className={`group relative flex min-h-[236px] flex-col rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 ${
        tile.muted
          ? "border-dashed border-white/15 bg-white/[0.02] hover:border-white/25"
          : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[#ff9b8f]">
          <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
        </span>
        <span className="font-sans text-[15.5px] font-medium tracking-[-0.015em] text-white">
          {tile.label}
        </span>
        {tile.badge && (
          <span className="ml-auto inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-white/55">
            {tile.badge}
          </span>
        )}
      </div>

      <div className="mt-4 min-h-0 flex-1">{children}</div>

      <span className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full border border-white/15 px-3.5 py-1.5 text-[12px] font-medium text-white/75 transition-colors group-hover:border-white/30 group-hover:text-white">
        See more
        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
    </button>
  );
}

// Same `SIGNAL_AGENDA` the Program modal renders, just the first three rows.
function ProgramPreview() {
  return (
    <div className="space-y-2.5">
      {SIGNAL_AGENDA.slice(0, 3).map((item) => (
        <div key={item.title} className="flex items-baseline gap-3">
          <span
            className="tabular shrink-0 font-mono text-[10.5px] font-semibold text-[#ff9b8f]"
            style={{ letterSpacing: "0.03em" }}
          >
            {item.time.split(" to ")[0]}
          </span>
          <span className="truncate text-[13px] text-white/75">
            {item.title}
          </span>
        </div>
      ))}
      {SIGNAL_AGENDA.length > 3 && (
        <div className="pt-0.5 text-[12px] text-white/40">
          and {SIGNAL_AGENDA.length - 3} more through the afternoon
        </div>
      )}
    </div>
  );
}

// The real lineup, same CMS call the modal uses. Plain <img> rather than
// PhotoFill: these are absolute Supabase URLs, which PhotoFill only exists to
// pass through unoptimised anyway, and a plain tag is what lets them be
// `loading="lazy"` so a phone never fetches a card it cannot see.
function SpeakersPreview({ speakers }: { speakers: SpeakerWithTalk[] }) {
  if (speakers.length === 0) {
    return (
      <p className="text-[13px] leading-[1.55] text-white/60">
        The lineup is still being locked in.
      </p>
    );
  }
  const shown = speakers.slice(0, 4);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {shown.map((s) => (
          <div
            key={s.slug}
            className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#1a0604]"
          >
            {s.image && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={s.image}
                alt={s.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        ))}
        {speakers.length > shown.length && (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/15 text-[12px] font-medium text-white/50">
            +{speakers.length - shown.length}
          </div>
        )}
      </div>
      {/* A count, not a list of first names. Taking the first word of a name
          printed "Professor, Melissa, Jacob, Peter and more" the moment a
          real title was in the data, and no amount of stripping honorifics
          makes splitting a person's name on a space a safe thing to do. */}
      <p className="mt-3 text-[12.5px] text-white/55">
        {speakers.length} speakers in the 2026 lineup.
      </p>
    </div>
  );
}

// Derived from the guide's own pages (see GUIDE_SUMMARY in GuideGallery.tsx),
// so renaming a section or adding a venue updates this card by itself.
function GuidePreview() {
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {GUIDE_SUMMARY.sections.map((s) => (
          <span
            key={s}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11.5px] text-white/70"
          >
            {s}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[12.5px] text-white/55">
        {GUIDE_SUMMARY.venueCount} venues across event week, 19 to 25 October.
      </p>
    </div>
  );
}

function SponsorsPreview({ sponsors }: { sponsors: Sponsor[] }) {
  if (sponsors.length === 0) {
    return (
      <p className="text-[13px] leading-[1.55] text-white/60">
        Our Signal partners are being confirmed.
      </p>
    );
  }
  const shown = sponsors.slice(0, 3);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {shown.map((s) =>
          s.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={s.name}
              src={s.logoUrl}
              alt={s.name}
              loading="lazy"
              className="h-6 w-auto max-w-[110px] object-contain opacity-70 brightness-0 invert"
            />
          ) : (
            <span key={s.name} className="text-[13px] text-white/70">
              {s.name}
            </span>
          ),
        )}
      </div>
      <p className="mt-3 text-[12.5px] text-white/55">
        {sponsors.length === shown.length
          ? `${sponsors.length} partners behind Signal.`
          : `${shown.length} of ${sponsors.length} partners behind Signal.`}
      </p>
    </div>
  );
}

function AboutPreview({ stats }: { stats: AboutStats }) {
  return (
    <div>
      <div className="flex gap-7">
        {[
          { n: String(stats.staged), l: "events since 2024" },
          { n: String(stats.talks), l: "talks online" },
        ].map((s) => (
          <div key={s.l}>
            <div className="font-sans text-[26px] font-medium leading-none tracking-[-0.02em] text-white">
              {s.n}
            </div>
            <div className="mt-1 text-[11.5px] text-white/50">{s.l}</div>
          </div>
        ))}
      </div>
      <p className="mt-3.5 text-[12.5px] leading-[1.55] text-white/55">
        Not-for-profit and 100% volunteer-run, formerly TEDxCooks Hill.
      </p>
    </div>
  );
}

// Nothing to preview, and inventing something would be a lie about what is
// behind the card. So it says what is actually true.
function ActivityPreview() {
  return (
    <p className="text-[13px] leading-[1.6] text-white/60">
      A live, digitally interactive intermission challenge is in the works.
      Not built yet, so there is nothing to see in here today.
    </p>
  );
}

/**
 * A single column of rows on a phone, two columns from `md`.
 *
 * The rules are swapped rather than doubled up: `divide-y` only works down a
 * single flow, so it is turned off at `md` (`md:divide-y-0`) and each item
 * takes its own `md:border-t` instead. That way the first item in the SECOND
 * column gets a rule too, which `divide-y` would never have given it.
 */
function ProgramModalContent() {
  return (
    <div className="divide-y divide-white/10 md:grid md:grid-cols-2 md:gap-x-10 md:divide-y-0">
      {SIGNAL_AGENDA.map((item) => (
        <div
          key={item.title}
          className="py-5 first:pt-0 last:pb-0 md:border-t md:border-white/10 md:py-5 md:first:pt-5 md:last:pb-5"
        >
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
        others={speakers
          .map((s, i) => ({ speaker: s, index: i }))
          .filter(({ index }) => index !== activeIndex)}
        onBack={() => setActiveIndex(null)}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        onPick={setActiveIndex}
      />
    );
  }

  // Two across, three down (Will's ask: the old 3x2 left the bottom of the
  // panel empty, so the photos were smaller than they needed to be).
  //
  // **It cannot scroll, by construction.** Rather than picking a photo
  // aspect ratio and hoping six of them clear the shortest phone, the grid
  // takes the height it is given (`h-full` inside TileModal's flex-1 scroll
  // area) and divides it into three equal rows (`grid-rows-3` + `min-h-0`
  // on each cell, or a grid row refuses to shrink below its content). Each
  // photo then fills its own cell and crops, so the six tiles always add up
  // to exactly the available height whatever the viewport is. The name sits
  // ON the photo for the same reason: a caption underneath is height the
  // grid would have to find from somewhere.
  //
  // **The same trick at every width: take the height you are given and
  // divide it.** `h-full` inside a full-height panel, `grid-rows-*` plus
  // `min-h-0` cells, each photo filling and cropping its own cell. Nothing
  // here picks an aspect ratio and hopes, so the lineup cannot scroll and
  // cannot leave the panel half empty, whatever the screen.
  //
  // Column counts change, the mechanism does not: two across on a phone and
  // a tablet, three across from `lg` where the panel is 940px and two rows
  // of three is what stops the lineup reading as a tall narrow strip.
  //
  // `max-w-[400px]` applies on a phone only, where full-width cells in a
  // 2-column grid would be much wider than they are tall.
  return (
    <div className="mx-auto grid h-full w-full max-w-[400px] grid-cols-2 grid-rows-3 gap-2.5 md:max-w-none md:gap-4 lg:grid-cols-3 lg:grid-rows-2">
      {speakers.map((s, i) => (
        <button
          key={s.slug}
          type="button"
          onClick={() => setActiveIndex(i)}
          className="group relative min-h-0 w-full overflow-hidden rounded-xl border border-white/10 bg-[#1a0604] text-left transition-colors hover:border-white/25"
        >
          {s.image && (
            <PhotoFill
              src={s.image}
              alt={s.name}
              sizes="200px"
              hoverZoom={false}
            />
          )}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
            style={{
              background:
                "linear-gradient(180deg, rgba(13,5,3,0) 0%, rgba(13,5,3,0.82) 70%, rgba(13,5,3,0.95) 100%)",
            }}
          />
          <span className="absolute inset-x-0 bottom-0 line-clamp-2 px-2.5 pb-2 text-[12px] font-medium leading-[1.25] tracking-[-0.005em] text-white md:px-3.5 md:pb-3 md:text-[14px]">
            {s.name}
          </span>
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
  others,
  onBack,
  onPrev,
  onNext,
  onPick,
}: {
  speaker: SpeakerWithTalk;
  position: number;
  total: number;
  /** Everyone else in the lineup, carrying their index in the full list. */
  others: { speaker: SpeakerWithTalk; index: number }[];
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onPick: (index: number) => void;
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

      {/* **One column on a phone, two from md, and the wrappers are flex on
          BOTH so the phone spacing cannot move.** Nesting previously flat
          siblings inside a block wrapper would let the first child's
          `margin-top` collapse through the wrapper and change the gap. A
          flex container never collapses its children's margins, so every
          `mt-*` below keeps meaning exactly what it meant when these were
          all siblings. */}
      <div className="mt-4 flex flex-col md:grid md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] md:items-start md:gap-x-8">
        <div className="flex flex-col">
          {/* Photo beside the name on a phone, above it on desktop, where
              the left column is wide enough for a real portrait. */}
          <div className="flex items-start gap-4 md:block">
            <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#1a0604] md:aspect-square md:h-auto md:w-full">
              {speaker.image && (
                <PhotoFill
                  src={speaker.image}
                  alt={speaker.name}
                  sizes="(min-width: 768px) 240px, 84px"
                  hoverZoom={false}
                />
              )}
            </div>
            <div className="min-w-0 pt-1 md:pt-4">
              <h3
                className="font-sans tracking-[-0.015em] text-white md:text-[22px]"
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
        </div>

        <div className="flex flex-col">
          {bio && (
            <p className="mt-5 text-[14.5px] leading-[1.65] text-white/80 md:mt-0">
              {bio}
            </p>
          )}

          {(talkTitle || youtubeId) && (
            <div className="mt-6 border-t border-white/10 pt-5 md:mt-5">
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
        </div>
      </div>

      {/* **"Also check out", desktop only.** The wide panel has room for it,
          and it turns prev/next from two small arrows into something you can
          actually see and aim at. Deliberately NOT added on a phone: the
          phone detail view is already the tallest thing in this modal, and
          the phone layout is signed off. Same speaker list, same click
          handler as the grid, so it cannot show anyone who is not in the
          lineup. */}
      {others.length > 0 && (
        <div className="mt-7 hidden border-t border-white/10 pt-5 md:block">
          <div
            className="font-mono text-[10px] font-semibold uppercase text-[#ff9b8f]"
            style={{ letterSpacing: "0.2em" }}
          >
            Also check out
          </div>
          <div className="mt-3 grid grid-cols-5 gap-3">
            {others.map(({ speaker: s, index }) => (
              <button
                key={s.slug}
                type="button"
                onClick={() => onPick(index)}
                className="group text-left"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-white/10 bg-[#1a0604] transition-colors group-hover:border-white/30">
                  {s.image && (
                    <PhotoFill
                      src={s.image}
                      alt={s.name}
                      sizes="140px"
                      hoverZoom={false}
                    />
                  )}
                </div>
                <div className="mt-1.5 line-clamp-2 text-[11.5px] leading-[1.3] text-white/70 transition-colors group-hover:text-white">
                  {s.name}
                </div>
              </button>
            ))}
          </div>
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

/**
 * Prose in one column, the stats and the two ways out beside it from `md`.
 *
 * Both wrappers are flex at every width so the phone spacing is untouched: a
 * block wrapper would let the first child's `margin-top` collapse through
 * it, which is the one way nesting previously flat siblings can silently
 * move a signed-off layout.
 */
function AboutModalContent({ stats }: { stats: AboutStats }) {
  return (
    <div className="flex flex-col md:grid md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:items-start md:gap-x-10">
      <div className="flex flex-col">
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
      </div>

      <div className="flex flex-col">
      {/* Volunteer count dropped 2026-09-23 at Will's request. The other two
          stats are things you can go and look at, which is what the two
          buttons below are for. */}
      <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-5 md:mt-0 md:border-t-0 md:pt-0">
        {[
          { n: String(stats.staged), l: "events staged since 2024" },
          { n: String(stats.talks), l: "talks online" },
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

      {/* Two small buttons in place of the old single "Read our full story"
          link to /mission. `/events` is the real events index (every event,
          upcoming and past) and `/talks` is the talk archive; both are real
          routes in this repo, checked against app/events/page.tsx and
          app/talks/page.tsx rather than assumed. */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 md:mt-6 md:flex-col md:items-stretch md:justify-start">
        <Link
          href="/events"
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-[12.5px] font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white"
        >
          Our events
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
        <Link
          href="/talks"
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-[12.5px] font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white"
        >
          Watch the talks
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>
      </div>
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
