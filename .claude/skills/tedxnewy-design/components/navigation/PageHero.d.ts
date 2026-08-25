/**
 * Cream page hero for inner pages.
 * @startingPoint section="Navigation" subtitle="Cream inner-page hero" viewport="1280x420"
 */
export interface PageHeroProps {
  /** Small red uppercase eyebrow. */
  kicker?: string;
  title: string;
  intro?: React.ReactNode;
  body?: React.ReactNode;
  /** Buttons or meta row under the copy. */
  meta?: React.ReactNode;
}

export declare function PageHero(props: PageHeroProps): JSX.Element;
