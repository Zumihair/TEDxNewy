import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import Scribble from "@/components/Scribble";

export const metadata = {
  alternates: { canonical: "/youth-futures-lab" },
  title: "Youth Futures Lab · TEDxNewy",
  description:
    "TEDxNewy's Youth Futures Lab: a one-day hackathon for the next generation of Newcastle leaders, held 7 August 2026 at NUspace City Campus with the University of Newcastle. Recap coming soon.",
  openGraph: {
    title: "Youth Futures Lab · TEDxNewy",
    description:
      "A one-day hackathon for the next generation of Newcastle leaders. TEDxNewy × University of Newcastle, 7 August 2026 at NUspace City Campus.",
    type: "website",
  },
};

export default function YouthFuturesLabPage() {
  return (
    <>
      <BreadcrumbJsonLd name="Youth Futures Lab" path="/youth-futures-lab" />
      <PageHero
        kicker="Past event · 7 August 2026"
        titleTop="Youth Futures Lab."
        intro={
          <>
            A one-day hackathon for the next generation of Newcastle leaders,
            run with the University of Newcastle at NUspace City Campus. The
            day has been and gone, our second Salon of the 2026 season.
          </>
        }
      />

      {/* Recap placeholder — light, ideation/child-themed doodles that draw
          themselves in as the section scrolls into view. */}
      <section className="relative overflow-hidden bg-[#f9f5ec]">
        <Scribble
          variant="lightbulb"
          color="#b91404"
          className="pointer-events-none absolute left-[6%] top-[14%] hidden h-16 w-16 opacity-70 sm:block md:h-20 md:w-20"
        />
        <Scribble
          variant="spark"
          color="#2a3a88"
          delayMs={150}
          className="pointer-events-none absolute right-[10%] top-[8%] h-10 w-10 opacity-70 md:h-14 md:w-14"
        />
        <Scribble
          variant="spiral"
          color="#b91404"
          delayMs={100}
          className="pointer-events-none absolute bottom-[16%] left-[12%] hidden h-14 w-14 opacity-60 sm:block"
        />
        <Scribble
          variant="squiggle"
          color="#2a3a88"
          delayMs={250}
          className="pointer-events-none absolute bottom-[10%] right-[8%] h-8 w-24 opacity-60 md:h-10 md:w-32"
        />

        <div className="relative mx-auto max-w-[720px] px-5 py-24 text-center md:px-6 md:py-32">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#b91404]"
            style={{ letterSpacing: "0.24em" }}
          >
            The recap
          </div>
          <h2
            className="mt-5 font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            The lab has wrapped. The stories are coming.
          </h2>
          <p className="mt-6 text-[16px] leading-[1.7] text-[#2a2521]">
            Students spent the day workshopping ideas, practising
            TED-style delivery and pitching real Newcastle challenges to a
            room of facilitators. Photos and stories from the day will be
            added here soon.
          </p>
          <Scribble
            variant="underline"
            color="#b91404"
            delayMs={350}
            className="mx-auto mt-8 h-4 w-32"
          />
        </div>
      </section>

      {/* Where to next */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="text-[10.5px] font-semibold uppercase text-[#b91404]"
            style={{ letterSpacing: "0.24em" }}
          >
            More TEDxNewy
          </div>
          <h2
            className="mt-5 max-w-[28ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            More Salons across the year.
          </h2>
          <p className="mt-5 text-[15.5px] leading-[1.6] text-[#2a2521]">
            Subscribe and we&rsquo;ll let you know the moment the next one is
            announced.
          </p>
          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href="/subscribe"
              className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40"
            >
              Subscribe to find out when
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link
              href="/salons"
              className="inline-flex items-center gap-1.5 text-[14.5px] font-medium text-[#b91404]"
            >
              See all Salons
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
