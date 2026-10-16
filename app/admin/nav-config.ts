/**
 * Single source of truth for the admin navigation.
 *
 * The rail (AdminShell) shows the workspaces; inside a workspace a horizontal
 * tab bar shows its pages. Home and the workspace landing pages read the same
 * list. Icons are stored as plain strings so this stays a data-only module.
 *
 * A workspace either has its own overview page (`/admin/w/<key>`, shown as the
 * first tab) or lands straight on its first page (`overview: false`).
 */

export type NavStatus = "live" | "soon";

export type NavItem = {
  href: string;
  label: string;
  description?: string;
  iconName: string;
  exact?: boolean;
  /** Extra path prefixes that also count as "this item is active". */
  also?: string[];
  status?: NavStatus;
  /** One line shown on the workspace's overview card. */
  blurb?: string;
  tool?: boolean;
};

export type NavGroup = {
  /** Workspace key, used in /admin/w/<key> and to mark the active rail item. */
  key: string;
  /** Workspace name shown in the rail. */
  heading: string;
  /** Design-system icon name for the rail. */
  icon: string;
  /** Where the rail item goes. */
  href: string;
  /** One line shown on the workspace card on Home. */
  blurb: string;
  /** True when `href` is a dashboard page of its own (first tab "Overview"). */
  overview: boolean;
  items: NavItem[];
};

const item = (
  href: string,
  label: string,
  blurb: string,
  extra: Partial<NavItem> = {},
): NavItem => ({ href, label, iconName: "", status: "live", blurb, ...extra });

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "home",
    heading: "Home",
    icon: "home",
    href: "/admin",
    blurb: "What needs you today.",
    overview: false,
    items: [item("/admin", "Dashboard", "Today's numbers.", { exact: true })],
  },
  {
    key: "events",
    heading: "Events",
    icon: "calendar-days",
    href: "/admin/events",
    blurb: "What each event gathered, tickets, talks and speakers.",
    overview: false,
    items: [
      item("/admin/events", "Events", "Submissions, attendees, feedback and demographics for every event."),
      item("/admin/tickets", "Tickets", "Live ticket sales."),
      item("/admin/talks", "Talks and speakers", "The talk archive and the speaker bios.", {
        also: ["/admin/speakers"],
      }),
      item("/admin/side-quest", "Side Quest", "The Signal intermission game."),
    ],
  },
  {
    key: "comms",
    heading: "Comms",
    icon: "megaphone",
    href: "/admin/w/comms",
    blurb: "Email, newsletter, socials, the calendar and media contacts.",
    overview: true,
    items: [
      item("/admin/emails", "Quick email", "A one-off branded email to anyone.", { tool: true }),
      item("/admin/newsletter", "Newsletter", "Campaigns, subscribers and the welcome flow.", {
        also: ["/admin/subscribers", "/admin/subscriber-flow"],
        tool: true,
      }),
      item("/admin/socials", "Socials", "Draft, schedule and publish posts.", { tool: true }),
      item("/admin/calendar", "Calendar", "Four weeks of what is going out.", { tool: true }),
      item("/admin/media", "Media list", "Newcastle journalists to pitch.", { tool: true }),
    ],
  },
  {
    key: "partners",
    heading: "Partners",
    icon: "handshake",
    href: "/admin/sponsorship",
    blurb: "What each partner has pledged, and the sponsor roster.",
    overview: false,
    items: [
      item("/admin/sponsorship", "Tracker", "Pledges and progress to the year's goal."),
      item("/admin/sponsors", "Sponsors", "The partner roster and logos."),
    ],
  },
  {
    key: "inbox",
    heading: "Inbox",
    icon: "inbox",
    href: "/admin/forms",
    blurb: "Every form submission in one place.",
    overview: false,
    items: [item("/admin/forms", "Forms", "All submissions.")],
  },
  {
    key: "library",
    heading: "Library",
    icon: "folder",
    href: "/admin/w/library",
    blurb: "Brand hub, images and documents.",
    overview: true,
    items: [
      item("/admin/brand", "Brand hub", "Logos, templates and the studio.", { tool: true }),
      item("/admin/images", "Images", "Every photo on the site.", { tool: true }),
      item("/admin/documents", "Documents", "Files with a public link."),
    ],
  },
  {
    key: "settings",
    heading: "Settings",
    icon: "settings",
    href: "/admin/admins",
    blurb: "Access passwords, the team page and notifications.",
    overview: false,
    items: [
      item("/admin/admins", "Access", "Who can sign in and what they can see."),
      item("/admin/team", "Team", "The public team page."),
      item("/admin/notifications", "Notifications", "Who is emailed when a form comes in."),
    ],
  },
];

/** Everything except Settings: the six workspaces in the rail. */
export const WORKSPACES = NAV_GROUPS.filter((g) => g.key !== "settings");

/** The workspace a path belongs to (null for /admin itself or an unknown path). */
export function workspaceForPath(path: string): NavGroup | null {
  if (path === "/admin") return NAV_GROUPS[0];
  let best: NavGroup | null = null;
  let bestLen = -1;
  for (const g of NAV_GROUPS) {
    if (g.key === "home") continue;
    const prefixes = [
      ...(g.overview ? [g.href] : []),
      ...g.items.flatMap((i) => [i.href, ...(i.also ?? [])]),
      `/admin/w/${g.key}`,
    ];
    for (const p of prefixes) {
      if ((path === p || path.startsWith(p + "/")) && p.length > bestLen) {
        best = g;
        bestLen = p.length;
      }
    }
  }
  return best;
}
