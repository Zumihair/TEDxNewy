import FormField from "@/components/FormField";
import SubmitLockForm from "@/components/SubmitLockForm";
import { Button } from "@/components/ds";
import type { VolunteerRole } from "@/lib/volunteer-roles";

// No directive on purpose: /volunteer and /volunteer/roles/[slug] are both
// server components and import these.

export const display = { fontVariationSettings: '"opsz" 96' } as const;

/** A word set in a red box, the same treatment as our talk thumbnails. */
export function Hl({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[0.08em] bg-[#e62b1e] px-[0.14em] text-white [-webkit-box-decoration-break:clone] [box-decoration-break:clone]">
      {children}
    </span>
  );
}

const AVAILABILITY = [
  "A one-off event day",
  "A few hours a month",
  "A few hours a week",
  "As much as it takes",
  "Not sure yet, happy to chat",
];

/**
 * The application form (POST /api/volunteer). The role travels as a hidden
 * field, so a role's own page can only apply for that role. A posted role asks
 * its own question in place of the general note.
 */
export function VolunteerForm({ role }: { role: VolunteerRole }) {
  return (
    <SubmitLockForm action="/api/volunteer" method="post" className="space-y-5">
      <input type="hidden" name="role" value={role.slug} />
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
      <fieldset>
        <legend className="font-sans text-[13.5px] font-bold text-[#1a1513]">
          How much time can you give?<span className="ml-1 text-[#e62b1e]">*</span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {AVAILABILITY.map((a, i) => (
            <label key={a} className="cursor-pointer">
              <input type="radio" name="availability" value={a} required={i === 0} className="peer sr-only" />
              <span className="inline-flex h-11 items-center rounded-full border border-black/20 bg-white px-4 text-[14.5px] font-medium text-black transition-colors peer-checked:border-black peer-checked:bg-black peer-checked:text-white peer-focus-visible:ring-[3px] peer-focus-visible:ring-[#e62b1e]/40">
                {a}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {role.general ? (
        <FormField
          label="A short note"
          name="note"
          required
          textarea
          rows={5}
          placeholder="What draws you to TEDxNewy? Anything you'd love to help with, or any relevant experience we should know about."
        />
      ) : (
        <FormField
          label={role.question ?? `Why are you a good fit for ${role.title}?`}
          name="note"
          required
          textarea
          rows={6}
          placeholder="A few sentences is plenty. Mention any experience that fits the role."
        />
      )}
      <Button type="submit" variant="accent" size="lg">
        {role.general ? "Submit application" : "Send application"}
      </Button>
    </SubmitLockForm>
  );
}
