import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import RecapVideo from "@/components/RecapVideo";

export const metadata = {
  title: "Newcastle 2050: What If? · TEDxNewy Salon recap",
  description:
    "TEDxNewy Salon — Newcastle 2050: What If? — staged on Thursday 30 April 2026 at the Q Building, Honeysuckle. Three more events to be announced soon.",
};

export default function TicketsPage() {
  return (
    <>
      <PageHero
        kicker="Past event · 30 April 2026"
        titleTop="Newcastle 2050: What If?"
        intro={
          <>
            Our 2026 season opener — held on Thursday 30 April at the Q
            Building, Honeysuckle. Three themed rooms, bold questions and an
            evening of imagining what Newcastle becomes by 2050.
          </>
        }
      />

      {/* BANNER VIDEO — autoplay loop, muted, plays the moment the page loads */}
      <section className="mx-auto max-w-[1180px] px-5 pb-16 md:px-6 md:pb-20">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-md)] bg-[#0a0908]">
          <video
            src="/video/salon-banner.mov"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </section>

      {/* DETAILS BLOCK */}
      <section className="mx-auto max-w-[1180px] px-5 pb-16 md:px-6 md:pb-20">
        <div className="grid gap-10 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-4">
            <div
              className="text-[10.5px] font-semibold uppercase text-[#e02214]"
              style={{ letterSpacing: "0.24em" }}
            >
              The Salon
            </div>
            <div className="mt-4 space-y-1 text-[15px] leading-[1.55] text-[#0a0908]">
              <div className="font-medium">Thursday 30 April 2026</div>
              <div className="text-[#6b6459]">Doors 6pm</div>
              <div className="mt-3 font-medium">Q Building</div>
              <div className="text-[#6b6459]">Honeysuckle, Newcastle</div>
            </div>
          </div>
          <div className="md:col-span-8">
            <h2
              className="font-sans tracking-[-0.025em] text-[#0a0908] balance"
              style={{
                fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
                lineHeight: 1.05,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              Three rooms. One question.
            </h2>
            <p className="mt-5 text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
              An evening of bold questions, creative thinking and new
              perspectives — three themed rooms imagining how we move, live
              and experience Newcastle in 2050. Live discussion, interactive
              screens and hands-on activities, with one provocation in
              common: <em className="italic">what if</em>?
            </p>
          </div>
        </div>
      </section>

      {/* RECAP VIDEO — click to play, larger 82MB file deferred */}
      <section className="bg-[#f9f5ec]">
        <div className="mx-auto max-w-[1180px] px-5 py-20 md:px-6 md:py-28">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div
                className="text-[10.5px] font-semibold uppercase text-[#e02214]"
                style={{ letterSpacing: "0.24em" }}
              >
                Watch the recap
              </div>
              <h2
                className="mt-3 max-w-[24ch] font-sans tracking-[-0.025em] text-[#0a0908] balance"
                style={{
                  fontSize: "clamp(1.65rem, 3vw, 2.25rem)",
                  lineHeight: 1.1,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                A few minutes from the room.
              </h2>
            </div>
          </div>
          <RecapVideo
            src="/video/salon-recap.mov"
            caption="TEDxNewy Salon · Newcastle 2050: What If? · 30 April 2026 · Q Building, Honeysuckle"
          />
        </div>
      </section>

      {/* WHAT'S NEXT */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1180px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="text-[10.5px] font-semibold uppercase text-[#6b6459]"
            style={{ letterSpacing: "0.24em" }}
          >
            What&rsquo;s next
          </div>
          <h2
            className="mt-5 max-w-[28ch] font-sans tracking-[-0.025em] text-[#0a0908] balance"
            style={{
              fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            More events to be announced soon.
          </h2>
          <p className="mt-5 max-w-[60ch] text-[15.5px] leading-[1.6] text-[#2a2521]">
            Three more events are coming across 2026 &mdash; subscribe and
            we&rsquo;ll let you know as soon as the next one is announced.
          </p>
          <Link
            href="/#identity"
            className="mt-8 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-[#e02214]"
          >
            Subscribe to be first
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </>
  );
}
