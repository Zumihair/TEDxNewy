/**
 * Volunteer roles shown on /volunteer under "Open roles".
 *
 * Kept in code for now (2026-10-29): there is only a general expression of
 * interest until the 2027 roles are written. To post a role, add an entry
 * here. With one role the page shows it as a single feature card; with two or
 * more it becomes a list beside a detail panel, and a crew filter appears once
 * there are four or more roles spanning more than one crew.
 *
 * Every role applies through the same form at #apply (POST /api/volunteer).
 * The form's role picker lists these, "Apply now" on a role links to
 * `?role=<slug>#apply` to preselect it, and the route stores the role's title
 * in `applications.role` (migration `20261029_application_role.sql`). The
 * first entry is the general expression of interest and the default.
 */
export type VolunteerRole = {
  slug: string;
  title: string;
  crew: string;
  time: string;
  where: string;
  summary: string;
  does: string[];
  /** Optional "What helps" list: skills or experience that suit the role. */
  helps?: string[];
};

export const VOLUNTEER_ROLES: VolunteerRole[] = [
  {
    slug: "join-the-crew",
    title: "Join the crew",
    crew: "Any crew",
    time: "From one event day to a few hours a week",
    where: "Newcastle",
    summary:
      "Not sure where you fit? Tell us a little about yourself and what you enjoy, and we'll find the right role with you.",
    does: [
      "Help bring an event to life, from doors and check-in to the stage and foyer",
      "Lend a skill you already have: design, photos, video, writing, coaching, production or partnerships",
      "Grow into a bigger role over the season, if you want to",
    ],
  },
  {
    slug: "partnerships-manager",
    title: "Partnerships manager",
    crew: "Partnerships",
    time: "A few hours a week",
    where: "Newcastle and online",
    summary:
      "Our events only happen because local businesses and organisations back them. Look after those relationships across the 2027 season, from the first conversation to the thank-you after the event.",
    does: [
      "Find and reach out to businesses and organisations that share our values",
      "Meet potential partners, talk through what a partnership could look like and follow up",
      "Look after current partners through the season so they get what was agreed, and then some",
      "Work with the directors on partnership packages and keep the pipeline moving",
      "Help partners show up well on the day, from logos and signage to activations",
    ],
    helps: [
      "Experience in sales, business development, account management or events",
      "Confidence picking up the phone and walking into a room",
      "A good feel for Newcastle's business community",
      "Being organised: you keep track of who said what and when",
    ],
  },
];

/** The role a form submission names, or the general one if it names none. */
export function volunteerRoleFor(slug: string | null | undefined): VolunteerRole {
  return VOLUNTEER_ROLES.find((r) => r.slug === slug) ?? VOLUNTEER_ROLES[0];
}
