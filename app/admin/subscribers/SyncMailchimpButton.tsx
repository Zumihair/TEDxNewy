"use client";

import { useState, useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { SecondaryButton } from "../ui";
import { syncSubscribersToMailchimp } from "./actions";

/**
 * One-off backfill of the local subscriber list into the Mailchimp audience.
 * New site signups sync automatically; this catches anything from before the
 * integration existed.
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
      const res = await syncSubscribersToMailchimp();
      if (res.ok) {
        setMessage({
          tone: "ok",
          text: `Synced ${res.sent}: ${res.added} added, ${res.updated} already there${res.errors ? `, ${res.errors} failed` : ""}.`,
        });
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
        Sync to Mailchimp
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
