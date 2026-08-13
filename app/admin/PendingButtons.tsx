"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

/**
 * Submit buttons that reflect the enclosing <form action>'s pending state.
 * While the server action runs they disable themselves and swap their icon for
 * a spinner, so a click gives instant feedback and can't double-fire.
 *
 * useFormStatus only works from inside the form, which is why these live in a
 * "use client" module of their own rather than in ui.tsx (which stays
 * server-importable). Class strings are copied verbatim from the matching
 * primitives in ui.tsx so the look is identical.
 */

/** Red pill, matches PrimaryButton. */
export function PendingButton({
  children,
  icon,
  type = "submit",
  name,
  value,
  disabled,
}: {
  children: ReactNode;
  icon?: ReactNode;
  type?: "button" | "submit";
  name?: string;
  value?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type={type}
      name={name}
      value={value}
      disabled={disabled || pending}
      className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-5 py-2.5 text-[13.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

/**
 * Neutral pill, matches SecondaryButton. Pass `className` to override the look
 * for the handful of bespoke pills that share the pattern (e.g. the smaller
 * toggle pills); it defaults to the exact SecondaryButton classes.
 */
export function PendingSecondaryButton({
  children,
  icon,
  type = "submit",
  name,
  value,
  disabled,
  className,
}: {
  children: ReactNode;
  icon?: ReactNode;
  type?: "button" | "submit";
  name?: string;
  value?: string;
  disabled?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type={type}
      name={name}
      value={value}
      disabled={disabled || pending}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-full bg-[rgba(20,18,16,0.06)] px-5 py-2.5 text-[13.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)] disabled:cursor-not-allowed disabled:opacity-70"
      }
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

/** Soft-red pill, matches DangerButton. */
export function PendingDangerButton({
  children,
  icon,
  type = "submit",
  name,
  value,
  disabled,
}: {
  children: ReactNode;
  icon?: ReactNode;
  type?: "button" | "submit";
  name?: string;
  value?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type={type}
      name={name}
      value={value}
      disabled={disabled || pending}
      className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(224,34,20,0.08)] px-3 py-1.5 text-[12.5px] font-medium text-[#b91404] transition-colors hover:bg-[rgba(224,34,20,0.15)] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

/**
 * Round icon-only submit, matching the reorder controls. `children` is the
 * icon; it becomes a spinner while pending.
 */
export function PendingIconButton({
  children,
  ariaLabel,
  title,
  disabled,
  tone = "neutral",
}: {
  children: ReactNode;
  ariaLabel?: string;
  title?: string;
  disabled?: boolean;
  /** "danger" turns the hover state red, for destructive row actions. */
  tone?: "neutral" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-label={ariaLabel}
      title={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6b6459] transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        tone === "danger"
          ? "hover:bg-[rgba(224,34,20,0.10)] hover:text-[#b91404]"
          : "hover:bg-[rgba(20,18,16,0.08)] hover:text-[#141210]"
      }`}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
      ) : (
        children
      )}
    </button>
  );
}
