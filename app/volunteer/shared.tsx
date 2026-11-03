import FormField from "@/components/FormField";
import SubmitLockForm from "@/components/SubmitLockForm";
import { Button } from "@/components/ds";
import type { VolunteerRole } from "@/lib/volunteer-roles";
import { DEFAULT_ROLE_QUESTIONS, type RoleQuestion } from "@/lib/volunteer-questions";

// No directive on purpose: /volunteer and /volunteer/roles/[slug] are both
// server components and import these.

export const display = { fontVariationSettings: '"opsz" 96' } as const;

/**
 * A word set in a red box, the same treatment as our talk thumbnails. The box
 * is a layer behind the text (-z-10), so the line above can overlap it without
 * being painted over. The heading that holds an Hl needs `isolate`.
 */
export function Hl({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block text-white">
      <span aria-hidden className="absolute -inset-x-[0.06em] -inset-y-[0.04em] -z-10 rounded-[0.08em] bg-[#e62b1e]" />
      {children}
    </span>
  );
}

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
 * slug plus a read-only, prefilled "Role" field showing what they chose, and
 * the rest is the role's own questions (DEFAULT_ROLE_QUESTIONS when none set).
 * The Generalist's questions live in code (GENERAL_ROLE).
 */
export function VolunteerForm({
  role,
  onSend,
}: {
  role: VolunteerRole;
  /** When set, the form is sent by this instead of a page-navigating POST (the modal uses it). */
  onSend?: (body: URLSearchParams) => void;
}) {
  const questions = role.questions.length ? role.questions : DEFAULT_ROLE_QUESTIONS;
  return (
    <SubmitLockForm
      action="/api/volunteer"
      method="post"
      className="space-y-5"
      onSubmit={
        onSend
          ? (e) => {
              e.preventDefault();
              onSend(new URLSearchParams(new FormData(e.currentTarget) as unknown as Record<string, string>));
            }
          : undefined
      }
    >
      <input type="hidden" name="role" value={role.slug} />
      <FormField label="Role" name="roleTitle" defaultValue={role.title} readOnly />
      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="First name" name="firstName" required />
        <FormField label="Last name" name="lastName" required />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Email" name="email" type="email" required />
        <FormField label="Phone" name="phone" type="tel" hint="Optional" />
      </div>
      {questions.map((q) => (
        <Question key={q.id} q={q} />
      ))}
      <Button type="submit" variant="accent" size="lg" block>
        Send application
      </Button>
    </SubmitLockForm>
  );
}
