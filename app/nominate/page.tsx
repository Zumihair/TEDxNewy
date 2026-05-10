import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import FormField from "@/components/FormField";

export const metadata = {
  title: "Nominate a speaker · TEDxNewy",
  description:
    "Nominate a Newcastle speaker for an upcoming TEDxNewy event. Open year-round.",
};

export default function NominatePage() {
  return (
    <>
      <PageHero
        kicker="Nominate a speaker"
        titleTop="Know someone who should be heard?"
        intro={
          <>
            Our best talks don&rsquo;t come from LinkedIn bios. They come from
            a neighbour, a colleague, a teacher who flagged someone before
            anyone else did. Nominations are open year-round.
          </>
        }
      />

      {/* How it works — short prose, not a table */}
      <section className="mx-auto max-w-[680px] px-5 pb-16 md:px-6 md:pb-20">
        <p className="text-[17px] leading-[1.7] text-[#2a2521] md:text-[18px]">
          We&rsquo;re looking for a clear, tested idea — not a résumé or a sales
          pitch. Every nomination is read by the curation committee. We reply
          to every submission within six weeks, yes or no, and shortlisted
          speakers are matched to an upcoming event and coached ahead of the
          stage.
        </p>
      </section>

      {/* Form — no kicker, no big competing heading, just the form */}
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
            Tell us about them.
          </h2>
          <p className="mt-4 max-w-[60ch] text-[15.5px] leading-[1.6] text-[#2a2521]">
            A few minutes — that&rsquo;s all. We&rsquo;ll handle the rest.
          </p>

          <form
            action="/api/nominate"
            method="post"
            className="mt-10 grid gap-5 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <FormField
                label="Your name"
                name="nominatorName"
                required
                hint="So we can follow up"
              />
            </div>
            <FormField
              label="Your email"
              name="nominatorEmail"
              type="email"
              required
            />
            <FormField
              label="Your relationship to them"
              name="relationship"
              select
              options={[
                "Colleague",
                "Neighbour or friend",
                "I'm nominating myself",
                "Student or mentee",
                "Other",
              ]}
            />
            <FormField label="Their name" name="nomineeName" required />
            <FormField
              label="What they do"
              name="nomineeTitle"
              required
              placeholder="Role, field, or how you'd describe them"
            />
            <div className="md:col-span-2">
              <FormField
                label="Their idea"
                name="idea"
                textarea
                required
                rows={5}
                hint="Up to 250 words"
                placeholder="What's the one idea this person would take to the stage? What makes it surprising, urgent, or overdue?"
              />
            </div>
            <div className="md:col-span-2">
              <FormField
                label="A link to their work (optional)"
                name="link"
                type="url"
                placeholder="Website, article, talk, LinkedIn…"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f5ec]"
              >
                Submit nomination
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
