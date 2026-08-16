import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PastEventCard from "@/components/PastEventCard";
import { eventHref, getEvents, type CmsEvent } from "@/lib/cms-content";

/**
 * "Check out our recent events" — the shared closing band on every event page.
 *
 * The whole point is that it is LIVE: it reads the three most recent past
 * events straight from `cms_events`, so marking an event Past in
 * `/admin/events` updates every event page at once. Nobody has to go and edit
 * a hardcoded list when a new event happens, which is exactly what used to go
 * stale.
 *
 * Wired into the generic `/events/[slug]` template and each of the hand-built
 * event pages (they don't inherit shared sections from the template). If you
 * add another bespoke event page, add this to it too.
 */

const CARD_GRADIENT: Record<CmsEvent["kind"], string> = {
  flagship: "linear-gradient(135deg, #2a3a88 0%, #1f1f4a 50%, #050818 100%)",
  salon: "linear-gradient(135deg, #2a3a88 0%, #121a48 50%, #050818 100%)",
  special: "linear-gradient(135deg, #1f4a5c 0%, #0c2430 60%, #050f15 100%)",
};

export default async function RecentEvents({
  excludeSlug,
  variant = "band",
}: {
  /** The event being viewed, so a page never lists itself. */
  excludeSlug?: string;
  /**
   * "band" paints its own dark surface, for pages that end on cream.
   * "inline" stays transparent, for pages already on a dark background
   * (/signal) so it doesn't stack a second background on top.
   */
  variant?: "band" | "inline";
}) {
  const past = await getEvents({ status: "past" });
  const recent = past.filter((e) => e.slug !== excludeSlug).slice(0, 3);

  // Nothing to show (Supabase unreachable, or this is the only event) is a
  // reason to render nothing, never an empty heading.
  if (recent.length === 0) return null;

  const dark = variant === "band";

  return (
    <section
      className={
        dark
          ? "relative overflow-hidden bg-[#141210] text-white"
          : "relative border-t border-white/10 text-white"
      }
    >
      {dark && (
        <>
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #2a0604 0%, #141210 55%, #141210 100%)",
            }}
          />
          <div className="grain pointer-events-none absolute inset-0 opacity-25" />
        </>
      )}

      <div className="relative mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
        <h2
          className="font-sans tracking-[-0.025em] text-white balance"
          style={{
            fontSize: "clamp(1.65rem, 3vw, 2.25rem)",
            lineHeight: 1.1,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          Check out our recent events
        </h2>

        <ul className="mt-12 grid grid-cols-1 gap-x-7 gap-y-12 md:mt-14 md:grid-cols-3">
          {recent.map((e) => (
            <li key={e.id}>
              <PastEventCard
                href={eventHref(e)}
                image={e.heroImageUrl ?? undefined}
                imageAlt={e.title}
                imageGradient={CARD_GRADIENT[e.kind]}
                date={e.dateLabel ?? e.shortDate ?? ""}
                title={e.title}
                subtitle={e.venue ?? undefined}
              />
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 md:mt-14">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-sans text-[14.5px] font-medium text-[#2a0604] transition-all hover:-translate-y-0.5 hover:bg-white/90"
          >
            All events
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
          </Link>
          <Link
            href="/signature"
            className="inline-flex items-center gap-1.5 text-[14.5px] font-medium text-white/85 transition-colors hover:text-white"
          >
            Signature events
          </Link>
          <Link
            href="/salons"
            className="inline-flex items-center gap-1.5 text-[14.5px] font-medium text-white/85 transition-colors hover:text-white"
          >
            Salons
          </Link>
        </div>
      </div>
    </section>
  );
}
