/**
 * Single source of truth for the admin navigation.
 *
 * Both the sidebar (AdminShell) and the dashboard (page.tsx) read from this.
 * Icons are stored as plain strings (e.g. "LayoutDashboard") so this stays a
 * data-only module with no JSX or component imports; each consumer maps the
 * name to a lucide-react component with its own styling.
 *
 * Fields:
 *  - description: short right-side hint shown in the sidebar
 *  - blurb: longer sentence shown on the dashboard's Manage cards
 *  - countKey: which live count the dashboard card should show
 *  - tool: dashboard card is a tool (shows an open arrow, not a count)
 */

export type NavStatus = "live" | "soon";

export type NavItem = {
  href: string;
  label: string;
  description?: string;
  iconName: string;
  exact?: boolean;
  /** Extra path prefixes that also count as "this item is active" (for hub
   *  sub-pages that live outside the hub's own route). */
  also?: string[];
  status?: NavStatus;
  /** Dashboard card blurb. */
  blurb?: string;
  /** Which live count the dashboard shows for this card. */
  countKey?: string;
  /** Dashboard card is a tool (open affordance instead of a count). */
  tool?: boolean;
};

export type NavGroup = {
  /** Workspace key, used in /admin/w/<key> and to mark the active rail item. */
  key: string;
  /** Workspace name shown in the rail ("Home", "Events", "Comms", ...). */
  heading: string;
  /** Design-system icon name for the rail. */
  icon: string;
  /** Where the rail item goes: the workspace hub (Home is the dashboard). */
  href: string;
  /** One line shown on the workspace card on Home. */
  blurb: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "home",
    heading: "Home",
    icon: "home",
    href: "/admin",
    blurb: "What needs you today: tickets, subscribers, the inbox.",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        iconName: "LayoutDashboard",
        exact: true,
        status: "live",
      },
    ],
  },
  {
    key: "events",
    heading: "Events",
    icon: "calendar-days",
    href: "/admin/w/events",
    blurb: "Events, tickets, talks, speakers and the Side Quest game.",
    items: [
      {
        href: "/admin/events",
        label: "Events",
        description: "/events",
        iconName: "CalendarDays",
        status: "live",
        blurb:
          "Create and edit events. Drives the header menu, /events and the home page.",
        countKey: "events",
      },
      {
        href: "/admin/tickets",
        label: "Tickets",
        description: "Live Humanitix sales",
        iconName: "Ticket",
        status: "live",
        blurb:
          "Live ticket sales from Humanitix: sold, revenue and momentum per event, plus one-click attendee import for feedback surveys.",
        tool: true,
      },
      {
        href: "/admin/talks",
        label: "Talks",
        description: "/talks",
        iconName: "Film",
        status: "live",
        blurb: "Add, edit and reorder past TEDxNewy talks. Drives /talks.",
        countKey: "talks",
      },
      {
        href: "/admin/speakers",
        label: "Speakers",
        description: "/speakers",
        iconName: "Users",
        status: "live",
        blurb:
          "Curate the speaker lineup year by year: bios, talks, portraits. Drives /speakers.",
        countKey: "speakers",
      },
      {
        href: "/admin/side-quest",
        label: "Side Quest",
        description: "Intermission game",
        iconName: "Sparkles",
        status: "live",
        blurb:
          "The Signal intermission game: scores, the prize draw list, the photo wall and the quest editor.",
        tool: true,
      },
    ],
  },
  {
    key: "comms",
    heading: "Comms",
    icon: "megaphone",
    href: "/admin/w/comms",
    blurb: "Email, newsletter, socials, the calendar and media.",
    items: [
      {
        href: "/admin/emails",
        label: "Quick email",
        description: "Ad-hoc email",
        iconName: "Send",
        status: "live",
        blurb:
          "Compose a one-off branded email to any list of recipients, or a saved audience.",
        tool: true,
      },
      {
        href: "/admin/newsletter",
        label: "Newsletter",
        description: "Campaigns + list",
        iconName: "Newspaper",
        also: ["/admin/subscribers", "/admin/subscriber-flow"],
        status: "live",
        blurb:
          "One hub for subscriber email: campaigns, the subscriber list, and the welcome flow.",
        tool: true,
      },
      {
        href: "/admin/socials",
        label: "Socials",
        description: "Draft, schedule, publish",
        iconName: "Share2",
        status: "live",
        blurb:
          "Draft, design and approve posts for Instagram, Facebook and LinkedIn, then publish straight from here on any channel connected via Buffer.",
        tool: true,
      },
      {
        href: "/admin/calendar",
        label: "Calendar",
        description: "What's going out when",
        iconName: "CalendarRange",
        status: "live",
        blurb:
          "Four weeks at a glance: scheduled social posts, newsletters and the events they line up against.",
        tool: true,
      },
      {
        href: "/admin/media",
        label: "Media",
        description: "Journalists + release",
        iconName: "Megaphone",
        status: "live",
        blurb:
          "Newcastle journalist contacts sourced via Apollo, and the Signal media release ready to pitch.",
        tool: true,
      },
    ],
  },
  {
    key: "partners",
    heading: "Partners",
    icon: "handshake",
    href: "/admin/w/partners",
    blurb: "The partner pipeline and sponsor roster.",
    items: [
      {
        href: "/admin/partners",
        label: "Partners",
        description: "Prospects + outreach",
        iconName: "Handshake",
        status: "live",
        blurb:
          "The partner pipeline: prospects, outreach emails, and per-partner prospectus PDFs.",
        countKey: "partners",
      },
      {
        href: "/admin/sponsors",
        label: "Sponsors",
        description: "/sponsors",
        iconName: "Building2",
        status: "live",
        blurb: "Partner roster and logos. Drives /sponsors and the Signal sponsor teaser.",
        countKey: "sponsors",
      },
    ],
  },
  {
    key: "inbox",
    heading: "Inbox",
    icon: "inbox",
    href: "/admin/w/inbox",
    blurb: "Every form submission in one place.",
    items: [
      {
        href: "/admin/forms",
        label: "Forms",
        description: "All submissions",
        iconName: "Inbox",
        status: "live",
      },
    ],
  },
  {
    key: "library",
    heading: "Library",
    icon: "folder",
    href: "/admin/w/library",
    blurb: "Documents to share and the team page.",
    items: [
      {
        href: "/admin/documents",
        label: "Documents",
        description: "PDFs to share",
        iconName: "FolderOpen",
        status: "live",
        blurb:
          "Impact reports, decks and other files, each with a public download link.",
        countKey: "documents",
      },
      {
        href: "/admin/team",
        label: "Team",
        description: "/team",
        iconName: "UserCircle",
        status: "live",
        blurb: "Organisers, curators and crew on the public /team page.",
        countKey: "team",
      },
    ],
  },
  {
    key: "settings",
    heading: "Settings",
    icon: "settings",
    href: "/admin/w/settings",
    blurb: "Notification recipients and who can sign in.",
    items: [
      {
        href: "/admin/notifications",
        label: "Notifications",
        description: "Email recipients",
        iconName: "Bell",
        status: "live",
        blurb: "Who gets emailed when each form comes in.",
        countKey: "recipients",
      },
      {
        href: "/admin/admins",
        label: "Admins",
        description: "Sign-in allowlist",
        iconName: "ShieldCheck",
        status: "live",
        blurb: "Manage the email allowlist that can sign in to this CMS.",
        countKey: "admins",
      },
    ],
  },
];

/** Everything except Settings: the six workspaces in the rail. */
export const WORKSPACES = NAV_GROUPS.filter((g) => g.key !== "settings");
