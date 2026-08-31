"use client";

import { useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { SecondaryButton } from "../ui";
import { syncWithMailchimp } from "./actions";
import { useToast } from "../Toaster";

/**
 * Two-way sync with the Mailchimp audience: pushes site signups Mailchimp
 * is missing, imports Mailchimp members the site is missing (with their
 * original opt-in dates), and aligns subscribed/unsubscribed status.
 */
export default function SyncMailchimpButton() {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const onSync = () => {
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
        toast.success(`Synced: ${parts.join(", ")}.`);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <SecondaryButton type="button" disabled={pending} onClick={onSync}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
      ) : (
        <RefreshCw className="h-4 w-4" strokeWidth={2.25} />
      )}
      Sync with Mailchimp
    </SecondaryButton>
  );
}
