import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import FormField from "@/components/FormField";

export const metadata = {
  title: "Partner with us · TEDxNewy",
  description:
    "Back the next thinking from the Hunter. Partner with TEDxNewy across the 2026 season — Salon, signature event, and a year-round YouTube reach.",
};

const tiers = [
  "Presenting partner",
  "Platinum",
  "Gold",
  "Community",
  "Not sure yet — talk me through it",
];

export default function PartnerPage() {
  return (
    <>
      <PageHero
        kicker="Partner with us"
        titleTop="Back the next thinking"
        titleBottom="from the Hunter."
        accent="red"
        intro={
          <>
            TEDxNewy is volunteer-run and not-for-profit. Every partner dollar
            goes into the speakers, the stage and the next generation of
            Novocastrian storytellers. Tell us a little about your team — we&rsquo;ll
            come back with a tailored pack.
          </>
        }
      />

      {/* What partnering looks like */}
      <section className="mx-auto max-w-[680px] px-5 pb-16 md:px-6 md:pb-20">
        <p className="text-[17px] leading-[1.7] text-[#2a2521] md:text-[18px]">
          The 2026 season runs four events with an audience that spans rooms in
          Newcastle and a YouTube reach across the global TEDx network.
          Packages range from a single Salon presence to multi-event naming
          rights, with bespoke activations for partners whose work aligns with
          a specific talk theme.
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
            Start the conversation.
          </h2>
          <p className="mt-4 max-w-[60ch] text-[15.5px] leading-[1.6] text-[#2a2521]">
            A few minutes — we&rsquo;ll be back within a week with the 2026
            partner pack and a time to chat.
          </p>

          <form
            action="/api/partner"
            method="post"
            className="mt-10 grid gap-5 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <FormField
                label="Organisation"
                name="organisation"
                required
                placeholder="Company, foundation, or community group"
              />
            </div>
            <FormField label="Your name" name="contactName" required />
            <FormField
              label="Your role"
              name="role"
              hint="Optional"
              placeholder="e.g. Marketing Lead, Founder"
            />
            <FormField label="Email" name="email" type="email" required />
            <FormField label="Phone" name="phone" type="tel" hint="Optional" />
            <div className="md:col-span-2">
              <FormField
                label="Tier you&rsquo;re considering"
                name="tier"
                select
                options={tiers}
              />
            </div>
            <div className="md:col-span-2">
              <FormField
                label="A short note"
                name="message"
                textarea
                required
                rows={5}
                placeholder="What draws you to TEDxNewy? Any goals, audiences, or themes you&rsquo;d like the partnership to lean into."
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f5ec]"
              >
                Send enquiry
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
