export interface PillProps {
  /** red = brand/urgent · amber = warm notice · coast = Newcastle blue · cream = neutral. */
  tone?: "red" | "amber" | "coast" | "cream";
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export declare function Pill(props: PillProps): JSX.Element;
