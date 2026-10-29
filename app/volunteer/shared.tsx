import FormField from "@/components/FormField";
import SubmitLockForm from "@/components/SubmitLockForm";
import { Button } from "@/components/ds";
import type { VolunteerRole } from "@/lib/volunteer-roles";
import { DEFAULT_ROLE_QUESTIONS, type RoleQuestion } from "@/lib/volunteer-questions";

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

/** A row of pill radios. `required` sits on the first option, which is enough for the browser. */
function PillChoice({ name, legend, options, required }: { name: string; legend: string; options: string[]; required: boolean }) {
  return (
    <fieldset>
      <legend className="font-sans text-[13.5px] font-bold text-[#1a1513]">
        {legend}
        {required && <span className="ml-1 text-[#e62b1e]">*</span>}
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((a, i) => (
          <label key={a} className="cursor-pointer">
            <input type="radio" name={name} value={a} required={required && i === 0} className="peer sr-only" />
            <span className="inline-flex min-h-11 items-center rounded-full border border-black/20 bg-white px-4 py-2 text-[14.5px] font-medium leading-tight text-black transition-colors peer-checked:border-black peer-checked:bg-black peer-checked:text-white peer-focus-visible:ring-[3px] peer-focus-visible:ring-[#e62b1e]/40">
              {a}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Question({ q }: { q: RoleQuestion }) {
  const name = `q_${q.id}`;
  // FormField's hint slot sits beside the label, so it only says "Optional";
  // a question's own hint reads better as the placeholder.
  const hint = q.required ? undefined : "Optional";
  if (q.type === "choice") {
    return <PillChoice name={name} legend={q.label} options={q.options ?? []} required={q.required} />;
  }
  if (q.type === "long") {
    return <FormField label={q.label} name={name} required={q.required} hint={hint} textarea rows={5} placeholder={q.hint} />;
  }
  // A link stays type="text": "url" refuses linkedin.com/in/... typed without https://.
  // The route adds the scheme.
  return (
    <FormField
      label={q.label}
      name={name}
      required={q.required}
      hint={hint}
      placeholder={q.hint ?? (q.type === "link" ? "e.g. linkedin.com/in/yourname" : undefined)}
    />
  );
}

/**
 * The application form (POST /api/volunteer). The role travels as a hidden
 * field, so a role's own page can only apply for that role.
 *
 * The general role keeps the fixed expression-of-interest form (where you are,
 * how much time, a note). A posted role asks only the basics and then its own
 * questions, so each role's form is its own; with none set it asks why they're
 * a good fit (DEFAULT_ROLE_QUESTIONS).
 */
export function VolunteerForm({ role }: { role: VolunteerRole }) {
  const questions = role.questions.length ? role.questions : DEFAULT_ROLE_QUESTIONS;
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
      {role.general ? (
        <>
          <FormField
            label="Where are you based?"
            name="location"
            hint="Optional"
            placeholder="Suburb or town, e.g. Newcastle, Lambton, the Hunter"
          />
          <PillChoice name="availability" legend="How much time can you give?" options={AVAILABILITY} required />
          <FormField
            label="A short note"
            name="note"
            required
            textarea
            rows={5}
            placeholder="What draws you to TEDxNewy? Anything you'd love to help with, or any relevant experience we should know about."
          />
        </>
      ) : (
        questions.map((q) => <Question key={q.id} q={q} />)
      )}
      <Button type="submit" variant="accent" size="lg">
        {role.general ? "Submit application" : "Send application"}
      </Button>
    </SubmitLockForm>
  );
}
