// The letters and files lists. No directive: the admin page and the
// /dev/admin-preview sample both render it.
import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import { Badge, Flash, IconButton } from "../../ui";
import { Modal } from "../../Modal";
import { shortDate } from "../shared";
import DeleteRecord from "./DeleteRecord";
import FileForm from "./FileForm";
import LetterForm from "./LetterForm";
import LetterStatusSelect from "./LetterStatusSelect";
import { deleteFile, deleteLetter, saveFile, saveLetter } from "./actions";
import {
  FILE_KIND_LABEL,
  LETTER_STATUSES,
  LETTER_STATUS_LABEL,
  LETTER_TYPE_LABEL,
  expiryOf,
  expiryText,
  isOpenStage,
  lowerFirst,
  letterDue,
  type GrantFile,
  type GrantLetter,
  type GrantOption,
  type LetterStatus,
} from "./shared";

export type LibraryLetter = GrantLetter & { grantIds: string[] };
export type LibraryFile = GrantFile & { grantIds: string[] };

const STATUS_FOOT: Record<LetterStatus, string> = {
  to_ask: "no request sent yet",
  asked: "waiting to hear back",
  drafting: "with them to write",
  received: "ready to use",
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export default function LibraryView({
  letters,
  files,
  grants,
  today,
}: {
  letters: LibraryLetter[];
  files: LibraryFile[];
  grants: GrantOption[];
  today: string;
}) {
  const grantName = new Map(grants.map((g) => [g.id, g.name]));
  const openIds = new Set(grants.filter((g) => isOpenStage(g.stage)).map((g) => g.id));
  const openCount = (ids: string[]) => ids.filter((id) => openIds.has(id)).length;

  // Outstanding letters first, soonest due at the top; received ones sink.
  const order: Record<LetterStatus, number> = { to_ask: 0, asked: 1, drafting: 1, received: 2 };
  const sortedLetters = [...letters].sort(
    (a, b) =>
      order[a.status] - order[b.status] ||
      (a.due_on ?? "9999").localeCompare(b.due_on ?? "9999") ||
      a.referee.localeCompare(b.referee),
  );
  const rank = { expired: 0, soon: 1, ok: 2, none: 3 } as const;
  const sortedFiles = [...files].sort(
    (a, b) =>
      rank[expiryOf(a.expires_on, today).state] - rank[expiryOf(b.expires_on, today).state] ||
      a.title.localeCompare(b.title),
  );

  const expired = files.filter((f) => expiryOf(f.expires_on, today).state === "expired");
  const soon = files.filter((f) => expiryOf(f.expires_on, today).state === "soon");
  const counts = Object.fromEntries(LETTER_STATUSES.map((s) => [s, letters.filter((l) => l.status === s).length])) as Record<
    LetterStatus,
    number
  >;

  return (
    <>
      {(expired.length > 0 || soon.length > 0) && (
        <div className="adm-stack" style={{ gap: "var(--space-2)" }}>
          {expired.map((f) => {
            const n = openCount(f.grantIds);
            return (
              <Flash key={f.id} tone="error">
                <strong>{f.title}</strong> {lowerFirst(expiryText(f.expires_on, today))}.{" "}
                {n > 0
                  ? `It is attached to ${plural(n, "open grant")}. Replace it before they go in.`
                  : "Replace it before it is next needed."}
              </Flash>
            );
          })}
          {soon.map((f) => (
            <Flash key={f.id} tone="info">
              <strong>{f.title}</strong> {lowerFirst(expiryText(f.expires_on, today))}. Ask for a new one now.
            </Flash>
          ))}
        </div>
      )}

      <section className="adm-lib" aria-labelledby="letters-h">
        <div className="adm-lib__head">
          <h2 id="letters-h" className="adm-lib__h2">
            Reference letters
          </h2>
          <p className="adm-card__text">
            People who vouch for us. Keep one record per letter, attach it to every grant that needs it, and move it along as it comes in.
          </p>
        </div>

        <section className="adm-statrow" style={{ ["--n" as string]: 4 }}>
          {LETTER_STATUSES.map((s) => (
            <div key={s} className="adm-stat2">
              <span className="adm-stat2__label">{LETTER_STATUS_LABEL[s]}</span>
              <span className="adm-stat2__value">{counts[s]}</span>
              <span className="adm-stat2__foot">{STATUS_FOOT[s]}</span>
            </div>
          ))}
        </section>

        {sortedLetters.length === 0 ? (
          <p className="adm-lib__empty">
            No letters yet. Add the people who will vouch for us, then attach each one to the grants that need it.
          </p>
        ) : (
          <ul className="adm-lib__list">
            {sortedLetters.map((l) => {
              const due = letterDue(l, today);
              return (
                <li key={l.id} className="adm-lib__row">
                  <div className="adm-lib__who">
                    <span className="adm-lib__name">{l.referee}</span>
                    <span className="adm-card__text">
                      {[l.role, LETTER_TYPE_LABEL[l.letter_type]].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  <div className="adm-lib__for">
                    {l.grantIds.length === 0 ? (
                      <span className="adm-card__text">Not attached to a grant</span>
                    ) : (
                      l.grantIds.map((id) => (
                        <Link key={id} href={`/admin/grants/${id}`} className="adm-lib__chip">
                          {grantName.get(id) ?? "A grant"}
                        </Link>
                      ))
                    )}
                  </div>
                  <div className="adm-lib__state">
                    <LetterStatusSelect letterId={l.id} status={l.status} referee={l.referee} />
                    {due && <span className={"adm-grant__due" + (due.urgent ? " is-urgent" : "")}>{due.text}</span>}
                    {l.status === "received" && l.received_on && (
                      <span className="adm-card__text">Received {shortDate(l.received_on)}</span>
                    )}
                    {l.status !== "received" && l.status !== "to_ask" && l.asked_on && (
                      <span className="adm-card__text">Asked {shortDate(l.asked_on)}</span>
                    )}
                  </div>
                  <div className="adm-lib__actions">
                    {l.file_url && (
                      <a href={l.file_url} target="_blank" rel="noreferrer" className="adm-lib__open">
                        Open letter
                        <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
                      </a>
                    )}
                    <Modal
                      title={`Edit the letter from ${l.referee}`}
                      size="wide"
                      trigger={
                        <IconButton ariaLabel={`Edit the letter from ${l.referee}`} title="Edit">
                          <Pencil className="h-4 w-4" strokeWidth={2.25} />
                        </IconButton>
                      }
                    >
                      <LetterForm action={saveLetter} initial={l} grants={grants} linked={l.grantIds} />
                    </Modal>
                    <DeleteRecord
                      action={deleteLetter}
                      id={l.id}
                      title={`Delete the letter from ${l.referee}?`}
                      body="Grants it was attached to keep working, just without it. An uploaded file is removed. This can't be undone."
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="adm-lib" aria-labelledby="files-h">
        <div className="adm-lib__head">
          <h2 id="files-h" className="adm-lib__h2">
            Files every application asks for
          </h2>
          <p className="adm-card__text">
            Certificates, statements and reports. Replace a file here and every grant it is attached to picks up the new one.
          </p>
        </div>

        {sortedFiles.length === 0 ? (
          <p className="adm-lib__empty">
            No files yet. Start with the public liability certificate, the incorporation certificate and a recent bank statement.
          </p>
        ) : (
          <ul className="adm-lib__grid">
            {sortedFiles.map((f) => {
              const e = expiryOf(f.expires_on, today);
              const tone = e.state === "expired" ? "red" : e.state === "soon" ? "draft" : e.state === "ok" ? "live" : "neutral";
              const open = openCount(f.grantIds);
              return (
                <li key={f.id} className={"adm-lib__card" + (e.state === "expired" ? " is-expired" : "")}>
                  <div className="adm-lib__cardtop">
                    <div className="adm-lib__who">
                      <span className="adm-lib__name">{f.title}</span>
                      <span className="adm-card__text">
                        {[FILE_KIND_LABEL[f.kind], f.dated_on ? `dated ${shortDate(f.dated_on)}` : null].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <Badge tone={tone}>{expiryText(f.expires_on, today)}</Badge>
                  </div>
                  <span className="adm-card__text">
                    {f.grantIds.length === 0
                      ? "Not attached to a grant"
                      : open > 0
                        ? `In ${plural(open, "open grant")}`
                        : `In ${plural(f.grantIds.length, "grant")}, none open`}
                  </span>
                  {f.grantIds.length > 0 && (
                    <div className="adm-lib__for">
                      {f.grantIds.map((id) => (
                        <Link key={id} href={`/admin/grants/${id}`} className="adm-lib__chip">
                          {grantName.get(id) ?? "A grant"}
                        </Link>
                      ))}
                    </div>
                  )}
                  <div className="adm-lib__actions">
                    {f.file_url ? (
                      <a href={f.file_url} target="_blank" rel="noreferrer" className="adm-lib__open">
                        Open file
                        <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
                      </a>
                    ) : (
                      <span className="adm-card__text">No file uploaded yet</span>
                    )}
                    <Modal
                      title={`Edit ${f.title}`}
                      size="wide"
                      trigger={
                        <IconButton ariaLabel={`Edit ${f.title}`} title="Edit">
                          <Pencil className="h-4 w-4" strokeWidth={2.25} />
                        </IconButton>
                      }
                    >
                      <FileForm action={saveFile} initial={f} grants={grants} linked={f.grantIds} />
                    </Modal>
                    <DeleteRecord
                      action={deleteFile}
                      id={f.id}
                      title={`Delete ${f.title}?`}
                      body="Grants it was attached to keep working, just without it. The uploaded file is removed. This can't be undone."
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
