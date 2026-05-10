"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowUpRight, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("[error.tsx]", error);
    }
  }, [error]);

  return (
    <section className="bg-[#f3ece0] pt-40 pb-32 md:pt-48 md:pb-40">
      <div className="mx-auto max-w-[680px] px-5 text-center md:px-6">
        <div
          className="text-[10.5px] font-semibold uppercase text-[#e02214]"
          style={{ letterSpacing: "0.24em" }}
        >
          Something went wrong on our stage
        </div>
        <h1
          className="mt-6 font-sans tracking-[-0.025em] text-[#141210] balance"
          style={{
            fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
            lineHeight: 1.02,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          We hit an unexpected glitch.
        </h1>
        <p className="mt-6 text-[16px] leading-[1.65] text-[#2a2521]">
          The page you were trying to reach failed to load. Try again, or head
          home and we&rsquo;ll get you back on track.
        </p>
        {error.digest && (
          <p className="mt-3 text-[12px] text-[#6b6459]">
            Reference: <code className="font-mono">{error.digest}</code>
          </p>
        )}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-6 py-3 text-[14px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3ece0]"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2} />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,18,16,0.18)] px-6 py-3 text-[14px] font-medium text-[#141210] transition-colors hover:border-[#141210] hover:bg-[#141210] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2"
          >
            Back to home
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
