"use client";

import { useEffect, useRef, useState } from "react";
import { Gift, X } from "lucide-react";

/**
 * Signal-only top banner (early bird offer). Fixed above the shared Nav
 * (which is itself `fixed top-0`, see components/Nav.tsx), so this pushes
 * the nav down by setting --banner-offset on <html> for as long as it's
 * mounted/visible — measured from its own height so it works regardless of
 * how the copy wraps at a given breakpoint, and cleaned up on unmount/
 * dismiss so no other page is affected.
 */
export default function SignalPromoBanner({ href }: { href: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) {
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
  }, [dismissed]);

  // Always reset on unmount (e.g. navigating to another page), regardless
  // of dismissed state.
  useEffect(() => {
    return () => document.documentElement.style.setProperty("--banner-offset", "0px");
  }, []);

  if (dismissed) return null;

  return (
    <div
      ref={ref}
      className="fixed inset-x-0 top-0 z-[60] bg-[#e02214] text-white"
    >
      <div className="mx-auto flex max-w-[1240px] items-center justify-center gap-3 px-10 py-2.5 text-center sm:px-12">
        <Gift className="h-4 w-4 shrink-0" strokeWidth={2} />
        <p className="text-[12.5px] font-medium leading-tight sm:text-[13.5px]">
          Early bird offer: get a free Signal tee with every ticket.{" "}
          <a href={href} className="underline underline-offset-2 hover:no-underline">
            Get tickets
          </a>{" "}
          — ends soon.
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
          className="absolute right-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/15 hover:text-white sm:right-4"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
