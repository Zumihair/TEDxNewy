/**
 * Data shared between the campaigns page (server) and CampaignsList (client).
 *
 * Plain data only, no "use client" directive. A value export (TABS) from a
 * client module isn't usable as real data when imported back into a server
 * component — only the type survives, the runtime import resolves to a
 * client-reference stub instead of the array, which is what
 * `TABS.map is not a function` was.
 */

export type Tab = "drafts" | "scheduled" | "sent";

export const TABS: { key: Tab; label: string }[] = [
  { key: "drafts", label: "Drafts" },
  { key: "scheduled", label: "Scheduled" },
  { key: "sent", label: "Sent" },
];

export type NewsletterListRow = {
  id: string;
  title: string | null;
  subject: string | null;
  preheader: string | null;
  blocks: unknown;
  status: string;
  stage: string | null;
  updated_at: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  sent_count: number | null;
  failed_count: number | null;
  send_batch_id: string | null;
};
