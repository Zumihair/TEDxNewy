import type { ReactNode } from "react";

/** Confirm dialog. EVERY destructive action uses this, never window.confirm. */
export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger = red confirm (deletes); neutral = ink confirm. */
  tone?: "danger" | "neutral";
  onConfirm: () => void;
  onCancel: () => void;
}

export declare function ConfirmDialog(props: ConfirmDialogProps): JSX.Element | null;

export interface PromptDialogProps extends Omit<ConfirmDialogProps, "onConfirm"> {
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
}

/** Single-field prompt, in place of window.prompt. */
export declare function PromptDialog(props: PromptDialogProps): JSX.Element | null;
