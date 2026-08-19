"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackGetTickets } from "@/lib/pixel-events";

/**
 * Drop-in replacement for a plain "Get tickets" <a>: identical props and
 * rendering, it just also fires the Meta ads InitiateCheckout event.
 *
 * Fires on pointerdown, not click. The Humanitix pop-up widget script
 * (see app/signal/page.tsx) attaches its own click handling to intercept
 * navigation on these exact links and open its overlay instead — verified
 * it really does swallow the click event before a React onClick here ever
 * runs, not just in theory. pointerdown fires earlier in the sequence
 * (pointerdown -> mouseup -> click) and is unrelated to whatever the widget
 * does with click, so it reliably fires regardless.
 *
 * Exists so server components (app/signal/page.tsx,
 * app/events/[slug]/page.tsx) can render an instrumented ticket link
 * without becoming client components themselves.
 */
export default function TicketLink({
  onPointerDown,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      onPointerDown={(e) => {
        trackGetTickets();
        onPointerDown?.(e);
      }}
    />
  );
}
