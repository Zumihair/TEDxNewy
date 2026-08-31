"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, X, XCircle } from "lucide-react";
import type { ToastTone } from "./flash";

/**
 * Admin toasts: the result of an action, announced from the bottom of the
 * screen instead of pushed into the page as an inline banner.
 *
 * Three tones, and they mean exactly what they say: green it worked, red it
 * did not, yellow it needs attention (a partial result, a warning, a "nothing
 * to do here"). Anything that is NOT the result of an action — "Mailchimp
 * isn't connected", "this needs a database update", a field-level validation
 * message — stays an inline <Flash>, because that copy has to still be on
 * screen while the reader does something about it.
 *
 * Mounted once by AdminShell, so every signed-in admin page has it; /admin/login
 * renders outside the shell and keeps its own inline messages.
 *
 * Two ways in:
 *   - a client component calls useToast().success("Saved.")
 *   - a server page renders <FlashToast tone="success" clear="saved">Saved.
 *     </FlashToast> for a ?saved=1-style redirect (see FlashToast.tsx)
 */

export type { ToastTone };

type ToastInput = {
  tone?: ToastTone;
  message: ReactNode;
  /** Milliseconds on screen. Defaults by tone; 0 pins it until dismissed. */
  duration?: number;
};

type ToastRecord = {
  id: number;
  tone: ToastTone;
  message: ReactNode;
  duration: number;
  leaving: boolean;
};

type ToastApi = {
  show: (t: ToastInput) => number;
  success: (message: ReactNode, duration?: number) => number;
  error: (message: ReactNode, duration?: number) => number;
  warning: (message: ReactNode, duration?: number) => number;
  dismiss: (id: number) => void;
};

/** An error stays put roughly twice as long: it is usually worth reading. */
const DEFAULT_MS: Record<ToastTone, number> = {
  success: 4500,
  warning: 6000,
  error: 9000,
};

/** Beyond this the stack starts covering the page it is reporting on. */
const MAX_VISIBLE = 4;

/** Matches the admin-toast-out keyframes in globals.css. */
const EXIT_MS = 180;

const TONES: Record<
  ToastTone,
  { bg: string; border: string; fg: string; icon: string; Icon: typeof CheckCircle2 }
> = {
  success: {
    bg: "#eef9f1",
    border: "rgba(34,197,94,0.35)",
    fg: "#155724",
    icon: "#22c55e",
    Icon: CheckCircle2,
  },
  error: {
    bg: "#fdeeed",
    border: "rgba(224,34,20,0.35)",
    fg: "#b91404",
    icon: "#e02214",
    Icon: XCircle,
  },
  warning: {
    bg: "#fdf6e7",
    border: "rgba(245,158,11,0.40)",
    fg: "#8a6d00",
    icon: "#f59e0b",
    Icon: AlertTriangle,
  },
};

const ToastContext = createContext<ToastApi | null>(null);

/**
 * Toasts are always available inside the admin shell. Outside it (a component
 * shared with a public page, say) this returns a no-op API rather than
 * throwing, so a shared component can't take a public page down. It complains
 * in development, since the failure mode otherwise is a message that is simply
 * never seen.
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  return ctx ?? NOOP_API;
}

const warnNoProvider = (): number => {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "useToast() was called outside <ToastProvider>; the message was dropped.",
    );
  }
  return -1;
};

const NOOP_API: ToastApi = {
  show: warnNoProvider,
  success: warnNoProvider,
  error: warnNoProvider,
  warning: warnNoProvider,
  dismiss: () => {},
};

/**
 * The standard useActionState form result, announced as one error toast.
 *
 * The record forms (speaker, talk, sponsor, team, event) all return
 * { ok: false, errors: [{ field?, message }] }. Field errors stay inline
 * beside their input, where they belong; this covers the rest: the general
 * ones get their own line, and a purely field-level failure still says
 * something, which the old inline banner did not.
 *
 * `state` identity is the trigger, not the message text, so two identical
 * failed saves in a row both announce themselves.
 */
export function useFormErrorToast(
  state: unknown,
  errors: { field?: string; message: string }[],
) {
  const toast = useToast();
  const last = useRef<unknown>(null);

  useEffect(() => {
    if (last.current === state) return;
    last.current = state;
    if (errors.length === 0) return;
    const general = errors.filter((e) => !e.field).map((e) => e.message);
    toast.error(
      general.length === 0 ? (
        "Not saved. Check the highlighted fields and try again."
      ) : general.length === 1 ? (
        general[0]
      ) : (
        <div className="space-y-1">
          {general.map((m, i) => (
            <div key={i}>{m}</div>
          ))}
        </div>
      ),
    );
    // errors is derived from state; state identity is the real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(1);
  // Exit timers, so a fast unmount can't leave one running.
  const exitTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((list) =>
      list.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
    );
    if (exitTimers.current.has(id)) return;
    exitTimers.current.set(
      id,
      setTimeout(() => {
        exitTimers.current.delete(id);
        setToasts((list) => list.filter((t) => t.id !== id));
      }, EXIT_MS),
    );
  }, []);

  const show = useCallback((input: ToastInput) => {
    const tone = input.tone ?? "success";
    const id = nextId.current++;
    setToasts((list) => {
      const next = [
        ...list,
        {
          id,
          tone,
          message: input.message,
          duration: input.duration ?? DEFAULT_MS[tone],
          leaving: false,
        },
      ];
      // Drop the oldest outright once the stack is full: animating it out
      // would shuffle the whole column while a new one is arriving.
      return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
    });
    return id;
  }, []);

  useEffect(() => {
    const timers = exitTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message, duration) => show({ tone: "success", message, duration }),
      error: (message, duration) => show({ tone: "error", message, duration }),
      warning: (message, duration) => show({ tone: "warning", message, duration }),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/**
 * Portalled to the body and z-[100]: above every other admin layer (the
 * calendar chip popover at 45, the two preview modals at 50 and 70, NoteDialog
 * at 60, DateTimePicker at 80). A toast reports on whatever is on screen, so it
 * has to sit on top of all of it.
 *
 * The column itself takes no pointer events, or it would swallow clicks on the
 * page behind it; each card turns them back on.
 */
function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastRecord[];
  onDismiss: (id: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 px-4 pb-4 sm:pb-6">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: number) => void;
}) {
  const { bg, border, fg, icon, Icon } = TONES[toast.tone];
  const [paused, setPaused] = useState(false);

  // Hovering or focusing holds the toast open: a long error message shouldn't
  // vanish out from under someone who is reading it or reaching for the X.
  useEffect(() => {
    if (toast.duration <= 0 || paused || toast.leaving) return;
    const t = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(t);
  }, [toast.duration, toast.id, toast.leaving, paused, onDismiss]);

  return (
    <div
      className="admin-toast pointer-events-auto flex w-full max-w-[440px] items-start gap-2.5 rounded-[var(--radius-md)] border px-4 py-3 shadow-[0_10px_30px_rgba(20,18,16,0.10)]"
      data-leaving={toast.leaving}
      style={{ backgroundColor: bg, borderColor: border, color: fg }}
      role={toast.tone === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Icon
        className="mt-px h-[17px] w-[17px] shrink-0"
        strokeWidth={2}
        style={{ color: icon }}
        aria-hidden
      />
      <div className="min-w-0 flex-1 text-[13.5px] leading-[1.5]">
        {toast.message}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="-mr-1 -mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full opacity-55 transition-opacity hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
