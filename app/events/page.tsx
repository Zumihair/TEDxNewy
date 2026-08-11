import PageHero from "@/components/PageHero";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import EventRow from "@/components/EventRow";
import { getEvents, type CmsEvent } from "@/lib/cms-content";
import { SIGNAL_LIVE } from "@/lib/feature-flags";

export const metadata = {
  alternates: { canonical: "/events" },
  title: "Events · TEDxNewy",
  description:
    "Every TEDxNewy event, from the flagship main stage to salons and special nights. See what's coming up across the season and revisit the ones that have been.",
};

// Re-fetch from Supabase every 60s so admin edits land live without redeploys.
export const revalidate = 60;

const KIND_GRADIENT: Record<CmsEvent["kind"], string> = {
  flagship: "linear-gradient(135deg, #2a0604 0%, #8c0d05 50%, #b91404 100%)",
  salon: "linear-gradient(135deg, #2a3a88 0%, #121a48 50%, #050818 100%)",
  special: "linear-gradient(135deg, #1f4a5c 0%, #0c2430 60%, #050f15 100%)",
};

const KIND_LABEL: Record<CmsEvent["kind"], string> = {
  flagship: "Main stage",
  salon: "Salon",
  special: "Special event",
};

function eventHref(e: CmsEvent) {
  return e.linkUrl ?? `/events/${e.slug}`;
}

function byDateAscending(a: CmsEvent, b: CmsEvent) {
  const at = a.startsAt ? Date.parse(a.startsAt) : Number.POSITIVE_INFINITY;
  const bt = b.startsAt ? Date.parse(b.startsAt) : Number.POSITIVE_INFINITY;
  return at - bt;
}

export default async function EventsPage() {
  const events = await getEvents();
  const upcoming = events
    .filter((e) => e.status === "announced")
    // Signal isn't public yet, so keep it out of "Coming up" until it is.
    .filter((e) => SIGNAL_LIVE || e.linkUrl !== "/signal")
    .sort(byDateAscending);
  const past = events.filter((e) => e.status === "past");

  return (
    <>
      <BreadcrumbJsonLd name="Events" path="/events" />
      <PageHero
        kicker="The season"
        titleTop="Every TEDxNewy event."
        intro={
          <>
            Our flagship main stage, the Salon series and the special nights in
            between. Here is what we are building toward across the season, and
            the events that have already been.
          </>
        }
      />

      {/* Coming up */}
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
                imageGradient={KIND_GRADIENT[e.kind]}
                label={e.shortDate ?? KIND_LABEL[e.kind]}
                labelAccent="red"
                title={e.title}
                meta={[e.dateLabel, e.venue].filter(Boolean).join(" · ")}
                description={e.tagline ?? e.blurb ?? undefined}
                linkLabel="Find out more"
              />
            ))}
          </div>
        </section>
      )}

      {/* Past events */}
      {past.length > 0 && (
        <section className="mx-auto max-w-[1100px] px-5 pb-20 pt-8 md:px-6 md:pb-24">
          <div
            className="mb-2 text-[10.5px] font-semibold uppercase text-[#6b6459]"
            style={{ letterSpacing: "0.24em" }}
          >
            Past events
          </div>
          <div className="divide-y divide-[rgba(20,18,16,0.10)]">
            {past.map((e) => (
              <EventRow
                key={e.id}
                href={eventHref(e)}
                image={e.heroImageUrl ?? undefined}
                imageAlt={e.title}
                imageGradient={KIND_GRADIENT[e.kind]}
                label={e.shortDate ?? KIND_LABEL[e.kind]}
                labelAccent="neutral"
                title={e.title}
                meta={[e.dateLabel, e.venue].filter(Boolean).join(" · ")}
                description={e.tagline ?? e.blurb ?? undefined}
                linkLabel="Read about it"
              />
            ))}
          </div>
        </section>
      )}

      {(upcoming.length === 0 && past.length === 0) && (
        <section className="mx-auto max-w-[1100px] px-5 pb-24 md:px-6">
          <p className="text-[15.5px] text-[#2a2521]">
            Events will appear here soon.
          </p>
        </section>
      )}
    </>
  );
}
