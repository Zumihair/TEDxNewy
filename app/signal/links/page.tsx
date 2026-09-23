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
export const metadata: Metadata = {
  alternates: { canonical: "/signal/links" },
  title: "Signal · Event Guide",
  description:
    "Everything you need for TEDxNewy Signal, in one place: the program, speakers, the Event Week Guide, sponsors and more.",
  robots: { index: false, follow: false },
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
