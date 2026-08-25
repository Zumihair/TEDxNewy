import type { ReactNode } from "react";

/** Label + control + hint/error. */
export interface FieldProps {
  /** Rendered in the mono caps label style. */
  label: string;
  hint?: string;
  /** Replaces the hint when set. */
  error?: string;
  htmlFor?: string;
  children?: ReactNode;
}

export declare function Field(props: FieldProps): JSX.Element;

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export declare function Input(props: InputProps): JSX.Element;

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export declare function Textarea(props: TextareaProps): JSX.Element;

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: (string | { value: string; label: string })[];
}
export declare function Select(props: SelectProps): JSX.Element;

export interface AdvancedToggleProps {
  label?: string;
  open?: boolean;
  children?: ReactNode;
}

/** Folds rare/advanced options behind a toggle rather than showing them by default. */
export declare function AdvancedToggle(props: AdvancedToggleProps): JSX.Element;
