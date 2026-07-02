"use client";

import { useState } from "react";
import { ArrowUpRight, Plus, X } from "lucide-react";
import SubmitLockForm from "@/components/SubmitLockForm";

type Choice = "speak" | "listen" | "";

/**
 * EOI form for the 60-Second Talk Night. Client-side so the follow-up
 * question swaps with the speak/listen choice, and the optional +1 guest
 * block mirrors the registrant's fields. Still a plain POST to
 * /api/talk-night — hidden fields simply don't render, so they don't submit.
 */
export default function TalkNightRegistrationForm({
  errored,
}: {
  errored?: boolean;
}) {
  const [choice, setChoice] = useState<Choice>("");
  const [guest, setGuest] = useState(false);
  const [guestChoice, setGuestChoice] = useState<Choice>("");

  return (
    <SubmitLockForm
      action="/api/talk-night"
      method="post"
      className="mt-10 space-y-6"
    >
      {errored && (
        <div
          role="alert"
          className="rounded-2xl border border-[#ff9b8f]/40 bg-[#ff3626]/10 px-5 py-4 text-[13.5px] font-medium text-[#ff9b8f]"
        >
          Something didn&rsquo;t come through. Please check the required fields
          and try again. If it keeps happening, email{" "}
          <a
            href="mailto:hello@tedxnewy.com.au"
            className="underline underline-offset-2 hover:text-white"
          >
            hello@tedxnewy.com.au
          </a>
          .
        </div>
      )}

      {/* You */}
      <div className="grid gap-5 md:grid-cols-2">
        <DarkField label="Full name" name="fullName" required />
        <DarkField label="Email" name="email" type="email" required />
      </div>
      <DarkField
        label="Phone"
        name="phone"
        type="tel"
        hint="optional"
        placeholder="So we can reach you quickly"
      />

      <ChoiceField
        label="I'd like to"
        name="attendanceType"
        value={choice}
        onChange={setChoice}
      />

      {choice === "speak" && (
        <DarkField
          label="Your idea in a sentence"
          name="idea"
          textarea
          rows={3}
          required
          placeholder="The one idea, insight, story, challenge or perspective you'd share in 60 seconds."
        />
      )}
      {choice === "listen" && (
        <DarkField
          label="Why would you like to come?"
          name="reason"
          textarea
          rows={3}
          required
          placeholder="Tell us what draws you to the night. It's an intimate room, so a sentence helps."
        />
      )}

      {/* Bring a guest */}
      <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        {!guest ? (
          <button
            type="button"
            onClick={() => setGuest(true)}
            className="inline-flex items-center gap-2 text-[14.5px] font-medium text-[#ff9b8f] transition-colors hover:text-white"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            Bring a guest?
          </button>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
                style={{ letterSpacing: "0.22em" }}
              >
                Your guest
              </div>
              <button
                type="button"
                onClick={() => {
                  setGuest(false);
                  setGuestChoice("");
                }}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/55 transition-colors hover:text-white"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                Remove
              </button>
            </div>
            <p className="text-[13.5px] leading-[1.55] text-white/55">
              You can bring one guest. Tell us a little about them too, since
              spots are limited.
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              <DarkField label="Guest name" name="guestName" required />
              <DarkField
                label="Guest email"
                name="guestEmail"
                type="email"
                hint="optional"
              />
            </div>
            <ChoiceField
              label="Your guest would like to"
              name="guestAttendanceType"
              value={guestChoice}
              onChange={setGuestChoice}
            />
            {guestChoice === "speak" && (
              <DarkField
                label="Their idea in a sentence"
                name="guestIdea"
                textarea
                rows={3}
                required
                placeholder="The idea your guest would share in 60 seconds."
              />
            )}
            {guestChoice === "listen" && (
              <DarkField
                label="Why would they like to come?"
                name="guestReason"
                textarea
                rows={3}
                required
                placeholder="A sentence on what draws your guest to the night."
              />
            )}
          </div>
        )}
      </div>

      <label className="flex gap-3 rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-4">
        <input
          type="checkbox"
          name="marketingConsent"
          className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer accent-[#e02214]"
        />
        <span className="text-[14px] leading-[1.5] text-white/80">
          Please keep me informed about future TEDxNewy events.{" "}
          <span className="text-white/45">(optional)</span>
        </span>
      </label>

      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2a0604]"
      >
        Register now
        <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
      </button>
    </SubmitLockForm>
  );
}

// --- Dark-themed field bits (the shared FormField is light-only) ---------

const darkInputCls =
  "mt-2.5 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-4 text-[15px] font-medium text-white transition placeholder:text-white/35 focus:border-[#ff9b8f]/50 focus:outline-none focus:ring-[3px] focus:ring-[#e02214]/25";

function DarkField(
  props: {
    label: string;
    name: string;
    required?: boolean;
    hint?: string;
    placeholder?: string;
  } & (
    | { textarea?: false; type?: "text" | "email" | "tel" }
    | { textarea: true; rows?: number }
  ),
) {
  const { label, name, required, hint, placeholder } = props;
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="font-sans text-[13.5px] font-bold text-white">
          {label}
          {required && <span className="ml-1 text-[#ff9b8f]">*</span>}
        </span>
        {hint && (
          <span
            className="font-mono text-[10px] font-semibold uppercase text-white/40"
            style={{ letterSpacing: "0.14em" }}
          >
            {hint}
          </span>
        )}
      </span>
      {props.textarea ? (
        <textarea
          name={name}
          required={required}
          rows={props.rows ?? 3}
          placeholder={placeholder}
          className={darkInputCls}
        />
      ) : (
        <input
          name={name}
          type={props.type ?? "text"}
          required={required}
          placeholder={placeholder}
          className={darkInputCls}
        />
      )}
    </label>
  );
}

function ChoiceField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: Choice;
  onChange: (c: Choice) => void;
}) {
  const options: Array<{ value: Exclude<Choice, "">; label: string; sub: string }> = [
    { value: "speak", label: "Speak", sub: "Share a 60-second idea" },
    { value: "listen", label: "Listen", sub: "Come along for the night" },
  ];
  return (
    <fieldset>
      <legend className="font-sans text-[13.5px] font-bold text-white">
        {label}
        <span className="ml-1 text-[#ff9b8f]">*</span>
      </legend>
      <div className="mt-2.5 grid grid-cols-2 gap-3">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <label
              key={o.value}
              className={`flex cursor-pointer flex-col rounded-2xl border px-5 py-4 transition-all ${
                active
                  ? "border-[#e02214] bg-[#e02214]/15"
                  : "border-white/12 bg-white/[0.04] hover:border-white/25"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                required
                checked={active}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <span className="text-[15.5px] font-semibold text-white">
                {o.label}
              </span>
              <span className="mt-0.5 text-[12.5px] text-white/55">{o.sub}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
