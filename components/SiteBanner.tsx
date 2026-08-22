"use client";

import { usePathname } from "next/navigation";
import { Ticket } from "lucide-react";
import SignalPromoBanner from "@/components/SignalPromoBanner";
import { SIGNAL_LIVE } from "@/lib/feature-flags";

/**
 * The site-wide "tickets are on sale" bar, mounted once from
 * app/layout.tsx and gated on SIGNAL_LIVE so it appears in the same push
 * that opens /signal, the nav CTA and the homepage hero.
 *
 * Its CTA points at `/signal`, NOT at Humanitix: the bar's job is to get
 * people to the event page, which carries the tiers, the day, the venue and
 * its own checkout links. The pop-up (components/SeasonAnnouncePopup.tsx) is
 * the one that goes straight to checkout.
 *
 * Skipped on `/signal`, which mounts its own banner carrying whichever
 * release is currently on sale, and on the routes where the public Nav hides
 * itself (`HIDE_ON` in
 * components/Nav.tsx) since those own their chrome and there is no nav for
 * this to sit above.
 */
const SKIP_ON = ["/signal", "/admin", "/subscribe", "/feedback"];

export default function SiteBanner() {
  const pathname = usePathname();
  if (!SIGNAL_LIVE) return null;
  if (SKIP_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  return (
    <SignalPromoBanner
      href="/signal"
      icon={Ticket}
      storageKey="signal-tickets-banner"
      ctaLabel="Get tickets"
      // Two lengths, not one line left to wrap: the full sentence runs to
      // three lines on a phone, which turns a bar into a block and pushes
      // every page down by that much (body padding tracks the banner
      // height). The short form says the same thing in one line, and below
      // `sm` the banner sits the CTA beside it rather than under it, so the
      // short copy has to leave room for the button too.
      // The {" "} is load-bearing: JSX strips the space between a tag and text
      // that wraps to the next line, so `</strong> tickets` on two lines
      // renders as "Signaltickets". It shipped that way for a moment.
      shortMessage={
        <>
          <strong className="font-semibold">Signal</strong>{" "}
          tickets &middot; 24 Oct
        </>
      }
      message={
        <>
          Tickets are on sale for{" "}
          <strong className="font-semibold">Signal</strong>, our biggest stage
          yet, Saturday 24 October.
        </>
      }
    />
  );
}
