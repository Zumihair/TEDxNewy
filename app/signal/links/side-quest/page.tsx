import type { Metadata } from "next";
import SideQuestApp from "./SideQuestApp";
import SideQuestShell from "./SideQuestShell";

/**
 * Signal Side Quest: the intermission phone game. Reached from the hub tile
 * and by the three hidden QR codes (`./qr/[n]`). Out of search like the rest
 * of /signal/links (robots.ts already disallows the whole prefix, this is
 * the page-level backstop).
 */
export const metadata: Metadata = {
  title: "Signal Side Quest",
  description: "Quests for the Signal intermission on Saturday 24 October.",
  robots: { index: false, follow: false },
};

export default function SideQuestPage() {
  return (
    <SideQuestShell>
      <SideQuestApp />
    </SideQuestShell>
  );
}
