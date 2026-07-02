"use client";

import { useRef, type FormHTMLAttributes } from "react";

/**
 * Drop-in replacement for a native <form> that guards against duplicate
 * submissions. On the first submit it locks; any further submit (a
 * double-click, or Enter held down) is ignored, and the form's submit
 * button is disabled + dimmed so it reads as in-flight.
 *
 * We lock on the form's *submit* event, not the button's click. By the time
 * submit fires the browser has already committed to sending the request, so
 * disabling the button here stops a second POST without cancelling the first
 * (disabling in a click handler can cancel the submission — this doesn't).
 *
 * JS-only: with scripting off the form still submits normally, just without
 * the guard. That's an acceptable trade for an occasional double-click.
 */
export default function SubmitLockForm({
  children,
  ...props
}: FormHTMLAttributes<HTMLFormElement>) {
  const locked = useRef(false);

  return (
    <form
      {...props}
      onSubmit={(e) => {
        if (locked.current) {
          e.preventDefault();
          return;
        }
        locked.current = true;
        e.currentTarget
          .querySelectorAll<HTMLButtonElement>(
            'button[type="submit"], button:not([type])',
          )
          .forEach((b) => {
            b.disabled = true;
            b.setAttribute("aria-busy", "true");
            b.style.opacity = "0.7";
            b.style.cursor = "not-allowed";
          });
      }}
    >
      {children}
    </form>
  );
}
