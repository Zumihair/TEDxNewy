export interface SectionKickerProps {
  label: string;
  accent?: "red" | "amber" | "coast" | "white";
  /** True on dark surfaces: the rule and text go white. */
  inverted?: boolean;
  /** Drop the leading rule for the bare uppercase eyebrow used in heroes. */
  showRule?: boolean;
  style?: React.CSSProperties;
}

export declare function SectionKicker(props: SectionKickerProps): JSX.Element;
