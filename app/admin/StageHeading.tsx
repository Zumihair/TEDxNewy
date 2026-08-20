import {
  stageLabel,
  STAGE_CHIP,
  type DraftStage,
  type StageKind,
} from "./stages";

/**
 * Group heading for a stage-grouped draft list (socials, newsletter
 * campaigns): the stage chip, how many sit under it, then a hairline out to
 * the edge. Deliberately quiet — it separates the list without competing
 * with the rows themselves.
 *
 * No "use client" directive on purpose. It is pure presentation with no
 * state or handlers, so the server socials page and the client
 * CampaignsList can both import it, same reasoning as
 * newsletter/campaigns/shared.ts.
 */
export default function StageHeading({
  stage,
  kind,
  count,
}: {
  stage: DraftStage;
  kind: StageKind;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase ${STAGE_CHIP[stage]}`}
        style={{ letterSpacing: "0.18em" }}
      >
        {stageLabel(stage, kind)}
      </span>
      <span className="text-[12px] tabular-nums text-[#6b6459]">{count}</span>
      <span
        aria-hidden
        className="h-px flex-1 bg-[rgba(20,18,16,0.08)]"
      />
    </div>
  );
}
