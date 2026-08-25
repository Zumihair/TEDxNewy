export interface CarouselSpeaker {
  name: string;
  title?: string;
  image?: string;
}

export interface SpeakerCarouselProps {
  speakers: CarouselSpeaker[];
  kicker?: string;
  heading?: string;
  onSelect?: (speaker: CarouselSpeaker) => void;
}

export declare function SpeakerCarousel(props: SpeakerCarouselProps): JSX.Element;
