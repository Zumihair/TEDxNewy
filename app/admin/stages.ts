/**
 * Draft stage: the editorial read on a piece of content, shared by
 * /admin/socials and /admin/newsletter/campaigns.
 *
 * Deliberately separate from the lifecycle status. Status (draft /
 * scheduled / posted or sent) is DERIVED from the dates, so nothing has to
 * be told it is scheduled: a social post with a planned date is scheduled,
 * a newsletter with a schedule set is scheduled. Stage is the part a human
 * actually has to judge, and the only one worth a picker.
 *
 * Data-only, no JSX, so both server pages and client editors can import it.
 * Column: `stage` on social_posts and newsletters (migration
 * 20260814_draft_stages.sql).
 */

export type DraftStage = "early" | "polish" | "ready";

export type StageKind = "social" | "newsletter";

export type StageDef = { id: DraftStage; label: string; blurb: string };

/** The three stages, with the wording each surface uses for "ready". */
export function draftStages(kind: StageKind): StageDef[] {
  return [
    {
      id: "early",
      label: "Early draft",
      blurb: "Just started. Rough copy, nothing final.",
    },
    {
      id: "polish",
      label: "Needs polish",
      blurb: "Nearly there. The copy or the artwork needs another pass.",
    },
    {
      id: "ready",
      label: kind === "newsletter" ? "Ready to schedule" : "Ready",
      blurb:
        kind === "newsletter"
          ? "Signed off. Put a date on it and it schedules itself."
          : "Signed off and good to go out.",
    },
  ];
}

export function stageLabel(stage: string, kind: StageKind): string {
  return draftStages(kind).find((s) => s.id === stage)?.label ?? "Early draft";
}

/** Normalise whatever came back from the database. Anything unknown (or a
 *  row from before the migration, where the column is absent) reads as
 *  "early", so the UI never shows a blank stage. */
export function asStage(value: unknown): DraftStage {
  return value === "polish" || value === "ready" ? value : "early";
}

/** Chip classes per stage, matching the admin chrome. */
export const STAGE_CHIP: Record<DraftStage, string> = {
  early: "bg-[rgba(20,18,16,0.06)] text-[#6b6459]",
  polish: "bg-[#f59e0b]/15 text-[#a16207]",
  ready: "bg-[#22c55e]/15 text-[#15803d]",
};
