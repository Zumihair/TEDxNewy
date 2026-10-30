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

const ICONS: Record<string, string> = {"/admin":"home","/admin/events":"calendar-days","/admin/tickets":"ticket","/admin/talks":"video","/admin/side-quest":"star","/admin/emails":"send","/admin/newsletter":"mail","/admin/socials":"share-2","/admin/calendar":"calendar","/admin/media":"newspaper","/admin/sponsorship":"trending-up","/admin/sponsors":"handshake","/admin/grants":"landmark","/admin/grants/library":"file-text","/admin/forms":"inbox","/admin/volunteer-roles":"users","/admin/brand":"palette","/admin/brand/templates":"layout-grid","/admin/images":"image","/admin/documents":"file-text","/admin/access":"lock","/admin/team":"users","/admin/notifications":"bell","/admin/subscribers":"users","/admin/subscriber-flow":"sparkles","/admin/people":"users","/admin/analytics":"bar-chart-3"};

const item = (
  href: string,
  label: string,
  blurb: string,
  extra: Partial<NavItem> = {},
): NavItem => ({ href, label, iconName: ICONS[href] ?? "layers", status: "live", blurb, ...extra });

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
    ],
  },
  {
    key: "comms",
    heading: "Comms",
    icon: "megaphone",
    href: "/admin/w/comms",
    blurb: "Email, newsletter, socials, the calendar, people and the website.",
    overview: true,
    items: [
      item("/admin/calendar", "Calendar", "Four weeks of what is going out.", { tool: true }),
      item("/admin/socials", "Socials", "Draft, schedule and publish posts.", { tool: true }),
      item("/admin/emails", "Quick email", "A one-off branded email to anyone.", { tool: true }),
      item("/admin/newsletter", "Newsletter", "Draft, schedule and review every campaign.", {
        also: ["/admin/newsletter"],
        tool: true,
      }),
      item("/admin/subscriber-flow", "Welcome flow", "The emails new subscribers get, step by step.", { tool: true }),
      item("/admin/subscribers", "Subscribers", "Everyone on the list, with search and export.", { tool: true }),
      item("/admin/people", "People", "Everyone we know: their events, emails and forms, in one record.", { tool: true }),
      item("/admin/media", "Media list", "Newcastle journalists to pitch.", { tool: true }),
      item("/admin/analytics", "Website", "Traffic, ticket clicks and sign-ups beside the pages that drove them.", { tool: true }),
    ],
  },
  {
    key: "partners",
    heading: "Partners",
    icon: "handshake",
    href: "/admin/sponsorship",
    blurb: "What each partner has pledged, the grants we're chasing, and the sponsor roster.",
    overview: false,
    items: [
      item("/admin/sponsorship", "Tracker", "Pledges and progress to the year's goal."),
      item("/admin/grants", "Grants", "Every grant we're watching, writing or waiting to hear on."),
      item("/admin/grants/library", "Letters and files", "Reference letters and the files every application asks for."),
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
    items: [
      item("/admin/forms", "Forms", "All submissions."),
      item("/admin/volunteer-roles", "Volunteer roles", "Post, edit and close the roles on /volunteer."),
    ],
  },
  {
    key: "library",
    heading: "Resources",
    icon: "folder",
    href: "/admin/w/resources",
    blurb: "Logos and branding, templates, event images and documents.",
    overview: true,
    items: [
      item("/admin/brand", "Logos and branding", "Logos, colours, fonts and the lines we copy again and again.", { tool: true, exact: true }),
      item("/admin/brand/templates", "Templates", "Letterhead, minutes, business cards, signatures, banners and more.", { tool: true }),
      item("/admin/images", "Images", "Every photo from our events.", { tool: true }),
      item("/admin/documents", "Documents", "Files with a public link."),
    ],
  },
  {
    key: "settings",
    heading: "Settings",
    icon: "settings",
    href: "/admin/access",
    blurb: "Access passwords, the team page and notifications.",
    overview: false,
    items: [
      item("/admin/access", "Access", "Who can sign in and what they can see."),
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
      // Resources kept the stored key `library`; its address is /admin/w/resources.
      ...(g.key === "library" ? ["/admin/w/resources"] : []),
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
