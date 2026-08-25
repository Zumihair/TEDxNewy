export interface StatProps {
  /** The figure itself, as a string: "5", "100", "2M". */
  value: string;
  /** Unit or modifier rendered in a knocked-back colour: "%", "+". */
  suffix?: string;
  suffixColor?: string;
  label: React.ReactNode;
  /** Small caps qualifier, e.g. "Since 2024". */
  sub?: string;
  /** light = white text for the red/dark band · dark = ink on cream. */
  tone?: "light" | "dark";
}

export declare function Stat(props: StatProps): JSX.Element;
