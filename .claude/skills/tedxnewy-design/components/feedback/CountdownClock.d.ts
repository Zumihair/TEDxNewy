export interface CountdownClockProps {
  /** ISO string with an explicit offset (Sydney is +10 AEST / +11 AEDT). */
  target?: string;
  /** Kicker above the cells. */
  label?: string;
}

export declare function CountdownClock(props: CountdownClockProps): JSX.Element;
