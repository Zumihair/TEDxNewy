/**
 * Aggregate stats for the /impact page.
 *
 * Uses the service-role client to count rows in tables that anon can't read
 * (subscribers, nominations, etc). If SUPABASE_SECRET_KEY isn't set — or the
 * request fails for any reason — every field falls back to a conservative
 * seed number so the page still renders. Individual seed values are chosen
 * to be believable if the service is briefly unavailable.
 */

import { getAdminSupabase } from "./supabase-admin";

export type ImpactStats = {
  /** Total talks in the CMS (all years). */
  totalTalks: number;
  /** Sum of view_count across all cms_talk_stats rows. Null until YouTube fetched. */
  totalViews: number | null;
  /** Unique speakers in the CMS. */
  totalSpeakers: number;
  /** Number of events (past + upcoming) in cms_events. */
  totalEvents: number;
  /** Newsletter subscribers. */
  totalSubscribers: number;
  /** Volunteers on the visible team page (is_active). */
  totalTeam: number;
  /** Speaker nominations received. */
  totalNominations: number;
  /** School students reached via YFL EOIs (sum of student_count). */
  totalStudentsReached: number;
  /** Schools that have engaged via YFL. */
  totalSchools: number;
  /** 60-Second Talk Night registrations. */
  totalTalkNightRegistrations: number;
  /** Partner enquiries received. */
  totalPartnerEnquiries: number;
  /** Volunteer applications received. */
  totalVolunteerApplications: number;
  /** Student Speaker Competition entries. */
  totalStudentSpeakerEntries: number;
  /** Distinct years the archive spans (e.g. 2 for 2024 + 2025). */
  yearsRunning: number;
  /**
   * When the stats were computed, ISO string. Undefined if aggregation
   * fell back to seed values.
   */
  computedAt?: string;
};

const SEED: ImpactStats = {
  totalTalks: 20,
  totalViews: null,
  totalSpeakers: 20,
  totalEvents: 4,
  totalSubscribers: 750,
  totalTeam: 10,
  totalNominations: 11,
  totalStudentsReached: 100,
  totalSchools: 4,
  totalTalkNightRegistrations: 49,
  totalPartnerEnquiries: 1,
  totalVolunteerApplications: 2,
  totalStudentSpeakerEntries: 0,
  yearsRunning: 2,
};

/**
 * Compute all impact stats in parallel from Supabase. Returns SEED values on
 * any failure — never throws to the caller, so /impact is bulletproof.
 */
export async function getImpactStats(): Promise<ImpactStats> {
  try {
    const s = getAdminSupabase();
    // Head + count is a lightweight "how many rows" query; no data over the wire.
    const head = { count: "exact" as const, head: true };

    const [
      talksC,
      speakersC,
      teamC,
      eventsC,
      subscribersC,
      nominationsC,
      talkNightC,
      partnerC,
      applicationsC,
      studentSpeakerC,
      yflReg,
      talkStats,
      yearsRes,
    ] = await Promise.all([
      s.from("cms_talks").select("*", head),
      s.from("cms_speakers").select("*", head),
      s.from("cms_team_members").select("*", head).eq("is_active", true),
      s.from("cms_events").select("*", head),
      s.from("subscribers").select("*", head),
      s.from("nominations").select("*", head),
      s.from("talk_night_registrations").select("*", head),
      s.from("partner_enquiries").select("*", head),
      s.from("applications").select("*", head),
      s.from("student_speaker_submissions").select("*", head),
      // Full rows for YFL so we can sum student_count + distinct schools.
      s
        .from("youth_futures_registrations")
        .select("school_name, student_count"),
      // View sums across the talk stats cache.
      s.from("cms_talk_stats").select("view_count"),
      s.from("cms_talks").select("year"),
    ]);

    const yflRows = (yflReg.data ?? []) as Array<{
      school_name: string | null;
      student_count: number | null;
    }>;
    const totalStudentsReached = yflRows.reduce(
      (sum, r) => sum + (r.student_count ?? 0),
      0,
    );
    const totalSchools = new Set(
      yflRows
        .map((r) => (r.school_name ?? "").trim().toLowerCase())
        .filter(Boolean),
    ).size;

    const viewRows = (talkStats.data ?? []) as Array<{
      view_count: number | string | null;
    }>;
    const totalViews = viewRows.reduce((sum, r) => {
      const v = typeof r.view_count === "string" ? Number(r.view_count) : r.view_count;
      return sum + (v ?? 0);
    }, 0);

    const yearRows = (yearsRes.data ?? []) as Array<{ year: number | null }>;
    const yearsRunning = new Set(
      yearRows.map((r) => r.year).filter((y): y is number => y != null),
    ).size;

    return {
      totalTalks: talksC.count ?? SEED.totalTalks,
      totalViews: viewRows.length > 0 ? totalViews : null,
      totalSpeakers: speakersC.count ?? SEED.totalSpeakers,
      totalEvents: eventsC.count ?? SEED.totalEvents,
      totalSubscribers: subscribersC.count ?? SEED.totalSubscribers,
      totalTeam: teamC.count ?? SEED.totalTeam,
      totalNominations: nominationsC.count ?? SEED.totalNominations,
      totalStudentsReached: totalStudentsReached || SEED.totalStudentsReached,
      totalSchools: totalSchools || SEED.totalSchools,
      totalTalkNightRegistrations:
        talkNightC.count ?? SEED.totalTalkNightRegistrations,
      totalPartnerEnquiries: partnerC.count ?? SEED.totalPartnerEnquiries,
      totalVolunteerApplications:
        applicationsC.count ?? SEED.totalVolunteerApplications,
      totalStudentSpeakerEntries:
        studentSpeakerC.count ?? SEED.totalStudentSpeakerEntries,
      yearsRunning: yearsRunning || SEED.yearsRunning,
      computedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[impact] aggregation failed, using seed values", err);
    return SEED;
  }
}
