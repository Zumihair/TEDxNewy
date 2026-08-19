"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

/**
 * Meta (Facebook/Instagram) ads pixel, ID 1515999640565864. Base code fires
 * once on load via the script below; this also re-fires PageView on every
 * client-side route change, since App Router navigation never reloads the
 * document — without it Meta would only ever see one pageview per visit,
 * no matter how many pages someone actually browsed.
 */

const PIXEL_ID = "1515999640565864";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function PixelPageviews() {
  const pathname = usePathname();
  // MetaPixel lives in the root layout, which never unmounts across a
  // client-side navigation (only the page content inside it changes), so
  // this ref reliably survives for the whole visit.
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      // Skip the very first fire: the base script above already sends the
      // initial PageView itself.
      mounted.current = true;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  return null;
}

export default function MetaPixel() {
  return (
    <>
      <Script id="meta-pixel-base" strategy="beforeInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          alt=""
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
      <PixelPageviews />
    </>
  );
}
