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
    <section className="bg-white pt-40 pb-32 md:pt-48 md:pb-40">
      <div className="mx-auto max-w-[680px] px-5 text-center md:px-6">
        <h1
          className="mt-6 font-sans tracking-[-0.025em] text-[#000000] balance"
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
            Reference: <code className="font-ui">{error.digest}</code>
          </p>
        )}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="btn-red"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2} />
            Try again
          </button>
          <Link
            href="/"
            className="btn-primary"
          >
            Back to home
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
