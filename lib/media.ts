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
 * The Signal media release, ready to paste into an email. Plain text on
 * purpose: journalists forward and quote from plain text, and it renders
 * everywhere. Update the facts here when the story changes.
 */
export function signalMediaRelease(): string {
  return `MEDIA RELEASE

TEDx returns to Newcastle's biggest stage: Signal, 24 October

NEWCASTLE, NSW: TEDxNewy will stage its flagship event, Signal, at the Conservatorium of Music on Saturday 24 October, with tickets on sale now through Humanitix.

Signal is the fourth and final event of a season that has sold out three times in 2026: a citizen salon on Newcastle in 2050, a 60-second talk night for first-time speakers, and a Youth Futures Lab that brought 75 students from seven Hunter schools together for a day of ideas.

The full afternoon features talks under 18 minutes, live performance and a secret showcase. One speaking slot belongs to the winner of the Student Speaker Competition, a Hunter high schooler coached to deliver a full TEDx talk on the main stage.

"Newcastle keeps proving it has ideas worth hearing. Talks filmed on our stages have now been watched 4.2 million times around the world," said Jake Hoppe, Director of TEDxNewy. "Signal is the day the whole season builds toward, on the same stage we sold out last October."

TEDxNewy is entirely volunteer-run and not-for-profit. Every dollar from tickets and partnerships goes back into the events, the schools program and the stage. Angel tickets fund a second seat for someone who could not otherwise attend.

Tickets are $59.99 to $159.99 at events.humanitix.com/tedxnewy-signal.

ENDS

Media contact: Jake Hoppe, Director, TEDxNewy
jake@tedxnewy.com.au · 0431 814 227

Notes to editors:
- Interviews available with organisers, speakers and Youth Futures Lab students (with school approval).
- High-resolution photography from all 2026 events available on request.
- TEDxNewy (formerly TEDxCooksHill) is an independently organised TED event operated under licence from TED by Newcastle Ideas Network Limited, staged on Awabakal and Worimi Country.`;
}

export function defaultPitchSubject(): string {
  return "Media release: TEDx returns to Newcastle's biggest stage, 24 October";
}

export function defaultPitchIntro(contactName: string | null): string {
  const hi = contactName ? `Hi ${contactName.split(" ")[0]},` : "Hi,";
  return `${hi}

Tickets went on sale today for Signal, TEDxNewy's flagship event at the Conservatorium of Music on 24 October. Three of our events have sold out this year and a Hunter high schooler will win a place on the main stage, so there are a few good local angles in this one.

Full release below. Happy to set up interviews or send photography.

Best,
Jake Hoppe
Director, TEDxNewy · 0431 814 227

----------------------------------------

`;
}
