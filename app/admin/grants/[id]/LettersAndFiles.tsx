"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ExternalLink, X } from "lucide-react";
import { Badge, SecondaryButton } from "../../ui";
import { useToast } from "../../Toaster";
import {
  attachFile,
  attachLetter,
  detachFile,
  detachLetter,
} from "../library/actions";
import LetterStatusSelect from "../library/LetterStatusSelect";
import {
  FILE_KIND_LABEL,
  LETTER_TYPE_LABEL,
  expiryOf,
  expiryText,
  letterDue,
  type GrantFile,
  type GrantLetter,
} from "../library/shared";
import type { BenchResult } from "./actions";

/**
 * The letters and evidence files this grant uses, on its bench. The records
 * themselves live in the library (one letter or file can serve many grants);
 * this card only attaches and detaches them and shows what is still missing.
 */
export default function LettersAndFiles({
  grantId,
  letters,
  files,
  spareLetters,
  spareFiles,
  today,
}: {
  grantId: string;
  letters: GrantLetter[];
  files: GrantFile[];
  /** Letters in the library that are not attached to this grant yet. */
  spareLetters: GrantLetter[];
  spareFiles: GrantFile[];
  today: string;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [letterPick, setLetterPick] = useState("");
  const [filePick, setFilePick] = useState("");

  const run = (task: () => Promise<BenchResult>, done?: string, after?: () => void) =>
    start(async () => {
      const res = await task();
      if (!res.ok) toast.error(res.error);
      else {
        if (done) toast.success(done);
        after?.();
      }
    });

  const received = letters.filter((l) => l.status === "received").length;
  const stale = files.filter((f) => expiryOf(f.expires_on, today).state === "expired").length;

  return (
    <section className="adm-benchcard">
      <div className="adm-benchcard__head">
        <h2 className="adm-section__title">Letters and evidence</h2>
        <span className="adm-benchcard__aside">
          {letters.length > 0 ? `${received} of ${letters.length} letters in` : "No letters attached"}
        </span>
      </div>

      <div className="adm-lib__sub">
        <h3 className="adm-lib__subtitle">Reference letters</h3>
        {letters.length === 0 ? (
          <p className="adm-card__text">Attach the letters this application needs, or add a new one in the library.</p>
        ) : (
          <ul className="adm-tasks">
            {letters.map((l) => {
              const due = letterDue(l, today);
              return (
                <li key={l.id} className="adm-task adm-lib__attached-row">
                  <div className="adm-task__text">
                    <span className="adm-task__title">{l.referee}</span>
                    <span className={"adm-task__meta" + (due?.urgent ? " is-late" : "")}>
                      {[l.role, LETTER_TYPE_LABEL[l.letter_type], due?.text].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  <LetterStatusSelect letterId={l.id} status={l.status} referee={l.referee} />
                  {l.file_url && (
                    <a href={l.file_url} target="_blank" rel="noreferrer" className="adm-lib__open" aria-label={`Open the letter from ${l.referee}`}>
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </a>
                  )}
                  <button
                    type="button"
                    className="adm-lib__detach"
                    aria-label={`Detach the letter from ${l.referee}`}
                    title="Detach from this grant"
                    disabled={pending}
                    onClick={() => run(() => detachLetter(grantId, l.id), "Detached.")}
                  >
                    <X className="h-4 w-4" strokeWidth={2.25} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {spareLetters.length > 0 && (
          <div className="adm-lib__attach">
            <select
              aria-label="Attach a letter"
              value={letterPick}
              onChange={(e) => setLetterPick(e.target.value)}
              className="adm-lib__attach-select"
            >
              <option value="">Attach a letter…</option>
              {spareLetters.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.referee}
                </option>
              ))}
            </select>
            <SecondaryButton
              type="button"
              write
              disabled={!letterPick || pending}
              onClick={() => run(() => attachLetter(grantId, letterPick), "Letter attached.", () => setLetterPick(""))}
            >
              Attach
            </SecondaryButton>
          </div>
        )}
      </div>

      <div className="adm-lib__sub">
        <div className="adm-lib__subhead">
          <h3 className="adm-lib__subtitle">Evidence files</h3>
          {stale > 0 && <Badge tone="red">{stale === 1 ? "1 expired" : `${stale} expired`}</Badge>}
        </div>
        {files.length === 0 ? (
          <p className="adm-card__text">Certificates, statements and reports this application needs.</p>
        ) : (
          <ul className="adm-tasks">
            {files.map((f) => {
              const e = expiryOf(f.expires_on, today);
              const tone = e.state === "expired" ? "red" : e.state === "soon" ? "draft" : e.state === "ok" ? "live" : "neutral";
              return (
                <li key={f.id} className="adm-task adm-lib__attached-row">
                  <div className="adm-task__text">
                    <span className="adm-task__title">{f.title}</span>
                    <span className="adm-task__meta">{FILE_KIND_LABEL[f.kind]}</span>
                  </div>
                  <Badge tone={tone}>{expiryText(f.expires_on, today)}</Badge>
                  {f.file_url && (
                    <a href={f.file_url} target="_blank" rel="noreferrer" className="adm-lib__open" aria-label={`Open ${f.title}`}>
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </a>
                  )}
                  <button
                    type="button"
                    className="adm-lib__detach"
                    aria-label={`Detach ${f.title}`}
                    title="Detach from this grant"
                    disabled={pending}
                    onClick={() => run(() => detachFile(grantId, f.id), "Detached.")}
                  >
                    <X className="h-4 w-4" strokeWidth={2.25} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {spareFiles.length > 0 && (
          <div className="adm-lib__attach">
            <select
              aria-label="Attach a file"
              value={filePick}
              onChange={(e) => setFilePick(e.target.value)}
              className="adm-lib__attach-select"
            >
              <option value="">Attach a file…</option>
              {spareFiles.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
            <SecondaryButton
              type="button"
              write
              disabled={!filePick || pending}
              onClick={() => run(() => attachFile(grantId, filePick), "File attached.", () => setFilePick(""))}
            >
              Attach
            </SecondaryButton>
          </div>
        )}
      </div>

      <Link href="/admin/grants/library" className="adm-lib__manage">
        Manage all letters and files
      </Link>
    </section>
  );
}
