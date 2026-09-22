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
 */

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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
import SpeakerLineup from "@/components/SpeakerLineup";
import type { SpeakerWithTalk } from "@/lib/cms-content";
import type { Sponsor } from "@/lib/data";
import { SIGNAL_AGENDA, SIGNAL_LOGO_SCALE } from "@/lib/signal-content";
import SignalSpeakerCard from "../SignalSpeakerCard";
import SignalSpeakerPuzzle from "../SignalSpeakerPuzzle";
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
  description: string;
  icon: typeof CalendarDays;
  badge?: string;
  muted?: boolean;
};

const TILES: Tile[] = [
  {
    key: "program",
    label: "Program",
    description: "The running order for the day.",
    icon: CalendarDays,
  },
  {
    key: "speakers",
    label: "Speakers",
    description: "Meet the 2026 Signal lineup.",
    icon: Mic2,
  },
  {
    key: "guide",
    label: "Event Week Guide",
    description: "Offers and things to do across event week.",
    icon: FileText,
  },
  {
    key: "sponsors",
    label: "Sponsors",
    description: "The partners who help make Signal possible.",
    icon: Handshake,
  },
  {
    key: "about",
    label: "About TEDxNewy",
    description: "Who we are and what we're building.",
    icon: Info,
  },
  {
    key: "signal-activity",
    label: "Signal Activity",
    description: "A live intermission challenge.",
    icon: Sparkles,
    badge: "Coming soon",
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

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#0d0503] text-white">
      {/* Backdrop: the 2026 event artist's "Authenticity" piece, dimmed and
          overlaid so it reads as texture rather than competing with the
          copy on top of it. Fixed so it holds steady under both screens. */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/signal-authenticity-artwork.webp"
          alt=""
          fill
          priority
          className="object-cover opacity-[0.22]"
          sizes="100vw"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(13,5,3,0.75) 0%, rgba(13,5,3,0.88) 45%, rgba(13,5,3,0.97) 100%)",
          }}
        />
        <div className="grain grain-dark pointer-events-none absolute inset-0 opacity-30" />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] w-full flex-col">
        <AnimatePresence mode="wait">
          {screen === "acknowledgement" ? (
            <motion.div
              key="acknowledgement"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
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
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="flex w-full flex-1 flex-col items-center px-5 py-14 md:px-6"
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
        width={140}
        height={34}
        className="mx-auto h-auto w-[120px] opacity-90"
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
    <div className="flex w-full max-w-[480px] flex-1 flex-col">
      <div className="flex flex-col items-center pt-4 text-center">
        <Image
          src="/brand/tedxnewy-white.png"
          alt="TEDxNewy"
          width={130}
          height={31}
          className="h-auto w-[110px] opacity-90"
        />
        <div
          className="mt-6 font-sans tracking-[-0.02em] text-white"
          style={{
            fontSize: "clamp(2.25rem, 10vw, 3.25rem)",
            fontWeight: 500,
            lineHeight: 0.95,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          SIGNAL
        </div>
        <p className="mt-3 text-[13.5px] font-medium text-white/60">
          Saturday 24 October &middot; Conservatorium of Music
        </p>
        <h1 className="mt-7 font-sans text-[15px] font-medium text-white/90">
          Everything you need, in one place.
        </h1>
      </div>

      <div className="mt-8 flex flex-1 flex-col gap-3.5 pb-10">
        {TILES.map((tile) => (
          <TileCard key={tile.key} tile={tile} onOpen={onOpenTile} />
        ))}
      </div>

      <div className="pb-2 pt-2 text-center">
        <Link
          href="/"
          className="text-[12.5px] font-medium text-white/45 underline-offset-4 hover:text-white/70 hover:underline"
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
      className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all hover:-translate-y-0.5 ${
        tile.muted
          ? "border-dashed border-white/15 bg-white/[0.02] hover:border-white/25"
          : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]"
      }`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[#ff9b8f]">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2">
          <span className="font-sans text-[15.5px] font-medium tracking-[-0.01em] text-white">
            {tile.label}
          </span>
          {tile.badge && (
            <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-white/50">
              {tile.badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 text-[13px] leading-[1.4] text-white/60">
          {tile.description}
        </span>
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-white/40" strokeWidth={2} />
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

function SpeakersModalContent({ speakers }: { speakers: SpeakerWithTalk[] }) {
  if (speakers.length === 0) {
    return (
      <p className="text-[14.5px] leading-[1.6] text-white/70">
        Our lineup for Signal is still being locked in. Check back soon, or
        keep an eye on Instagram (@tedxnewy) for the first announcements.
      </p>
    );
  }

  return (
    <SpeakerLineup speakers={speakers}>
      <SignalSpeakerPuzzle speakers={speakers} />
      <div className="hidden grid-cols-3 gap-x-4 gap-y-7 sm:grid">
        {speakers.map((s) => (
          <SignalSpeakerCard key={s.slug} speaker={s} />
        ))}
      </div>
    </SpeakerLineup>
  );
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
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-7">
        {sponsors.map((s) => (
          <div key={s.name} className="flex flex-col items-center gap-2">
            {s.logoUrl ? (
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
            )}
          </div>
        ))}
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
        Australia, on Awabakal and Worimi Country. We find the ideas this
        city is quietly sitting on, put them on a stage, and send them
        somewhere bigger.
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
