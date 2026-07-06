"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/**
 * Accessible confirm / prompt modals that match the admin chrome, used in place
 * of window.confirm / window.prompt (which are ugly, unstyled and blocking).
 *
 * Both portal to document.body so no ancestor's transform / blur can trap the
 * fixed overlay, trap Tab within the dialog, focus the primary control on open,
 * and cancel on Escape or an overlay click.
 *
 * Prefer the useConfirm() hook for call sites: it hands back async confirm() /
 * prompt() helpers plus a `dialogs` node to drop into the render.
 */

type Tone = "danger" | "neutral";

/** Focusable controls inside the dialog, for the Tab trap. */
function focusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("disabled"));
}

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/** Shared modal shell: overlay, white card, Escape + Tab handling. */
function Shell({
  labelledBy,
  onCancel,
  initialFocus,
  children,
}: {
  labelledBy: string;
  onCancel: () => void;
  initialFocus: React.RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initialFocus.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === "Tab") {
        const items = focusable(cardRef.current);
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-[var(--radius-md)] bg-white p-5 shadow-2xl md:p-6"
      >
        {children}
      </div>
    </div>
  );
}

const confirmBtnCls = (tone: Tone) =>
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-medium text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 " +
  (tone === "danger"
    ? "bg-[#e02214] hover:bg-[#b91404]"
    : "bg-[#141210] hover:bg-black");

const cancelBtnCls =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[rgba(20,18,16,0.06)] px-5 py-2.5 text-[13.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]";

function Title({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="font-sans text-[17px] font-semibold tracking-[-0.01em] text-[#141210]"
    >
      {children}
    </h2>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const mounted = useMounted();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  if (!open || !mounted) return null;

  return createPortal(
    <Shell labelledBy={titleId} onCancel={onCancel} initialFocus={confirmRef}>
      <Title id={titleId}>{title}</Title>
      {body && (
        <div className="mt-2 text-[13.5px] leading-[1.6] text-[#6b6459]">
          {body}
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5">
        <button type="button" onClick={onCancel} className={cancelBtnCls}>
          {cancelLabel}
        </button>
        <button
          ref={confirmRef}
          type="button"
          onClick={onConfirm}
          className={confirmBtnCls(tone)}
        >
          {confirmLabel}
        </button>
      </div>
    </Shell>,
    document.body,
  );
}

export function PromptDialog({
  open,
  title,
  body,
  label,
  placeholder,
  defaultValue = "",
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  tone = "neutral",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: ReactNode;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const mounted = useMounted();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const titleId = useId();

  // Reset the field each time the dialog opens.
  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);

  if (!open || !mounted) return null;

  const submit = () => onConfirm(value.trim());

  return createPortal(
    <Shell labelledBy={titleId} onCancel={onCancel} initialFocus={inputRef}>
      <Title id={titleId}>{title}</Title>
      {body && (
        <div className="mt-2 text-[13.5px] leading-[1.6] text-[#6b6459]">
          {body}
        </div>
      )}
      <div className="mt-4">
        {label && (
          <span
            className="block font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
            style={{ letterSpacing: "0.24em" }}
          >
            {label}
          </span>
        )}
        <input
          ref={inputRef}
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          className="mt-2 block w-full rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.15)] bg-white px-4 py-3 text-[14.5px] text-[#141210] focus:border-[#e02214]/40 focus:outline-none focus:ring-2 focus:ring-[#e02214]/20"
        />
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5">
        <button type="button" onClick={onCancel} className={cancelBtnCls}>
          {cancelLabel}
        </button>
        <button type="button" onClick={submit} className={confirmBtnCls(tone)}>
          {confirmLabel}
        </button>
      </div>
    </Shell>,
    document.body,
  );
}

type ConfirmOptions = {
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
};

type PromptOptions = ConfirmOptions & {
  label?: string;
  placeholder?: string;
  defaultValue?: string;
};

/**
 * Imperative confirm / prompt. Returns async helpers plus a `dialogs` node the
 * caller renders once anywhere in its tree:
 *
 *   const { confirm, prompt, dialogs } = useConfirm();
 *   const ok = await confirm({ title: "Delete?", tone: "danger" });
 *   ...
 *   return <>{dialogs}{rest}</>;
 */
export function useConfirm() {
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const [promptState, setPromptState] = useState<PromptOptions | null>(null);
  const confirmResolver = useRef<((v: boolean) => void) | null>(null);
  const promptResolver = useRef<((v: string | null) => void) | null>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        confirmResolver.current = resolve;
        setConfirmState(opts);
      }),
    [],
  );

  const prompt = useCallback(
    (opts: PromptOptions) =>
      new Promise<string | null>((resolve) => {
        promptResolver.current = resolve;
        setPromptState(opts);
      }),
    [],
  );

  const closeConfirm = (result: boolean) => {
    setConfirmState(null);
    confirmResolver.current?.(result);
    confirmResolver.current = null;
  };

  const closePrompt = (result: string | null) => {
    setPromptState(null);
    promptResolver.current?.(result);
    promptResolver.current = null;
  };

  const dialogs = (
    <>
      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title ?? ""}
        body={confirmState?.body}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        tone={confirmState?.tone}
        onConfirm={() => closeConfirm(true)}
        onCancel={() => closeConfirm(false)}
      />
      <PromptDialog
        open={promptState !== null}
        title={promptState?.title ?? ""}
        body={promptState?.body}
        label={promptState?.label}
        placeholder={promptState?.placeholder}
        defaultValue={promptState?.defaultValue}
        confirmLabel={promptState?.confirmLabel}
        cancelLabel={promptState?.cancelLabel}
        tone={promptState?.tone}
        onConfirm={(v) => closePrompt(v)}
        onCancel={() => closePrompt(null)}
      />
    </>
  );

  return { confirm, prompt, dialogs };
}
