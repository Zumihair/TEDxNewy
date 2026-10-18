/** The brand hub's templates. Each opens at /admin/brand/templates/<slug>. */
export type TemplateKind = "page" | "studio" | "deck";
export type TemplateMeta = {
  slug: string;
  title: string;
  blurb: string;
  group: "documents" | "digital" | "event";
  icon: string;
  kind: TemplateKind;
  /** For kind "studio": which generator to open. */
  studio?: "vbg" | "banner" | "signature";
};

export const TEMPLATE_GROUPS = [
  { key: "documents", title: "Documents", blurb: "Everyday paperwork with the logo, type and colours already set." },
  { key: "digital", title: "Digital", blurb: "Things you use on screen: signatures, banners, backgrounds and slides." },
  { key: "event", title: "Event kit", blurb: "Signs for the day itself." },
] as const;

export const TEMPLATES: TemplateMeta[] = [
  { slug: "letterhead", title: "Letterhead", blurb: "A4 letter with the lockup, company details and licence line.", group: "documents", icon: "file-text", kind: "page" },
  { slug: "minutes", title: "Minutes", blurb: "Meeting minutes with attendees, decisions and actions.", group: "documents", icon: "pencil", kind: "page" },
  { slug: "agenda", title: "Agenda", blurb: "A timed agenda for any meeting.", group: "documents", icon: "list", kind: "page" },
  { slug: "business-card", title: "Business card", blurb: "90 by 55 mm, front and back, eight to a sheet.", group: "documents", icon: "credit-card", kind: "page" },
  { slug: "email-signature", title: "Email signature", blurb: "Your own signature, filled in from your team profile and ready to copy.", group: "digital", icon: "mail", kind: "studio", studio: "signature" },
  { slug: "social-banners", title: "Social banners", blurb: "Cover images for LinkedIn and Facebook.", group: "digital", icon: "image", kind: "studio", studio: "banner" },
  { slug: "virtual-background", title: "Virtual background", blurb: "1920 by 1080 for video calls.", group: "digital", icon: "video", kind: "studio", studio: "vbg" },
  { slug: "powerpoint-deck", title: "PowerPoint deck", blurb: "Nine slides for presenting on behalf of TEDxNewy.", group: "digital", icon: "presentation", kind: "deck" },
  { slug: "signage", title: "Signage", blurb: "A3 sign with a turnable arrow in white, red or black.", group: "event", icon: "map-pin", kind: "page" },
];

export const findTemplate = (slug: string) => TEMPLATES.find((t) => t.slug === slug);
export const hasTemplate = (slug: string) => TEMPLATES.some((t) => t.slug === slug);
