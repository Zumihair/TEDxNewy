const NAV_GROUPS = [
  { heading: "Overview", items: [
    { href: "/admin", label: "Dashboard", iconName: "LayoutDashboard", section: "grey" },
    { href: "/admin/forms", label: "Forms", iconName: "Inbox", section: "grey" },
  ]},
  { heading: "Content", items: [
    { href: "/admin/events", label: "Events", iconName: "CalendarDays", section: "yellow" },
    { href: "/admin/talks", label: "Talks", iconName: "Film", section: "yellow" },
    { href: "/admin/speakers", label: "Speakers", iconName: "Users", section: "yellow" },
    { href: "/admin/team", label: "Team", iconName: "UserCircle", section: "yellow" },
    { href: "/admin/sponsors", label: "Sponsors", iconName: "Building2", section: "yellow" },
  ]},
  { heading: "Management", items: [
    { href: "/admin/partners", label: "Partners", iconName: "Handshake", section: "coast" },
    { href: "/admin/media", label: "Media", iconName: "Megaphone", section: "coast" },
    { href: "/admin/tickets", label: "Tickets", iconName: "Ticket", section: "coast" },
    { href: "/admin/documents", label: "Documents", iconName: "FolderOpen", section: "coast" },
  ]},
  { heading: "Community", items: [
    { href: "/admin/emails", label: "Quick email", iconName: "Send", section: "red" },
    { href: "/admin/calendar", label: "Calendar", iconName: "CalendarRange", section: "red" },
    { href: "/admin/socials", label: "Socials", iconName: "Share2", section: "red" },
    { href: "/admin/newsletter", label: "Newsletter", iconName: "Newspaper", section: "red" },
  ]},
  { heading: "Settings", items: [
    { href: "/admin/notifications", label: "Notifications", iconName: "Bell", section: "green" },
    { href: "/admin/admins", label: "Admins", iconName: "ShieldCheck", section: "green" },
  ]},
];

const FORMS = [
  { label: "Youth futures", count: 41 },
  { label: "Student speaker", count: 18 },
  { label: "Nominations", count: 27 },
  { label: "Volunteers", count: 33 },
  { label: "Sponsors", count: 9 },
  { label: "Contact", count: 62 },
];

window.NAV_GROUPS = NAV_GROUPS;
window.FORMS = FORMS;
