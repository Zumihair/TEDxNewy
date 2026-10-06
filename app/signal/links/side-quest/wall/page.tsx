import type { Metadata } from "next";
import WallView from "./WallView";

/**
 * Full-screen photo wall for the projector. No nav, no chrome (Nav and Footer
 * already hide on everything under /signal/links), out of search. Kept out of
 * the hub's grainy backdrop tree on purpose: this screen repaints whenever a
 * photo arrives and must stay cheap.
 */
export const metadata: Metadata = {
  title: "Signal Side Quest · Photo wall",
  robots: { index: false, follow: false },
};

export default function SideQuestWallPage() {
  return <WallView />;
}
