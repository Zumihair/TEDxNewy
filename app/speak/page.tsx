import { ArrowUpRight } from "lucide-react";
import ParticipateHero from "@/components/ParticipateHero";
import FormField from "@/components/FormField";
import SubmitLockForm from "@/components/SubmitLockForm";

export const metadata = {
  alternates: { canonical: "/speak" },
  title: "Nominate a speaker · TEDxNewy",
  description:
    "Nominate a Newcastle speaker for an upcoming TEDxNewy event. Open year-round.",
};

export default async function NominatePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const errored = status === "error";

  return (
    <>
      <ParticipateHero
        kicker="Nominate a speaker"
        title="Know an idea that deserves the stage?"
        image="/images/stage-benjie.jpg"
        imageAlt="A speaker mid-talk on the TEDxNewy stage"
        aspect="portrait"
        intro={
          <>
            TEDxNewy talks are built to spark new ways of thinking. The best of
            them rarely arrive with a polished bio. They come from a neighbour, a
            colleague, or a teacher who noticed something in someone long before
            anyone else did.
          </>
        }
        body={
          <>
            We&rsquo;re looking for one clear, tested idea, not a résumé or a
            sales pitch. We read and review every nomination, though we
            can&rsquo;t promise a reply to each one. Curation has to line up with
            the events coming up on our calendar, so even a great idea might need
            to wait for the right moment. If it fits, we&rsquo;ll be in touch.
          </>
        }
      />

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
            Tell us about them.
          </h2>
          <p className="mt-4 text-[15.5px] leading-[1.6] text-[#2a2521]">
            A few minutes, that&rsquo;s all. We&rsquo;ll handle the rest.
          </p>

          <SubmitLockForm
            action="/api/speak"
            method="post"
            className="mt-10 grid gap-5 md:grid-cols-2"
          >
            {errored && (
              <div
                role="alert"
                className="md:col-span-2 rounded-2xl border border-[#e02214]/30 bg-[#e02214]/10 px-5 py-4 text-[13.5px] font-medium text-[#b91404]"
              >
                Something went wrong and your nomination was not sent. Please
                try again, or email us directly at{" "}
                <a
                  href="mailto:hello@tedxnewy.com.au"
                  className="underline underline-offset-2 hover:text-[#e02214]"
                >
                  hello@tedxnewy.com.au
                </a>
                .
              </div>
            )}
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
                label="Where they're from"
                name="nomineeLocation"
                hint="Optional"
                placeholder="Suburb or town, e.g. Newcastle, Lambton, the Hunter"
              />
            </div>
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
          </SubmitLockForm>
        </div>
      </section>
    </>
  );
}
