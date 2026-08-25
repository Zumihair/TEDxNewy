export interface EditionStampProps {
  /** Circular caption. Keep the trailing " ·" so the loop reads continuously. */
  text?: string;
  size?: number;
  /** light = for dark surfaces · dark = for cream. */
  tone?: "light" | "dark";
  style?: React.CSSProperties;
}

export declare function EditionStamp(props: EditionStampProps): JSX.Element;
