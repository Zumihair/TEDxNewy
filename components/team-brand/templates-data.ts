/** The brand hub's print-ready templates. Each opens at /admin/brand/templates/<slug>. */
export type TemplateMeta = { slug: string; title: string; blurb: string; group: "stationery" | "event"; icon: string };

export const TEMPLATE_GROUPS = [
  { key: "stationery", title: "Stationery", blurb: "Everyday documents with the logo, type and colours already set." },
  { key: "event", title: "Event kit", blurb: "Run sheets, briefs and signage for the day itself." },
] as const;

export const TEMPLATES: TemplateMeta[] = [
  { slug: "letterhead", title: "Letterhead", blurb: "A4 letter with the lockup, address and licence line.", group: "stationery", icon: "file-text" },
  { slug: "name-badges", title: "Name badges", blurb: "Six to a page: name, role and event.", group: "stationery", icon: "user" },
  { slug: "run-sheet", title: "Run sheet", blurb: "Minute-by-minute schedule for the day.", group: "event", icon: "clock" },
  { slug: "speaker-brief", title: "Speaker brief", blurb: "What a speaker needs to know before the stage.", group: "event", icon: "mic" },
  { slug: "volunteer-briefing", title: "Volunteer briefing", blurb: "Roles, call times and who to ask.", group: "event", icon: "users" },
  { slug: "signage", title: "Signage", blurb: "A3 sign for doors, rooms and directions.", group: "event", icon: "map-pin" },
];

export const hasTemplate = (slug: string) => TEMPLATES.some((t) => t.slug === slug);
