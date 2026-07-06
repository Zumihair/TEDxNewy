"use client";

import { useState, useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { SecondaryButton } from "../ui";
import { syncWithMailchimp } from "./actions";

/**
 * Two-way sync with the Mailchimp audience: pushes site signups Mailchimp
 * is missing, imports Mailchimp members the site is missing (with their
 * original opt-in dates), and aligns subscribed/unsubscribed status.
 */
export default function SyncMailchimpButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);

  const onSync = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await syncWithMailchimp();
      if (res.ok) {
        const parts = [
          `${res.imported} imported from Mailchimp`,
          `${res.pushed} pushed to Mailchimp`,
        ];
        if (res.unsubscribed) {
          parts.push(`${res.unsubscribed} marked unsubscribed`);
        }
        if (res.resubscribed) {
          parts.push(`${res.resubscribed} marked resubscribed`);
        }
        setMessage({ tone: "ok", text: `Synced: ${parts.join(", ")}.` });
      } else {
        setMessage({ tone: "error", text: res.error });
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <SecondaryButton type="button" disabled={pending} onClick={onSync}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
        ) : (
          <RefreshCw className="h-4 w-4" strokeWidth={2.25} />
        )}
        Sync with Mailchimp
      </SecondaryButton>
      {message && (
        <span
          className={
            "text-[12.5px] " +
            (message.tone === "ok" ? "text-[#15803d]" : "text-[#b91404]")
          }
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
