import { ArrowUpRight } from "lucide-react";
import FormField from "@/components/FormField";

export default function YouthFuturesRegistrationForm({
  errored,
}: {
  /** Show an error banner when the API redirected back with ?status=error. */
  errored?: boolean;
}) {
  return (
    <form
      action="/api/youth-futures"
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
            href="mailto:activations@tedxnewy.com.au"
            className="underline underline-offset-2 hover:text-[#e02214]"
          >
            activations@tedxnewy.com.au
          </a>
          .
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="School name" name="schoolName" required />
        <FormField label="Suburb / City" name="suburb" required />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Contact person" name="contactName" required />
        <FormField
          label="Role"
          name="contactRole"
          required
          placeholder="e.g. Head of Year 11, Deputy Principal"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Email" name="email" type="email" required />
        <FormField label="Phone" name="phone" type="tel" required />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          label="Estimated student numbers"
          name="studentCount"
          required
          hint="3–10 recommended"
          placeholder="e.g. 6"
        />
        <FormField
          label="Approx year levels"
          name="yearLevels"
          required
          placeholder="e.g. Year 10–11"
        />
      </div>

      <FormField
        label="Anything we should know?"
        name="comments"
        textarea
        rows={4}
        placeholder="Special requirements, questions, access needs, or context about your students."
      />

      {/* Checkboxes — inline pattern, matching the form's neutral palette. */}
      <fieldset className="space-y-3 rounded-2xl border border-[rgba(97,74,68,0.13)] bg-white px-5 py-4">
        <legend className="sr-only">Consent</legend>
        <label className="flex gap-3">
          <input
            type="checkbox"
            name="marketingConsent"
            className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer accent-[#e02214]"
          />
          <span className="text-[14px] leading-[1.5] text-[#1a1513]">
            Please keep me informed about future TEDxNewy education programs and
            events.{" "}
            <span className="text-[#6b6459]">(optional)</span>
          </span>
        </label>
        <label className="flex gap-3">
          <input
            type="checkbox"
            name="schoolAuthorised"
            required
            className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer accent-[#e02214]"
          />
          <span className="text-[14px] leading-[1.5] text-[#1a1513]">
            I confirm I have authorisation from my school to submit this
            registration.{" "}
            <span className="text-[#e62b1e]">*</span>
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
