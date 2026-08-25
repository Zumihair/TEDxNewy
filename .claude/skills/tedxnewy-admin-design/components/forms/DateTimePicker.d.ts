/** The custom date/time picker. Native date inputs are never used in this admin. */
export interface DateTimePickerProps {
  /** `YYYY-MM-DDTHH:mm` with time, `YYYY-MM-DD` without. Always LOCAL wall-clock; empty string for unset. */
  value?: string;
  onChange?: (value: string) => void;
  /** false = date only (closes on pick). */
  withTime?: boolean;
  placeholder?: string;
  id?: string;
  /** Renders a hidden input alongside, for a plain FormData submit. */
  name?: string;
  /** Render the panel open and in flow (for specimen cards). */
  inline?: boolean;
}

export declare function DateTimePicker(props: DateTimePickerProps): JSX.Element;
