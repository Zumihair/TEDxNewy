import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import EventRow from "@/components/EventRow";
import { salons } from "@/lib/data";

export const metadata = {
  title: "Salons · TEDxNewy",
  description:
    "TEDxNewy Salons — shorter, more experimental evenings at the Q Building, Honeysuckle. Newcastle 2050: What If? opened the 2026 series.",
};

export default function SalonsPage() {
  const past = salons.filter((s) => s.status === "Past");

  return (
    <>
      <PageHero
        kicker="The Salon series"
        titleTop="The nights in between."
        intro={
          <>
            TEDxNewy Salons are shorter, more experimental evenings — held at
            the Q Building on Honeysuckle. Think of them as the laboratory for
            ideas before they reach a main stage.
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
              href="/tickets"
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
