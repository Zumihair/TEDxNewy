"use client";

import { useState, useTransition } from "react";
import { syncTicketHoldersNow } from "../actions";

/** Runs the daily Mailchimp ticket holder sync now, e.g. right before a send. */
export default function SyncTicketHolders() {
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  const run = () =>
    start(async () => {
      setNote(null);
      const r = await syncTicketHoldersNow();
      if (!r.ok) return setNote(r.error);
      setNote(
        `${r.inSegment} ticket holders in Mailchimp. ${r.added} added to the audience, ${r.removed} removed` +
          (r.optedOut ? `, ${r.optedOut} unsubscribed and skipped.` : "."),
      );
    });

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button type="button" className="tx-btn tx-btn--sm tx-btn--auto" disabled={pending} onClick={run}>
        {pending ? "Syncing" : "Sync ticket holders"}
      </button>
      {note && <span style={{ fontSize: 12, color: "var(--stone)" }}>{note}</span>}
    </span>
  );
}
