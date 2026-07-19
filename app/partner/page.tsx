import { ArrowUpRight } from "lucide-react";
import ParticipateHero from "@/components/ParticipateHero";
import FormField from "@/components/FormField";
import SubmitLockForm from "@/components/SubmitLockForm";

export const metadata = {
  alternates: { canonical: "/partner" },
  title: "Partner with us · TEDxNewy",
  description:
    "Back the next thinking from the Hunter. Partner with TEDxNewy across the 2026 season: four events, a curious in-person audience, and a year-round YouTube reach.",
};

export default async function PartnerPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const errored = status === "error";

  return (
    <>
      <ParticipateHero
        kicker="Partner with us"
        title="Back the next thinking from the Hunter."
        image="/images/participate/partners.webp"
        imageAlt="TEDxNewy organisers and partners collaborating at Reframe, 2025"
        aspect="landscape"
        intro={
          <>
            TEDxNewy is volunteer-run and not-for-profit. Every partner dollar
            goes back into the room: the curious, ambitious Novocastrians who
            gather around each event.
          </>
        }
        body={
          <>
            The 2026 season runs four events with an audience that spans rooms
            across Newcastle and a YouTube reach on the global TEDx network.
            Tell us a little about your team and we&rsquo;ll come back with a
            tailored pack.
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
            Start the conversation.
          </h2>
          <p className="mt-4 text-[15.5px] leading-[1.6] text-[#2a2521]">
            A few minutes, and we&rsquo;ll be back within a week with the 2026
            partner pack and a time to chat.
          </p>

          <SubmitLockForm
            action="/api/partner"
            method="post"
            className="mt-10 grid gap-5 md:grid-cols-2"
          >
            {errored && (
              <div
                role="alert"
                className="md:col-span-2 rounded-2xl border border-[#e02214]/30 bg-[#e02214]/10 px-5 py-4 text-[13.5px] font-medium text-[#b91404]"
              >
                Something went wrong and your enquiry was not sent. Please try
                again, or email us directly at{" "}
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
                label="A short note"
                name="message"
                textarea
                required
                rows={5}
                placeholder="What draws you to TEDxNewy? Any goals, audiences, or themes you'd like the partnership to lean into."
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
          </SubmitLockForm>
        </div>
      </section>
    </>
  );
}
