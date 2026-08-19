"use client";

import { useEffect } from "react";
import { trackSubscribeLead } from "@/lib/pixel-events";

/**
 * Fires the Meta ads Lead event when /thanks is landed on from a successful
 * subscribe submission. Every subscribe form on the site (homepage, /subscribe,
 * /contact) is a plain POST to /api/subscribe, which redirects here with
 * ?source=subscribe on success — so this one component covers all of them,
 * present and future, without each form needing its own instrumentation.
 * (The season announce pop-up submits via fetch instead of a real
 * navigation, so it never lands here; it fires the same event itself.)
 */
export default function ThanksConversion({
  source,
  isError,
}: {
  source?: string;
  isError: boolean;
}) {
  useEffect(() => {
    if (source === "subscribe" && !isError) trackSubscribeLead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
