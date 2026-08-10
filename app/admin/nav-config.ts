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
  heading: string;
  items: NavItem[];
  /** Render the heading as a toggle that starts collapsed. */
  collapsible?: boolean;
};

export const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        iconName: "LayoutDashboard",
        exact: true,
        status: "live",
      },
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
    heading: "Content",
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
    heading: "Community",
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
    ],
  },
  {
    heading: "Settings",
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
