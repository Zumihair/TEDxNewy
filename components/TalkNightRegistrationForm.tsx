import { ArrowUpRight } from "lucide-react";
import FormField from "@/components/FormField";

export default function TalkNightRegistrationForm({
  errored,
}: {
  /** Show an error banner when the API redirected back with ?status=error. */
  errored?: boolean;
}) {
  return (
    <form
      action="/api/talk-night"
      method="post"
      className="mt-10 space-y-5"
      id="register-form"
    >
      {errored && (
        <div
          role="alert"
          className="rounded-2xl border border-[#e02214]/30 bg-[#e02214]/10 px-5 py-4 text-[13.5px] font-medium text-[#b91404]"
        >
          Something didn&rsquo;t come through. Please check the required fields
          and try again. If the problem persists, email{" "}
          <a
            href="mailto:hello@tedxnewy.com.au"
            className="underline underline-offset-2 hover:text-[#e02214]"
          >
            hello@tedxnewy.com.au
          </a>
          .
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Full name" name="fullName" required />
        <FormField label="Email" name="email" type="email" required />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          label="Phone"
          name="phone"
          type="tel"
          hint="optional"
          placeholder="So we can reach you quickly"
        />
        <FormField
          label="I'd like to"
          name="attendanceType"
          required
          select
          options={["Speak", "Attend", "Both"]}
        />
      </div>

      <FormField
        label="Your idea in a sentence"
        name="idea"
        textarea
        rows={3}
        hint="if speaking"
        placeholder="The one idea, insight, story, challenge or perspective you'd share in 60 seconds."
      />

      <FormField
        label="Anything else we should know?"
        name="comments"
        textarea
        rows={3}
        placeholder="Access needs, questions, or anything that helps us plan the night."
      />

      <fieldset className="space-y-3 rounded-2xl border border-[rgba(97,74,68,0.13)] bg-white px-5 py-4">
        <legend className="sr-only">Consent</legend>
        <label className="flex gap-3">
          <input
            type="checkbox"
            name="marketingConsent"
            className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer accent-[#e02214]"
          />
          <span className="text-[14px] leading-[1.5] text-[#1a1513]">
            Please keep me informed about future TEDxNewy events.{" "}
            <span className="text-[#6b6459]">(optional)</span>
          </span>
        </label>
      </fieldset>

      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f5ec]"
      >
        Submit expression of interest
        <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
      </button>
    </form>
  );
}
