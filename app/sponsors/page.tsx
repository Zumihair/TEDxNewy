import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import { sponsors, ORG } from "@/lib/data";

export const metadata = {
  title: "Partners · TEDxNewy",
  description:
    "TEDxNewy is supported by partners across the Hunter — University of Newcastle, Henderson, Frekl, Newy Digital, and more.",
};

const tierOrder: Array<"Presenting" | "Platinum" | "Gold" | "Community"> = [
  "Presenting",
  "Platinum",
  "Gold",
  "Community",
];

export default function SponsorsPage() {
  return (
    <>
      <PageHero
        kicker="Our partners"
        titleTop="Made possible"
        titleBottom="by the Hunter."
        accent="red"
        intro={
          <>
            TEDxNewy is volunteer-run and not-for-profit. Every partner dollar
            goes into the speakers, the stage and the next generation of
            Novocastrian storytellers.
          </>
        }
      />

      {/* Tier list */}
      <section className="mx-auto max-w-[1100px] px-5 pb-20 md:px-6 md:pb-24">
        <ul className="divide-y divide-[rgba(20,18,16,0.10)]">
          {tierOrder.map((tier) => {
            const list = sponsors.filter((s) => s.tier === tier);
            if (!list.length) return null;
            return (
              <li
                key={tier}
                className="grid grid-cols-1 gap-3 py-9 md:grid-cols-[160px_1fr] md:gap-12 md:py-11"
              >
                <div
                  className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
                  style={{ letterSpacing: "0.24em" }}
                >
                  {tier}
                </div>
                <ul className="flex flex-wrap items-baseline gap-x-8 gap-y-3 text-[#141210]">
                  {list.map((s) => (
                    <li
                      key={s.name}
                      className={
                        tier === "Presenting"
                          ? "text-[clamp(1.5rem,2.4vw,2rem)] font-medium tracking-[-0.02em] leading-tight"
                          : tier === "Platinum"
                          ? "text-[clamp(1.2rem,1.8vw,1.5rem)] font-medium tracking-[-0.015em] leading-tight"
                          : tier === "Gold"
                          ? "text-[16.5px] font-medium leading-tight"
                          : "text-[14.5px] leading-tight"
                      }
                      style={{ fontVariationSettings: '"opsz" 96' }}
                    >
                      {s.name}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Partner with us */}
      <section className="bg-[#f9f5ec]">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            Partner with us
          </div>
          <h2
            className="mt-5 max-w-[28ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Back the next thinking from the Hunter.
          </h2>
          <p className="mt-5 max-w-[60ch] text-[16px] leading-[1.65] text-[#2a2521]">
            The 2026 season runs four events with an audience that spans rooms
            in Newcastle and a YouTube reach across the TEDx network. Packages
            range from a single Salon presence to multi-event naming rights.
          </p>
          <a
            href={`mailto:${ORG.email}?subject=TEDxNewy%20partnership%20enquiry`}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f5ec]"
          >
            Request the 2026 partner pack
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </a>
        </div>
      </section>
    </>
  );
}
