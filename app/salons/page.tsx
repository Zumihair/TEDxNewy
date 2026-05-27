import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import EventRow from "@/components/EventRow";
import { salons } from "@/lib/data";

export const metadata = {
  title: "Salons · TEDxNewy",
  description:
    "TEDxNewy Salons are smaller, more experimental gatherings built around conversation and ideas, in the spirit of the great European salons. Three new Salons across 2026, each with its own format.",
};

export default function SalonsPage() {
  const past = salons.filter((s) => s.status === "Past");

  return (
    <>
      <PageHero
        kicker="The Salon series"
        titleTop="Salon Events"
        intro={
          <>
            In 17th- and 18th-century Europe, influential hosts, often
            prominent women, held regular gatherings in their{" "}
            <em className="italic">salons</em>: evenings of conversation where
            philosophy, art, writing and politics were turned over in equal
            measure, at once social and intellectual. Our Salons borrow that
            spirit. They&rsquo;re smaller, more experimental gatherings built
            around ideas and the people thinking them through. The three coming
            across 2026 each take their own unique structure and format.
          </>
        }
      />

      {/* Past salons */}
      <section className="mx-auto max-w-[1100px] px-5 pb-20 md:px-6 md:pb-24">
        <div
          className="mb-2 text-[10.5px] font-semibold uppercase text-[#6b6459]"
          style={{ letterSpacing: "0.24em" }}
        >
          Past salons
        </div>

        <div className="divide-y divide-[rgba(20,18,16,0.10)]">
          {past.map((s) => (
            <EventRow
              key={s.id}
              href="/newcastle-2050-salon"
              image={s.image}
              imageAlt={s.title}
              imageGradient="linear-gradient(135deg, #2a3a88 0%, #121a48 50%, #050818 100%)"
              label={s.shortDate}
              labelAccent="neutral"
              title={s.title}
              meta={`${s.date} · ${s.venue}`}
              description={s.tagline}
              linkLabel="Read about it"
            />
          ))}
        </div>
      </section>

      {/* What's next */}
      <section className="bg-[#f9f5ec]">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            What&rsquo;s next
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
            More salons across the year.
          </h2>
          <p className="mt-5 text-[15.5px] leading-[1.6] text-[#2a2521]">
            Three more events are coming across 2026. Subscribe and
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
