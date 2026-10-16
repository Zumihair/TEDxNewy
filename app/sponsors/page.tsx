import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import PhotoFill from "@/components/PhotoFill";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import PartnerTiers from "@/components/PartnerTiers";

export const metadata = {
  alternates: { canonical: "/sponsors" },
  title: "Partners · TEDxNewy",
  description:
    "TEDxNewy is supported by partners across the Hunter. Every partner dollar goes into the speakers, the stage, and the next generation of Novocastrian storytellers.",
};

/**
 * Renders the same fixed partner list and lockup as /signal and the
 * /signal/links Partners modal (lib/signal-links-partners.ts via
 * PartnerTiers), so every place shows one set of partners at one set of
 * proportions. Changed 2026-10-13 from the CMS-driven `getSponsors()` rows;
 * keep `cms_sponsors` in sync with supabase/migrations/20261013_sponsors_refresh.sql.
 */
export default function SponsorsPage() {
  return (
    <>
      <BreadcrumbJsonLd name="Partners" path="/sponsors" />
      <PageHero
        titleTop="Made possible"
        titleBottom="by the Hunter."
        accent="red"
        intro={
          <>
            TEDxNewy is volunteer-run and not-for-profit. Every partner dollar
            goes back into the room: the curious, ambitious Novocastrians who
            gather around each event.
          </>
        }
      />

      {/* Partner list: primary pair, divider, supporting four (PartnerTiers). */}
      <section className="mx-auto max-w-[1000px] px-5 pb-20 pt-4 md:px-6 md:pb-24">
        <PartnerTiers variant="light" scale={2} />
      </section>

      {/* Partner with us */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <h2
                className="mt-5 max-w-[24ch] font-sans tracking-[-0.025em] text-[#000000] balance"
                style={{
                  fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
                  lineHeight: 1.05,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                Back the next thinking from the Hunter.
              </h2>
              <p className="mt-5 text-[16px] leading-[1.65] text-[#2a2521]">
                The 2026 season runs four events with a curious in-person
                audience across Newcastle and a YouTube reach on the global TEDx
                network. Every dollar goes back into the room and the people in
                it.
              </p>
              <Link
                href="/partner"
                className="btn-red mt-8"
              >
                Request the 2026 partner pack
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
            <div
              className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg,20px)]"
              style={{
                boxShadow: "0 30px 60px -32px rgba(42, 6, 4, 0.5)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <PhotoFill
                src="/images/participate/partners.webp"
                alt="TEDxNewy organisers and partners at Reframe, 2025"
                sizes="(max-width: 768px) 100vw, 50vw"
                hoverZoom={false}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(230,43,30,0.05) 0%, rgba(42,6,4,0) 45%, rgba(42,6,4,0.35) 100%)",
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
