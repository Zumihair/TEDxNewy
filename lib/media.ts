import { getServerSupabase } from "./supabase-server";

/**
 * The media room: journalist contacts and the Signal media release.
 * Same shape as lib/partners.ts, deliberately smaller: one table, a status
 * per contact, sends logged to email_sends by the action that sends them.
 */

export type MediaStatus =
  | "prospect"
  | "pitched"
  | "responded"
  | "covered"
  | "declined";

export const MEDIA_STATUSES: { id: MediaStatus; label: string; hint: string }[] = [
  { id: "prospect", label: "Prospect", hint: "On the list, not yet pitched" },
  { id: "pitched", label: "Pitched", hint: "Release sent, awaiting reply" },
  { id: "responded", label: "Responded", hint: "In conversation" },
  { id: "covered", label: "Covered", hint: "Ran a story" },
  { id: "declined", label: "Declined", hint: "Passed this time" },
];

export type MediaContact = {
  id: string;
  fullName: string;
  outlet: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  status: MediaStatus;
  notes: string | null;
  source: string | null;
  lastContactedAt: string | null;
  createdAt: string;
};

type MediaRow = {
  id: string;
  full_name: string;
  outlet: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  status: string;
  notes: string | null;
  source: string | null;
  last_contacted_at: string | null;
  created_at: string;
};

const STATUS_IDS = MEDIA_STATUSES.map((s) => s.id);

function rowToContact(r: MediaRow): MediaContact {
  return {
    id: r.id,
    fullName: r.full_name,
    outlet: r.outlet,
    title: r.title,
    email: r.email,
    phone: r.phone,
    linkedinUrl: r.linkedin_url,
    status: (STATUS_IDS as string[]).includes(r.status)
      ? (r.status as MediaStatus)
      : "prospect",
    notes: r.notes,
    source: r.source,
    lastContactedAt: r.last_contacted_at,
    createdAt: r.created_at,
  };
}

export async function listMediaContacts(): Promise<MediaContact[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("cms_media_contacts")
    .select("*")
    .order("outlet", { ascending: true })
    .order("full_name", { ascending: true });
  if (error || !data) return [];
  return (data as MediaRow[]).map(rowToContact);
}

/**
 * The Newcastle/Hunter outlets worth pitching, with the domain Apollo should
 * search. requireNewcastle narrows national newsrooms to local staff.
 */
export const OUTLETS: {
  name: string;
  domain: string;
  requireNewcastle: boolean;
}[] = [
  { name: "Newcastle Herald", domain: "newcastleherald.com.au", requireNewcastle: false },
  { name: "NBN News", domain: "nbnnews.com.au", requireNewcastle: false },
  { name: "ABC Newcastle", domain: "abc.net.au", requireNewcastle: true },
  { name: "Newcastle Weekly", domain: "newcastleweekly.com.au", requireNewcastle: false },
  { name: "Hunter Headline", domain: "hunterheadline.com.au", requireNewcastle: false },
  { name: "Newcastle Live", domain: "newcastlelive.com.au", requireNewcastle: false },
  { name: "HunterHunter", domain: "hunterhunter.com.au", requireNewcastle: false },
  { name: "2NURFM", domain: "2nurfm.com.au", requireNewcastle: false },
  { name: "Hit 106.9 Newcastle", domain: "hit.com.au", requireNewcastle: true },
  { name: "Triple M Newcastle", domain: "triplem.com.au", requireNewcastle: true },
];

/**
 * The branded one-page PDF of the release, attached to every pitch email.
 * Regenerate and re-upload (same path) when the release copy changes; the
 * plain-text version below should always match it.
 */
export const MEDIA_RELEASE_PDF_URL =
  "https://gurlrjlesdbiqxhavwil.supabase.co/storage/v1/object/public/documents/media/signal-2026-media-release.pdf";
export const MEDIA_RELEASE_PDF_FILENAME =
  "TEDxNewy - Signal - Media Release.pdf";

/**
 * The Signal media release, ready to paste into an email. Plain text on
 * purpose: journalists forward and quote from plain text, and it renders
 * everywhere. Update the facts here when the story changes.
 */
export function signalMediaRelease(sender: MediaSender = "jake"): string {
  const from = MEDIA_SENDERS[sender];
  return `MEDIA RELEASE

Newcastle's ideas, on a global stage: TEDxNewy brings Signal to the Conservatorium on 24 October

NEWCASTLE, NSW: Three hundred Novocastrians will fill the Conservatorium of Music from 1:30pm on Saturday 24 October for Signal, TEDxNewy's flagship event, as ideas from the Hunter join one of the most-watched speaking platforms in the world.

Every talk is filmed for the TEDx YouTube channel, which has more than 40 million subscribers and carries talks from Sydney, London and New York alongside those from Newcastle. TEDx events are held in more than 170 countries; Signal is the Hunter's.

The afternoon features a lineup of local innovators, researchers and storytellers delivering talks of under 18 minutes, with live performance between them. Speakers are being revealed one at a time at tedxnewy.com.au/signal.

"Newcastle is full of ideas that deserve a bigger audience, and Signal gives them one: 300 curious people in the room on the day, and the world's biggest ideas platform after it," said Jake Hoppe, Licensee and CEO of TEDxNewy. "This year we have taken TEDx beyond the main stage, with a series of community salons and student workshops across the Hunter that have put the power of ideas in more hands than ever. Signal is where that year comes together, on one stage, in front of the city."

TEDxNewy is entirely volunteer-run and not-for-profit. Every dollar from tickets and partnerships goes back into the events and the stage. Angel tickets fund a second seat for someone who could not otherwise attend.

Tickets are $59.99 to $159.99 at events.humanitix.com/tedxnewy-signal.

ENDS

Media contact: ${from.name}, ${from.title}
${from.email} · ${from.phone}

Notes to editors:
- Interviews available with organisers and speakers.
- High-resolution photography from all 2026 events available on request.
- TEDx is a program of local, self-organised events licensed by TED, held in more than 170 countries. Talks are published on the TEDx YouTube channel (40 million+ subscribers).
- TEDxNewy (formerly TEDxCooksHill) is an independently organised TED event operated under licence from TED by Newcastle Ideas Network Limited, staged on Awabakal and Worimi Country.`;
}

export function defaultPitchSubject(): string {
  return "Media release: Newcastle's ideas on a global stage, TEDxNewy Signal 24 October";
}

export type MediaSender = "jake" | "will";

export const MEDIA_SENDERS: Record<
  MediaSender,
  { name: string; title: string; email: string; phone: string }
> = {
  jake: {
    name: "Jake Hoppe",
    title: "Licensee and CEO, TEDxNewy",
    email: "jake@tedxnewy.com.au",
    phone: "0431 814 227",
  },
  will: {
    name: "Will Berry",
    title: "COO, TEDxNewy",
    email: "will@tedxnewy.com.au",
    phone: "0401 239 213",
  },
};

export function defaultPitchIntro(
  contactName: string | null,
  sender: MediaSender = "jake",
): string {
  const hi = contactName ? `Hi ${contactName.split(" ")[0]},` : "Hi,";
  const from = MEDIA_SENDERS[sender];
  return `${hi}

Tickets are on sale for Signal, TEDxNewy's flagship event at the Conservatorium of Music on Saturday 24 October from 1:30pm. Three hundred people in the room, talks filmed for a global audience, and a season that has sold out three times already, so there are a few good local angles in this one.

The full release is attached as a PDF, and pasted below for convenience. Happy to set up interviews or send photography.

Best,
${from.name}
${from.title} · ${from.phone}

----------------------------------------

`;
}
