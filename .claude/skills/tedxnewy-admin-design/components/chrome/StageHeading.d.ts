export type DraftStage = "early" | "polish" | "ready";

export interface StageHeadingProps {
  /** Rendered in STAGE_ORDER: ready, polish, early. */
  stage?: DraftStage;
  /** Rows under this heading. */
  count?: number;
  /** Override the default wording ("Early draft" / "Needs polish" / "Ready to schedule"). */
  label?: string;
}

/** Grouping heading for a stage-grouped draft list. Stage is CHOSEN by a human; status is derived. Never collapse the two. */
export declare function StageHeading(props: StageHeadingProps): JSX.Element;
