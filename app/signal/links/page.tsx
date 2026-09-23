import type { Metadata } from "next";
import LinksExperience from "./LinksExperience";
import {
  getEvents,
  getSpeakersWithTalksForEvent,
  getSponsors,
  getTalks,
} from "@/lib/cms-content";
import { SIGNAL_SPONSOR_EXCLUDE } from "@/lib/signal-content";

/**
 * Signal event-day resource hub. Reached by scanning a QR code on site
 * (19 to 25 October, live event Saturday 24 October), NOT via the header
 * nav or any on-site link, so it stays out of search entirely rather than
 * competing with /signal for the "Signal" query. Nav and Footer are hidden
 * for this route in their own HIDE_ON lists (components/Nav.tsx,
 * components/Footer.tsx): this page owns its full-screen chrome.
 *
 * Every tile opens an in-page modal rather than navigating away (Will's
 * call, so nobody scanning the QR code loses this page mid-event). The data
 * each modal needs (real Signal speakers, real sponsors, the About stats) is
 * fetched here, server-side, the same way /signal and /mission do it, and
 * handed down as plain props. This file is NOT a copy of that data: it calls
 * the same `lib/cms-content.ts` functions those pages call, so whatever is
 * true in the CMS today is what renders here too.
 */
const TITLE = "Signal · Event guide";
const DESCRIPTION =
  "Your guide to TEDxNewy Signal on Saturday 24 October: the program, the speakers, where to eat and stay across event week, and the partners behind it.";

/**
 * **`robots: noindex` and the share card are unrelated, and both are
 * deliberate.** The page stays out of search because it is a QR-code
 * destination that would otherwise compete with `/signal` for the "Signal"
 * query. Link unfurlers (iMessage, WhatsApp, Slack, the socials) do not
 * consult robots directives, so a shared link still previews, which is why
 * this route has its own `opengraph-image.tsx`. Do not loosen the robots
 * rules to "make sharing work": they are not what governs it.
 *
 * **There is deliberately no `openGraph` block here.** Next does not deep
 * merge that object across segments: declaring one at all REPLACES the root
 * layout's, and the root layout is where `og:site_name` and `og:locale` come
 * from. Writing an explicit block cost both of those, which is the same
 * class of bug the root layout's own comment warns about. Left alone, Next
 * fills `og:title` and `og:description` from the `title` and `description`
 * above, exactly as every other page on the site relies on.
 *
 * `twitter` IS written out, because the root layout declares no twitter
 * object, so there is nothing to lose by replacing it and the card type is
 * then pinned rather than inferred. The image itself comes from the
 * `opengraph-image` file convention, which Next mirrors onto
 * `twitter:image` without being asked.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/signal/links" },
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

// Re-fetch from Supabase every 60s, same cadence as /signal, so admin edits
// (a newly announced speaker, an updated sponsor logo) land here without a
// redeploy.
export const revalidate = 60;

export default async function SignalLinksPage() {
  // No team fetch: the About modal used to show a volunteer count and no
  // longer does (2026-09-23), so nothing here needs the team list.
  const [events, sponsors, talks] = await Promise.all([
    getEvents(),
    getSponsors(),
    getTalks(),
  ]);

  const signalEvent = events.find((e) => e.slug === "signal-2026");
  const signalSpeakers = signalEvent
    ? await getSpeakersWithTalksForEvent(signalEvent.id)
    : [];

  const signalSponsors = sponsors.filter(
    (s) => !SIGNAL_SPONSOR_EXCLUDE.has(s.name),
  );

  // Same "events staged since 2024" math as /mission, so the About modal's
  // stat isn't a second, driftable copy of that logic.
  const now = Date.now();
  const staged = events.filter(
    (e) => e.startsAt && Date.parse(e.startsAt) < now,
  ).length;

  return (
    <LinksExperience
      speakers={signalSpeakers}
      sponsors={signalSponsors}
      aboutStats={{
        staged,
        talks: talks.length,
      }}
    />
  );
}
