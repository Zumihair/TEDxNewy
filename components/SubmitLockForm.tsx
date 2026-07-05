"use client";

import { useEffect, useRef, type FormHTMLAttributes } from "react";

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
 * It also injects two invisible bot traps that every wrapped form gets for
 * free: a "website" honeypot (off-screen, real people never fill it) and a
 * "t" timestamp stamped on mount. The server (lib/anti-spam) drops any submit
 * that fills the honeypot or arrives implausibly fast. See lib/anti-spam.
 *
 * JS-only: with scripting off the form still submits normally, just without
 * the guard (and without a timestamp, which the server tolerates). That's an
 * acceptable trade for an occasional double-click.
 */
export default function SubmitLockForm({
  children,
  ...props
}: FormHTMLAttributes<HTMLFormElement>) {
  const locked = useRef(false);
  const tsRef = useRef<HTMLInputElement>(null);
  const mountedAt = useRef<number | null>(null);

  // Record when the form became interactive. We only ever compare this to a
  // later reading from the same clock (at submit), so the visitor's device
  // clock being wrong can't cause a false rejection.
  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  return (
    <form
      {...props}
      onSubmit={(e) => {
        if (locked.current) {
          e.preventDefault();
          return;
        }
        locked.current = true;
        // Write elapsed ms since mount so the server can spot instant bots.
        // If the mount effect hasn't run yet, leave it blank (server allows).
        if (tsRef.current && mountedAt.current != null) {
          tsRef.current.value = String(Date.now() - mountedAt.current);
        }
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

      {/* Bot traps — invisible to people, rendered last so they don't affect
          form layout (the honeypot is off-screen, the timestamp is hidden). */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        <label>
          Website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </label>
      </div>
      <input ref={tsRef} type="hidden" name="t" defaultValue="" hidden />
    </form>
  );
}
