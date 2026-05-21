import { ArrowUpRight } from "lucide-react";
import FormField from "@/components/FormField";

export default function StudentSpeakerEntryForm({
  errored,
}: {
  /** Show an error banner when the API redirected back with ?status=error. */
  errored?: boolean;
}) {
  return (
    <form
      action="/api/student-speaker-competition"
      method="post"
      className="mt-10 space-y-5"
      id="submit-form"
    >
      {errored && (
        <div
          role="alert"
          className="rounded-2xl border border-[#e02214]/30 bg-[#e02214]/10 px-5 py-4 text-[13.5px] font-medium text-[#b91404]"
        >
          Something didn&rsquo;t come through. Please check the required fields
          and try again. Your video link needs to be a full https:// URL. If the
          problem persists, email{" "}
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
        <FormField label="Full name" name="fullName" required />
        <FormField label="Email" name="email" type="email" required />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Phone number" name="phone" type="tel" required />
        <FormField label="School" name="school" required />
      </div>

      <div className="grid gap-5 md:grid-cols-[160px_1fr]">
        <FormField
          label="Post code"
          name="postCode"
          required
          placeholder="e.g. 2300"
        />
        <FormField
          label="City / Suburb"
          name="city"
          required
          placeholder="e.g. Newcastle"
        />
      </div>

      <FormField
        label="TEDx Talk title"
        name="talkTitle"
        required
        placeholder="The idea you want to share, in a sentence."
      />

      <FormField
        label="Video link"
        name="videoUrl"
        type="url"
        required
        hint="Public link"
        placeholder="https://youtube.com/... or https://drive.google.com/..."
      />

      <p className="text-[13px] leading-[1.55] text-[#6b6459]">
        Make sure your video is set to public, or to &ldquo;anyone with the link
        can view&rdquo;. YouTube unlisted, Google Drive sharing, Vimeo and
        Dropbox all work.
      </p>

      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f5ec]"
      >
        Submit my entry
        <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
      </button>
    </form>
  );
}
