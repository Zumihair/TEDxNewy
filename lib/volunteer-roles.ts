/**
 * Volunteer roles shown on /volunteer under "Open roles".
 *
 * Kept in code for now (2026-10-29): there is only a general expression of
 * interest until the 2027 roles are written. To post a role, add an entry
 * here. With one role the page shows it as a single feature card; with two or
 * more it becomes a list beside a detail panel, and a crew filter appears once
 * the roles span more than one crew.
 *
 * Every role applies through the same form at #apply (POST /api/volunteer),
 * which has no role field yet. When specific roles go live, add a nullable
 * `role` column to `applications` and send the slug with the form.
 */
export type VolunteerRole = {
  slug: string;
  title: string;
  crew: string;
  time: string;
  where: string;
  summary: string;
  does: string[];
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
];
