"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleCommitment } from "../actions";

/** A single commitment's checkbox. Toggling calls the server action
 *  directly (not a <form action>) so it updates instantly rather than
 *  round-tripping the whole page for a click. */
export default function CommitmentCheckbox({
  commitmentId,
  partnerId,
  done,
}: {
  commitmentId: string;
  partnerId: string;
  done: boolean;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(done);
  const [pending, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.checked;
        setChecked(next);
        startTransition(async () => {
          const fd = new FormData();
          fd.set("commitment_id", commitmentId);
          fd.set("partner_id", partnerId);
          fd.set("done", String(next));
          await toggleCommitment(fd);
          router.refresh();
        });
      }}
      className="h-4 w-4 shrink-0 accent-[#2f6b41] disabled:opacity-60"
    />
  );
}
