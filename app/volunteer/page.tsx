import { ArrowUpRight } from "lucide-react";
import ParticipateHero from "@/components/ParticipateHero";
import FormField from "@/components/FormField";
import SubmitLockForm from "@/components/SubmitLockForm";

export const metadata = {
  alternates: { canonical: "/volunteer" },
  title: "Volunteer with us · TEDxNewy",
  description:
    "TEDxNewy is entirely volunteer-run. Tell us how much time you can give and where you're based, and join the crew behind the 2026 season.",
};

const availability = [
  "A one-off event day",
  "A few hours a month",
  "A few hours a week",
  "As much as it takes",
  "Not sure yet, happy to chat",
];

export default function ApplyPage() {
  return (
    <>
      <ParticipateHero
        title="Volunteer with us."
        image="/images/participate/volunteers.webp"
        imageAlt="Two TEDxNewy volunteers smiling at Reframe, our 2025 flagship"
        position="center 18%"
        intro={
          <>
            TEDxNewy is run entirely by volunteers. You don&rsquo;t need
            experience, just reliability, curiosity and a little time across
            the season. Tell us how much you can give and we&rsquo;ll find the
            right fit.
          </>
        }
      />

      {/* Form */}
      <section className="bg-white">
        <div className="mx-auto max-w-[800px] px-5 py-20 md:px-6 md:py-24">
          <h2
            className="font-sans tracking-[-0.025em] text-[#000000] balance"
            style={{
              fontSize: "clamp(1.65rem, 3vw, 2.25rem)",
              lineHeight: 1.1,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Tell us you&rsquo;re in.
          </h2>
          <p className="mt-4 text-[15.5px] leading-[1.6] text-[#2a2521]">
            A few minutes, that&rsquo;s all.
          </p>

          <SubmitLockForm action="/api/volunteer" method="post" className="mt-10 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="First name" name="firstName" required />
              <FormField label="Last name" name="lastName" required />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Email" name="email" type="email" required />
              <FormField label="Phone" name="phone" type="tel" hint="Optional" />
            </div>
            <FormField
              label="Where are you based?"
              name="location"
              hint="Optional"
              placeholder="Suburb or town, e.g. Newcastle, Lambton, the Hunter"
            />
            <FormField
              label="How much time can you give?"
              name="availability"
              select
              required
              options={availability}
            />
            <FormField
              label="A short note"
              name="note"
              textarea
              rows={5}
              placeholder="What draws you to TEDxNewy? Anything you'd love to help with, or any relevant experience we should know about."
            />
            <button
              type="submit"
              className="btn-red"
            >
              Submit application
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </SubmitLockForm>
        </div>
      </section>
    </>
  );
}
