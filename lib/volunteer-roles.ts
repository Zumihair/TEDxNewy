import { getSupabase } from "@/lib/supabase";
import { parseQuestions, type RoleQuestion } from "@/lib/volunteer-questions";

/**
 * Volunteer roles shown on /volunteer under "Open roles".
 *
 * Posted roles live in `volunteer_roles` (migration
 * `20261029b_volunteer_roles.sql`) and are written at /admin/volunteer-roles;
 * only `status = 'open'` rows are public. The general expression of interest,
 * `GENERAL_ROLE`, is fixed here and always comes first, so the page and the
 * form still work with nothing posted or with the database unreachable.
 *
 * With one role the page shows it as a single feature card; with two or more
 * it becomes a list beside a detail panel, and a crew filter appears once
 * there are four or more roles spanning more than one crew.
 *
 * Each posted role has its own page and application form at
 * `/volunteer/roles/<slug>` (the shareable link), built from the role's own
 * `questions` (lib/volunteer-questions.ts). The general role applies through
 * the fixed form at the foot of /volunteer. Both POST /api/volunteer, which
 * stores the role's title in `applications.role` and a role form's answers in
 * `applications.answers`.
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
  /** The role's own application form. Empty for the general role. */
  questions: RoleQuestion[];
  /** True only for GENERAL_ROLE, which applies on /volunteer, not a page of its own. */
  general?: boolean;
};

export const GENERAL_ROLE: VolunteerRole = {
  general: true,
  slug: "join-the-crew",
  questions: [],
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
};

export type VolunteerRoleRow = {
  id: string;
  slug: string;
  title: string;
  crew: string;
  time_commitment: string;
  location: string;
  summary: string;
  does: string[] | null;
  helps: string[] | null;
  /** jsonb; always read through parseQuestions. `apply_question` (retired) is still on the row. */
  questions: unknown;
  status: "open" | "draft" | "closed";
  display_order: number;
  created_at: string;
  updated_at: string;
};

export function rowToRole(r: VolunteerRoleRow): VolunteerRole {
  return {
    slug: r.slug,
    title: r.title,
    crew: r.crew,
    time: r.time_commitment,
    where: r.location,
    summary: r.summary,
    does: r.does ?? [],
    helps: r.helps?.length ? r.helps : undefined,
    questions: parseQuestions(r.questions),
  };
}

/** The general role, then every open posted role. Never throws. */
export async function getVolunteerRoles(): Promise<VolunteerRole[]> {
  try {
    const { data, error } = await getSupabase()
      .from("volunteer_roles")
      .select("*")
      .eq("status", "open")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return [GENERAL_ROLE, ...((data ?? []) as VolunteerRoleRow[]).map(rowToRole)];
  } catch (e) {
    console.error("[volunteer-roles] falling back to the general role", e);
    return [GENERAL_ROLE];
  }
}

/** One open posted role by slug, or null (not found, not open, or database down). */
export async function getVolunteerRole(slug: string): Promise<VolunteerRole | null> {
  try {
    const { data, error } = await getSupabase()
      .from("volunteer_roles")
      .select("*")
      .eq("slug", slug)
      .eq("status", "open")
      .maybeSingle();
    if (error) throw error;
    return data ? rowToRole(data as VolunteerRoleRow) : null;
  } catch (e) {
    console.error("[volunteer-roles] role lookup failed", e);
    return null;
  }
}

/** The role a slug names among `roles`, or the general one if none matches. */
export function volunteerRoleFor(
  roles: VolunteerRole[],
  slug: string | null | undefined,
): VolunteerRole {
  return roles.find((r) => r.slug === slug) ?? GENERAL_ROLE;
}
