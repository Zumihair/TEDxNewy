import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import EventRow from "@/components/EventRow";
import { getEvents, type CmsEvent } from "@/lib/cms-content";

export const metadata = {
  alternates: { canonical: "/salons" },
  title: "Salons · TEDxNewy",
  description:
    "TEDxNewy Salons are smaller, more experimental gatherings built around conversation and ideas, in the spirit of the great European salons. Three new Salons across 2026, each with its own format.",
};

// Re-fetch from Supabase every 60s so admin edits land live without redeploys.
export const revalidate = 60;

const SALON_GRADIENT =
  "linear-gradient(135deg, #2a3a88 0%, #121a48 50%, #050818 100%)";

function eventHref(e: CmsEvent) {
  return e.linkUrl ?? `/events/${e.slug}`;
}

// Soonest first for the upcoming list.
function byDateAscending(a: CmsEvent, b: CmsEvent) {
  const at = a.startsAt ? Date.parse(a.startsAt) : Number.POSITIVE_INFINITY;
  const bt = b.startsAt ? Date.parse(b.startsAt) : Number.POSITIVE_INFINITY;
  return at - bt;
}

export default async function SalonsPage() {
  const salonEvents = await getEvents({ kind: "salon" });
  const upcoming = salonEvents
    .filter((s) => s.status === "announced")
    .sort(byDateAscending);
  const past = salonEvents.filter((s) => s.status === "past");

  return (
    <>
      <BreadcrumbJsonLd name="Salons" path="/salons" />
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

      {/* Upcoming salons (only shown when one is announced) */}
      {upcoming.length > 0 && (
        <section className="mx-auto max-w-[1100px] px-5 pb-4 md:px-6">
          <div
            className="mb-2 text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            Coming up
          </div>
          <div className="divide-y divide-[rgba(20,18,16,0.10)]">
            {upcoming.map((s) => (
              <EventRow
                key={s.id}
                href={eventHref(s)}
                image={s.heroImageUrl ?? undefined}
                imageAlt={s.title}
                imageGradient={SALON_GRADIENT}
                label={s.shortDate ?? undefined}
                labelAccent="red"
                title={s.title}
                meta={[s.dateLabel, s.venue].filter(Boolean).join(" · ")}
                description={s.tagline ?? undefined}
                linkLabel="Find out more"
              />
            ))}
          </div>
        </section>
      )}

      {/* Past salons */}
      {past.length > 0 && (
        <section className="mx-auto max-w-[1100px] px-5 pb-20 pt-8 md:px-6 md:pb-24">
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
                href={eventHref(s)}
                image={s.heroImageUrl ?? undefined}
                imageAlt={s.title}
                imageGradient={SALON_GRADIENT}
                label={s.shortDate ?? undefined}
                labelAccent="neutral"
                title={s.title}
                meta={[s.dateLabel, s.venue].filter(Boolean).join(" · ")}
                description={s.tagline ?? undefined}
                linkLabel="Read about it"
              />
            ))}
          </div>
        </section>
      )}

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
