export interface SpeakerCardProps {
  name: string;
  /** Role line, e.g. "Olympic boxer, author". */
  title?: string;
  /** 4:5 portrait. */
  image?: string;
  onClick?: () => void;
}

export declare function SpeakerCard(props: SpeakerCardProps): JSX.Element;
