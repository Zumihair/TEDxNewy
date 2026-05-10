import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import FormField from "@/components/FormField";

export const metadata = {
  title: "Join the crew · TEDxNewy",
  description:
    "TEDxNewy is volunteer-run. Six crews, year-round roles. Apply to help run the 2026 season.",
};

const crews = [
  "Stage Crew",
  "Front of House",
  "Speaker Coaching",
  "Design & Content",
  "Tech & Video",
  "Partnerships",
];

export default function ApplyPage() {
  return (
    <>
      <PageHero
        kicker="Join the crew"
        titleTop="It takes a village. Yours, ideally."
        intro={
          <>
            TEDxNewy is entirely volunteer-run. Six crews, year-round roles.
            Most people come back the year after. Some end up running the
            whole thing.
          </>
        }
      />

      {/* How it works — short prose */}
      <section className="mx-auto max-w-[680px] px-5 pb-16 md:px-6 md:pb-20">
        <p className="text-[17px] leading-[1.7] text-[#2a2521] md:text-[18px]">
          You don&rsquo;t need experience. You need reliability, curiosity,
          and a few free evenings or weekends across the season. Crews include
          stage, front of house, speaker coaching, design, tech &amp; video,
          and partnerships. Tell us roughly where you&rsquo;d like to land and
          we&rsquo;ll be in touch within a few weeks.
        </p>
      </section>

      {/* Form */}
      <section className="bg-[#f9f5ec]">
        <div className="mx-auto max-w-[800px] px-5 py-20 md:px-6 md:py-24">
          <h2
            className="font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.65rem, 3vw, 2.25rem)",
              lineHeight: 1.1,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Tell us why you&rsquo;re in.
          </h2>
          <p className="mt-4 max-w-[60ch] text-[15.5px] leading-[1.6] text-[#2a2521]">
            A few minutes — that&rsquo;s all.
          </p>

          <form action="/api/apply" method="post" className="mt-10 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="First name" name="firstName" required />
              <FormField label="Last name" name="lastName" required />
            </div>
            <FormField label="Email" name="email" type="email" required />
            <FormField label="Phone" name="phone" type="tel" hint="Optional" />
            <FormField
              label="Which crew?"
              name="crew"
              select
              required
              options={crews}
            />
            <FormField
              label="A short note"
              name="note"
              textarea
              rows={5}
              placeholder="Why this crew? Any relevant experience, time you can give, or other context we should know."
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f5ec]"
            >
              Submit application
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
