import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import RedCircle from "@/components/RedCircle";

export const metadata = {
  title: "Page not found · TEDxNewy",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="relative flex min-h-[100vh] items-center overflow-hidden bg-[var(--color-cream)] pt-32 pb-20">
      <div className="mx-auto grid w-full max-w-[1240px] items-center gap-14 px-5 md:grid-cols-[1.2fr_1fr] md:gap-16 md:px-6">
        <div>
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            Error · 404
          </div>
          <h1
            className="mt-6 font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(2.75rem, 7vw, 5.25rem)",
              lineHeight: 0.98,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            That idea isn&rsquo;t on this stage.
          </h1>
          <p className="mt-7 max-w-[52ch] text-[17px] leading-[1.65] text-[#2a2521] md:text-[18px]">
            The page you&rsquo;re after doesn&rsquo;t exist — or has wandered
            off to the green room. Let&rsquo;s get you back to the auditorium.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-cream)]"
            >
              Back to home
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link
              href="/watch"
              className="inline-flex items-center gap-1.5 font-sans text-[14px] font-medium text-[#141210] transition-colors hover:text-[#e02214]"
            >
              Watch past talks instead
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <RedCircle size={340} opacity={0.95} />
          <div
            className="absolute font-sans tracking-[-0.04em] text-white"
            style={{
              fontSize: "clamp(3.25rem, 7vw, 6rem)",
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
              lineHeight: 1,
            }}
          >
            404
          </div>
        </div>
      </div>
    </section>
  );
}
