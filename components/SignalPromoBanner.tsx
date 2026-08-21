"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Gift, X, type LucideIcon } from "lucide-react";
import { trackGetTickets } from "@/lib/pixel-events";

/**
 * Top announcement banner. Fixed above the shared Nav (which is itself
 * `fixed top-0`, see components/Nav.tsx), so this pushes the nav down by
 * setting --banner-offset on <html> for as long as it's mounted/visible.
 * `body` also reads that var as its padding-top (app/globals.css), which is
 * what stops the pushed-down nav from covering the top of a page that knows
 * nothing about the banner. Measured from its own height so it works
 * regardless of how the copy wraps at a given breakpoint, and cleaned up on
 * unmount/dismiss so no other page is affected.
 *
 * Two call sites, deliberately different:
 * - `/signal` mounts it with the early bird offer and a Humanitix pop-up
 *   link (`external`), so the CTA opens checkout without leaving the page.
 * - `components/SiteBanner.tsx` mounts it site-wide with the tickets-on-sale
 *   line and an internal link to `/signal`, i.e. to the event page rather
 *   than straight to checkout.
 *
 * Pass `storageKey` to make a dismissal stick across navigations. Without
 * it the banner is dismissed only for the current mount, which is right for
 * a single page and wrong for a site-wide bar (it would come back on every
 * click). While a `storageKey` is set the banner renders nothing until the
 * stored value has been read, so a dismissed bar never flashes in.
 *
 * **On a phone this is ONE ROW and cannot be dismissed** (2026-08-21). Both
 * halves of that are the same fix. The bar used to wrap: the copy took two or
 * three lines and the CTA dropped below it, and since `body` padding tracks
 * the banner's height, a tall bar pushes every page down by that much. So the
 * close button is `sm:` and up only, and the space it was reserving
 * (`px-10`) now holds the CTA inline beside the text instead. Below `sm` the
 * row is `flex-nowrap`, so it physically cannot become a block again.
 *
 * That makes `shortMessage` load-bearing rather than a nicety: a caller
 * passing only a long `message` will see it squeezed against the CTA on a
 * narrow phone. Give every call site a short form that fits one line at
 * 375px, and check it there rather than assuming.
 */
export default function SignalPromoBanner({
  href,
  message,
  shortMessage,
  ctaLabel = "Get tickets",
  external = false,
  icon: Icon = Gift,
  storageKey,
}: {
  href: string;
  message: ReactNode;
  /** Below `sm`, shown instead of `message`. Defaults to `message`. */
  shortMessage?: ReactNode;
  ctaLabel?: string;
  external?: boolean;
  icon?: LucideIcon;
  storageKey?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(!storageKey);

  useEffect(() => {
    if (!storageKey) return;
    try {
      if (window.localStorage.getItem(storageKey) === "dismissed") {
        setDismissed(true);
      }
    } catch {
      // storage disabled: the banner just won't remember the dismissal
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (dismissed || !ready) {
      document.documentElement.style.setProperty("--banner-offset", "0px");
      return;
    }
    const el = ref.current;
    if (!el) return;

    function setOffset() {
      document.documentElement.style.setProperty(
        "--banner-offset",
        `${el!.offsetHeight}px`,
      );
    }
    setOffset();
    window.addEventListener("resize", setOffset);
    return () => window.removeEventListener("resize", setOffset);
  }, [dismissed, ready]);

  // Always reset on unmount (e.g. navigating to another page), regardless
  // of dismissed state.
  useEffect(() => {
    return () => document.documentElement.style.setProperty("--banner-offset", "0px");
  }, []);

  function dismiss() {
    setDismissed(true);
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, "dismissed");
    } catch {
      // storage disabled: dismissal lasts for this page only
    }
  }

  if (dismissed || !ready) return null;

  const ctaCls =
    "inline-flex shrink-0 items-center rounded-full bg-white px-3 py-1 font-sans text-[11.5px] font-semibold text-[#b91404] transition-colors hover:bg-[#ffe9e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:px-3.5 sm:py-1.5 sm:text-[12.5px]";

  const cta = external ? (
    <a href={href} onPointerDown={trackGetTickets} className={ctaCls}>
      {ctaLabel}
    </a>
  ) : (
    <Link href={href} className={ctaCls}>
      {ctaLabel}
    </Link>
  );

  return (
    <div
      ref={ref}
      className="fixed inset-x-0 top-0 z-[60] bg-[#e02214] text-white"
    >
      {/* One nowrap row on a phone, the original centred wrapping row from
          `sm:` up. The mobile padding is small because there is no close
          button down there to leave room for. */}
      <div className="mx-auto flex max-w-[1240px] items-center justify-center gap-x-2.5 px-4 py-2 text-center sm:flex-wrap sm:gap-x-3.5 sm:gap-y-2 sm:px-12 sm:py-2.5">
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
        <p className="min-w-0 text-[12px] font-medium leading-tight sm:text-[13.5px]">
          <span className="sm:hidden">{shortMessage ?? message}</span>
          <span className="hidden sm:inline">{message}</span>
        </p>
        {cta}
        {/* Desktop only. On a phone the row has no space for it, and losing
            the dismiss is the trade that keeps the bar one line tall. */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss banner"
          className="absolute right-4 top-2.5 hidden h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/15 hover:text-white sm:flex"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
