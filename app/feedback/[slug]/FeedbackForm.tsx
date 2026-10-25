"use client";

import SubmitLockForm from "@/components/SubmitLockForm";

const RATINGS = [1, 2, 3, 4, 5];
// Five bubbles, stored as these words (the same words the older dropdown saved).
const LIKELIHOODS = ["Very unlikely", "Unlikely", "Maybe", "Likely", "Very likely"];

const fieldLabel = "block font-sans text-[15px] font-medium text-[#000000]";
const textareaCls =
  "mt-2 w-full rounded-2xl border border-[rgba(0,0,0,0.14)] bg-white px-4 py-3 text-[15.5px] text-[#1a1513] placeholder:text-[#8a7e74]/60 focus:outline-none focus:ring-[3px] focus:ring-[#e62b1e]/25";

function YesNo({ name, question }: { name: string; question: string }) {
  return (
    <fieldset>
      <legend className={fieldLabel}>{question}</legend>
      <div className="mt-3 flex gap-3">
        {["Yes", "No"].map((opt) => (
          <label key={opt} className="flex-1 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={opt.toLowerCase()}
              className="peer sr-only"
            />
            <span className="flex items-center justify-center rounded-full border border-[rgba(0,0,0,0.16)] bg-white px-6 py-3 text-[15px] font-medium text-[#000000] transition-colors peer-checked:border-[#e62b1e] peer-checked:bg-[#e62b1e] peer-checked:text-white peer-focus-visible:ring-[3px] peer-focus-visible:ring-[#e62b1e]/30">
              {opt}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function FeedbackForm({
  token,
  slug,
}: {
  token: string;
  slug: string;
}) {
  return (
    <SubmitLockForm
      action="/api/event-feedback"
      method="post"
      className="mt-10 space-y-8"
    >
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="slug" value={slug} />

      <YesNo name="metSomeone" question="Did you meet someone new?" />
      <YesNo
        name="newIdeas"
        question="Did you hear new ideas that changed how you think, or reframed something existing?"
      />

      {/* Overall rating */}
      <fieldset>
        <legend className={fieldLabel}>Overall, how was your experience?</legend>
        <div className="mt-3">
          <div className="flex justify-between">
            {RATINGS.map((n) => (
              <label key={n} className="cursor-pointer">
                <input
                  type="radio"
                  name="overallRating"
                  value={n}
                  required
                  className="peer sr-only"
                />
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(0,0,0,0.16)] bg-white text-[16px] font-medium text-[#000000] transition-colors peer-checked:border-[#e62b1e] peer-checked:bg-[#e62b1e] peer-checked:text-white peer-focus-visible:ring-[3px] peer-focus-visible:ring-[#e62b1e]/30">
                  {n}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[12px] text-[#8a7e74]">
            <span>Not great</span>
            <span>Loved it</span>
          </div>
        </div>
      </fieldset>

      <div>
        <label htmlFor="highlight" className={fieldLabel}>
          What was something you took away from the event?
        </label>
        <textarea
          id="highlight"
          name="highlight"
          rows={3}
          placeholder="A talk, a moment, a conversation…"
          className={textareaCls}
        />
      </div>

      <div>
        <label htmlFor="improve" className={fieldLabel}>
          What would make the next one better?
        </label>
        <textarea
          id="improve"
          name="improve"
          rows={3}
          placeholder="Think about the curation, the activations, the space and the flow of the day. Be honest, we can take it."
          className={textareaCls}
        />
      </div>

      <fieldset>
        <legend className={fieldLabel}>
          How likely are you to come to another TEDxNewy event?
        </legend>
        <div className="mt-3">
          <div className="flex justify-between">
            {LIKELIHOODS.map((l, i) => (
              <label key={l} className="cursor-pointer" title={l}>
                <input
                  type="radio"
                  name="returnLikelihood"
                  value={l}
                  aria-label={l}
                  className="peer sr-only"
                />
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(0,0,0,0.16)] bg-white text-[16px] font-medium text-[#000000] transition-colors peer-checked:border-[#e62b1e] peer-checked:bg-[#e62b1e] peer-checked:text-white peer-focus-visible:ring-[3px] peer-focus-visible:ring-[#e62b1e]/30">
                  {i + 1}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[12px] text-[#8a7e74]">
            <span>Very unlikely</span>
            <span>Very likely</span>
          </div>
        </div>
      </fieldset>

      {slug === "signal-2026" && (
        <>
          <YesNo
            name="engagedPartners"
            question="Did you visit or chat with any of the activating partners in the foyer?"
          />
          <YesNo
            name="partnersAddedValue"
            question="If you did, did they add value to your experience?"
          />
        </>
      )}

      <div>
        <label htmlFor="testimonial" className={fieldLabel}>
          Could we share a short quote from you about the event?{" "}
          <span className="font-normal text-[#8a7e74]">(optional)</span>
        </label>
        <textarea
          id="testimonial"
          name="testimonial"
          rows={3}
          placeholder="Something we could use on our site or socials."
          className={textareaCls}
        />
        <p className="mt-2 text-[13px] leading-[1.5] text-[#8a7e74]">
          If you fill this in, we may share it with your first name. Leave it
          blank if you&rsquo;d rather we didn&rsquo;t.
        </p>
      </div>

      <button
        type="submit"
        className="btn-red"
      >
        Send feedback
      </button>
    </SubmitLockForm>
  );
}
