"use client";

import { useState, useTransition } from "react";
import { reachMissedTicketHolders } from "../actions";

/**
 * Sent ticket-holder campaigns only reach ticket holders who are on the
 * Mailchimp list. This checks who was missed, asks, then emails them the
 * same newsletter from Resend.
 */
export default function MissedTicketHolders({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  const run = () =>
    start(async () => {
      setNote(null);
      const check = await reachMissedTicketHolders(id, false);
      if (!check.ok) return setNote(check.error);
      if (check.toSend === 0) {
        return setNote(`Everyone is covered: ${check.ticketHolders} ticket holders.`);
      }
      const go = window.confirm(
        `${check.toSend} of ${check.ticketHolders} ticket holders did not receive this email` +
          (check.alreadyFollowedUp ? ` (${check.alreadyFollowedUp} more were already followed up)` : "") +
          `.\n\n` +
          (check.later > 0
            ? `Resend's free plan allows 100 emails a day, so this sends ${check.thisRun} now. ` +
              `The other ${check.later} can be sent by clicking again after the daily reset (about 11am Sydney).\n\nSend ${check.thisRun} now?`
            : `Send it to those ${check.toSend} now?`),
      );
      if (!go) return setNote(`${check.toSend} not yet sent.`);
      const done = await reachMissedTicketHolders(id, true);
      if (!done.ok) return setNote(done.error);
      setNote(
        `Sent to ${done.sent ?? 0}` +
          (done.failed ? `, ${done.failed} failed` : "") +
          (done.later > 0 ? `. ${done.later} still to send after the daily reset.` : "."),
      );
    });

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button type="button" className="tx-btn tx-btn--sm tx-btn--auto" disabled={pending} onClick={run}>
        {pending ? "Working" : "Reach missed ticket holders"}
      </button>
      {note && <span style={{ fontSize: 12, color: "var(--stone)" }}>{note}</span>}
    </span>
  );
}
