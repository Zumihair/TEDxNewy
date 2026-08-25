export interface NodeNetworkProps {
  /** light = white lines for dark backgrounds · dark = ink lines for cream. */
  variant?: "light" | "dark";
  opacity?: number;
  style?: React.CSSProperties;
}

export declare function NodeNetwork(props: NodeNetworkProps): JSX.Element;
