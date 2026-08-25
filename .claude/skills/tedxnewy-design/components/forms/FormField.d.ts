export interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  /** Small uppercase note on the right of the label row, e.g. "OPTIONAL". */
  hint?: string;
  type?: "text" | "email" | "tel" | "url";
  placeholder?: string;
  /** Render a textarea instead of an input. */
  textarea?: boolean;
  rows?: number;
  /** Render a select; pass options. */
  select?: boolean;
  options?: string[];
  defaultValue?: string;
  style?: React.CSSProperties;
}

export declare function FormField(props: FormFieldProps): JSX.Element;
