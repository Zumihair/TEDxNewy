"use client";

import { useState, useTransition } from "react";
import { useToast } from "../../Toaster";
import { LETTER_STATUSES, LETTER_STATUS_LABEL, asLetterStatus, type LetterStatus } from "./shared";
import { setLetterStatus } from "./actions";

/** A letter's status as a small dropdown: change it and it saves, with a toast. */
export default function LetterStatusSelect({
  letterId,
  status,
  referee,
}: {
  letterId: string;
  status: LetterStatus;
  referee: string;
}) {
  const [value, setValue] = useState<LetterStatus>(status);
  const [pending, start] = useTransition();
  const toast = useToast();

  return (
    <select
      aria-label={`Status of the letter from ${referee}`}
      value={value}
      disabled={pending}
      className="adm-lib__status"
      data-status={value}
      onChange={(e) => {
        const next = asLetterStatus(e.target.value);
        const before = value;
        setValue(next);
        start(async () => {
          const res = await setLetterStatus(letterId, next);
          if (!res.ok) {
            setValue(before);
            toast.error(res.error);
          } else {
            toast.success(`Marked ${LETTER_STATUS_LABEL[next].toLowerCase()}.`);
          }
        });
      }}
    >
      {LETTER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {LETTER_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
