// Tick the grants a letter or file is used for. Plain form markup, no hooks, so
// both client forms can render it. Submits as repeated `grant_id` values.
import { STAGE_LABEL, asStage } from "../shared";
import { isOpenStage, type GrantOption } from "./shared";

export default function GrantPicker({
  grants,
  linked,
  label = "Used in these grants",
}: {
  grants: GrantOption[];
  linked: string[];
  label?: string;
}) {
  // Open grants first: those are the ones that need it now.
  const sorted = [...grants].sort(
    (a, b) => Number(isOpenStage(b.stage)) - Number(isOpenStage(a.stage)) || a.name.localeCompare(b.name),
  );
  return (
    <fieldset className="tx-field adm-lib__picker">
      <legend className="tx-field__label">{label}</legend>
      {sorted.length === 0 ? (
        <span className="adm-card__text">No grants yet. Add one on the board first.</span>
      ) : (
        <div className="adm-lib__picklist">
          {sorted.map((g) => (
            <label key={g.id} className="adm-lib__pick">
              <input type="checkbox" name="grant_id" value={g.id} defaultChecked={linked.includes(g.id)} />
              <span>
                {g.name}
                <span className="adm-lib__pickmeta">{STAGE_LABEL[asStage(g.stage)]}</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}
