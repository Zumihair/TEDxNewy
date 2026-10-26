// The stat row and the four-column board. No directive: the admin page and the
// /dev/admin-preview sample both render it.
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Badge, IconButton } from "../ui";
import { PendingIconButton } from "../PendingButtons";
import { Modal } from "../Modal";
import GrantForm from "./GrantForm";
import { deleteGrant, saveGrant } from "./actions";
import {
  COLUMNS,
  STAGE_LABEL,
  daysBetween,
  money,
  rangeText,
  shortDate,
  type Grant,
  type GrantStage,
} from "./shared";

const TONE: Record<GrantStage, "draft" | "live" | "red" | "neutral" | "soon"> = {
  watching: "soon",
  researching: "neutral",
  drafting: "draft",
  submitted: "draft",
  successful: "live",
  unsuccessful: "neutral",
  not_applying: "neutral",
};

/** Deadline wording for a card, and whether it needs attention now. */
function deadline(g: Grant, today: string): { text: string; urgent: boolean } | null {
  if (!g.closes_on) return g.closes_note ? { text: g.closes_note, urgent: false } : null;
  const at = `${shortDate(g.closes_on)}${g.closes_note ? `, ${g.closes_note}` : ""}`;
  const open = g.stage === "researching" || g.stage === "drafting";
  if (!open) return { text: `Closed ${at}`, urgent: false };
  const days = daysBetween(today, g.closes_on);
  if (days < 0) return { text: `Closed ${at}`, urgent: true };
  const left = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
  return { text: `Closes ${at} (${left})`, urgent: days <= 7 };
}

function sortFor(column: string, rows: Grant[]): Grant[] {
  const byDate = (a: Grant, b: Grant) =>
    (a.closes_on ?? "9999").localeCompare(b.closes_on ?? "9999") || a.name.localeCompare(b.name);
  if (column === "decided") return [...rows].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  if (column === "upcoming") return [...rows].sort((a, b) => a.name.localeCompare(b.name));
  return [...rows].sort(byDate);
}

const daysLeft = (d: number) => (d === 0 ? "Today" : d === 1 ? "1 day" : `${d} days`);

export default function GrantsView({ grants, today }: { grants: Grant[]; today: string }) {
  const isOpen = (g: Grant) => g.stage === "researching" || g.stage === "drafting";
  const openAhead = grants.filter((g) => isOpen(g) && (!g.closes_on || g.closes_on >= today));
  const next = openAhead.filter((g) => g.closes_on).sort((a, b) => a.closes_on!.localeCompare(b.closes_on!))[0];
  const waiting = grants.filter((g) => g.stage === "submitted");
  const won = grants.filter((g) => g.stage === "successful");
  const sum = (rows: Grant[], f: (g: Grant) => number | null) => rows.reduce((a, g) => a + (f(g) ?? 0), 0);
  const waitingSum = sum(waiting, (g) => g.amount_requested);
  const wonSum = sum(won, (g) => g.amount_awarded ?? g.amount_requested);
  const openSum = sum(openAhead, (g) => g.amount_requested ?? g.amount_max);

  return (
    <>
      <section className="adm-statrow" style={{ ["--n" as string]: 4 }}>
        <div className="adm-stat2">
          <span className="adm-stat2__label">Next deadline</span>
          <span className="adm-stat2__value">
            {next ? daysLeft(daysBetween(today, next.closes_on!)) : "None"}
          </span>
          <span className="adm-stat2__foot">{next ? `${next.name}, ${shortDate(next.closes_on!)}` : "No open round with a date"}</span>
        </div>
        <div className="adm-stat2">
          <span className="adm-stat2__label">Open now</span>
          <span className="adm-stat2__value">{openAhead.length}</span>
          <span className="adm-stat2__foot">{openSum > 0 ? `up to ${money(openSum)} on the table` : "rounds we could apply for"}</span>
        </div>
        <div className="adm-stat2">
          <span className="adm-stat2__label">Waiting to hear</span>
          <span className="adm-stat2__value">{money(waitingSum)}</span>
          <span className="adm-stat2__foot">
            {waiting.length} application{waiting.length === 1 ? "" : "s"} submitted
          </span>
        </div>
        <div className="adm-stat2">
          <span className="adm-stat2__label">Won</span>
          <span className="adm-stat2__value">{money(wonSum)}</span>
          <span className="adm-stat2__foot">
            {won.length} successful grant{won.length === 1 ? "" : "s"}
          </span>
        </div>
      </section>

      <div className="adm-grants">
        {COLUMNS.map((col) => {
          const rows = sortFor(
            col.key,
            grants.filter((g) => col.stages.includes(g.stage)),
          );
          return (
            <section key={col.key} className="adm-grants__col" aria-label={col.title}>
              <h2 className="adm-grants__head">
                {col.title}
                <span className="adm-grants__count">{rows.length}</span>
              </h2>
              {rows.length === 0 ? (
                <p className="adm-card__text">{col.empty}</p>
              ) : (
                <ul className="adm-grants__list">
                  {rows.map((g) => {
                    const due = deadline(g, today);
                    const range = rangeText(g.amount_min, g.amount_max);
                    const asked = g.amount_requested ? `Asking ${money(g.amount_requested)}` : null;
                    const got =
                      g.stage === "successful" && g.amount_awarded ? `Awarded ${money(g.amount_awarded)}` : null;
                    return (
                      <li key={g.id} className={"adm-grant" + (due?.urgent ? " is-urgent" : "")}>
                        <div className="adm-grant__top">
                          <Link href={`/admin/grants/${g.id}`} className="adm-grant__name">
                            {g.name}
                          </Link>
                          {col.stages.length > 1 && (
                            <span className="adm-grant__badge">
                              <Badge tone={TONE[g.stage]}>{STAGE_LABEL[g.stage]}</Badge>
                            </span>
                          )}
                        </div>
                        {g.funder && <span className="adm-card__text">{g.funder}</span>}
                        {due && <span className={"adm-grant__due" + (due.urgent ? " is-urgent" : "")}>{due.text}</span>}
                        {(got || asked || range) && (
                          <span className="adm-grant__money">{got ?? asked ?? range}</span>
                        )}
                        {(g.project || g.owner) && (
                          <span className="adm-card__text">
                            {[g.project, g.owner ? `led by ${g.owner}` : null].filter(Boolean).join(" · ")}
                          </span>
                        )}
                        {g.stage === "submitted" && g.decision_note && (
                          <span className="adm-card__text">Decision {g.decision_note}</span>
                        )}
                        <div className="adm-grant__actions">
                          <Link href={`/admin/grants/${g.id}`} className="adm-grant__open">
                            Open bench
                          </Link>
                          <Modal
                            title={`Edit ${g.name}`}
                            size="wide"
                            trigger={
                              <IconButton ariaLabel={`Edit ${g.name}`} title="Edit">
                                <Pencil className="h-4 w-4" strokeWidth={2.25} />
                              </IconButton>
                            }
                          >
                            <GrantForm action={saveGrant} initial={g} />
                          </Modal>
                          <form action={deleteGrant}>
                            <input type="hidden" name="id" value={g.id} />
                            <PendingIconButton tone="danger" ariaLabel={`Remove ${g.name}`} title="Remove">
                              <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                            </PendingIconButton>
                          </form>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
