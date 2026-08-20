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
 * Skipped on `/signal`, which mounts its own banner with the early bird
 * offer, and on the routes where the public Nav hides itself (`HIDE_ON` in
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
      // height). The short form says the same thing in one line.
      message={
        <>
          <span className="sm:hidden">
            <strong className="font-semibold">Signal</strong>{" "}
            tickets on sale &middot; Sat 24 October
          </span>
          <span className="hidden sm:inline">
            Tickets are on sale for{" "}
            <strong className="font-semibold">Signal</strong>, our biggest
            stage yet, Saturday 24 October.
          </span>
        </>
      }
    />
  );
}
