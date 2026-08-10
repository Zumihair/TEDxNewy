import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import EventRow from "@/components/EventRow";
import { getEvents, type CmsEvent } from "@/lib/cms-content";

export const metadata = {
  alternates: { canonical: "/signature" },
  title: "Signature Events · TEDxNewy",
  description:
    "TEDxNewy's Signature events are our flagship main stage, once a year: a full day of talks, speakers and performances. See what's next and revisit the years that came before it.",
};

// Re-fetch from Supabase every 60s so admin edits land live without redeploys.
export const revalidate = 60;

const FLAGSHIP_GRADIENT =
  "linear-gradient(135deg, #2a0604 0%, #8c0d05 50%, #b91404 100%)";

function eventHref(e: CmsEvent) {
  return e.linkUrl ?? `/events/${e.slug}`;
}

// Soonest first for the upcoming list.
function byDateAscending(a: CmsEvent, b: CmsEvent) {
  const at = a.startsAt ? Date.parse(a.startsAt) : Number.POSITIVE_INFINITY;
  const bt = b.startsAt ? Date.parse(b.startsAt) : Number.POSITIVE_INFINITY;
  return at - bt;
}

export default async function SignaturePage() {
  const flagshipEvents = await getEvents({ kind: "flagship" });
  const upcoming = flagshipEvents
    .filter((e) => e.status === "announced")
    .sort(byDateAscending);
  const past = flagshipEvents.filter((e) => e.status === "past");

  return (
    <>
      <BreadcrumbJsonLd name="Signature Events" path="/signature" />
      <PageHero
        titleTop="Signature Events"
        intro={
          <>
            Once a year we bring everything into one room: a full day on our
            biggest stage, with our strongest lineup of speakers and
            performances. Signature is where TEDxNewy started, in 2024, and
            where the flagship event returns each October. Below is
            what&rsquo;s next, and every year that came before it.
          </>
        }
      />

      {/* Upcoming signature event (only shown when one is announced) */}
      {upcoming.length > 0 && (
        <section className="mx-auto max-w-[1100px] px-5 pb-4 md:px-6">
          <div
            className="mb-2 text-[10.5px] font-semibold uppercase text-[#b91404]"
            style={{ letterSpacing: "0.24em" }}
          >
            Coming up
          </div>
          <div className="divide-y divide-[rgba(20,18,16,0.10)]">
            {upcoming.map((e) => (
              <EventRow
                key={e.id}
                href={eventHref(e)}
                image={e.heroImageUrl ?? undefined}
                imageAlt={e.title}
                imageGradient={FLAGSHIP_GRADIENT}
                label={e.shortDate ?? undefined}
                labelAccent="red"
                title={e.title}
                meta={[e.dateLabel, e.venue].filter(Boolean).join(" · ")}
                description={e.tagline ?? undefined}
                linkLabel="Find out more"
              />
            ))}
          </div>
        </section>
      )}

      {/* Past signature events */}
      {past.length > 0 && (
        <section className="mx-auto max-w-[1100px] px-5 pb-20 pt-8 md:px-6 md:pb-24">
          <div
            className="mb-2 text-[10.5px] font-semibold uppercase text-[#6b6459]"
            style={{ letterSpacing: "0.24em" }}
          >
            Past signature events
          </div>
          <div className="divide-y divide-[rgba(20,18,16,0.10)]">
            {past.map((e) => (
              <EventRow
                key={e.id}
                href={eventHref(e)}
                image={e.heroImageUrl ?? undefined}
                imageAlt={e.title}
                imageGradient={FLAGSHIP_GRADIENT}
                label={e.shortDate ?? undefined}
                labelAccent="neutral"
                title={e.title}
                meta={[e.dateLabel, e.venue].filter(Boolean).join(" · ")}
                description={e.tagline ?? undefined}
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
            className="text-[10.5px] font-semibold uppercase text-[#b91404]"
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
            Don&rsquo;t miss what&rsquo;s next.
          </h2>
          <p className="mt-5 text-[15.5px] leading-[1.6] text-[#2a2521]">
            Subscribe and we&rsquo;ll let you know the moment any new
            TEDxNewy event, big or small, is announced.
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
              href="/events"
              className="inline-flex items-center gap-1.5 text-[14.5px] font-medium text-[#b91404]"
            >
              See all events
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
