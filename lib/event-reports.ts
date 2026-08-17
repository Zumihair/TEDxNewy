import "server-only";

import { getServerSupabase } from "./supabase-server";
import { getEventAttendees, getEventFeedback } from "./event-feedback";
import type { FeedbackResponse } from "./event-feedback";
import {
  getPhotosForEvent,
  getSpeakersForEvent,
  getSponsors,
  getTalksForEvent,
  type EventPhoto,
} from "./cms-content";
import {
  importedFeedbackForSlug,
  type ImportedQuestion,
  type ImportedResponse,
} from "./imported-feedback";
import { summarizeFeedback, type QuestionSummary } from "./feedback-summary";
import {
  blankConfig,
  parseConfig,
  emptyStatement,
  type ReportConfig,
  type ReportKind,
  type ReportStat,
  type ReportStatus,
  type ReportTestimonial,
} from "./report-schema";

/**
 * Impact reports: storage plus the live-data snapshot that seeds a new one.
 *
 * Reports live in `event_reports` (migration `20260817b_event_reports.sql`),
 * read and written through the cookie-bound admin client so RLS applies.
 * The event data itself comes from the same readers the public site and the
 * feedback admin use, so the numbers on a report agree with the site.
 */

// ------------------------------------------------------------------
// Rows
// ------------------------------------------------------------------

export type EventReport = {
  id: string;
  eventId: string;
  title: string;
  kind: ReportKind;
  status: ReportStatus;
  config: ReportConfig;
  pdfUrl: string | null;
  pdfGeneratedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type ReportRow = {
  id: string;
  event_id: string;
  title: string;
  kind: string;
  status: string;
  config: unknown;
  pdf_url: string | null;
  pdf_generated_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function rowToReport(r: ReportRow): EventReport {
  return {
    id: r.id,
    eventId: r.event_id,
    title: r.title,
    kind: r.kind === "highlight" ? "highlight" : "overview",
    status: r.status === "final" ? "final" : "draft",
    config: parseConfig(r.config),
    pdfUrl: r.pdf_url,
    pdfGeneratedAt: r.pdf_generated_at,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export type ReportEvent = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  blurb: string | null;
  kind: string;
  status: string;
  dateLabel: string | null;
  venue: string | null;
  heroImageUrl: string | null;
  startsAt: string | null;
};

export async function getReportEvent(eventId: string): Promise<ReportEvent | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("cms_events")
    .select(
      "id, slug, title, tagline, blurb, kind, status, date_label, venue, hero_image_url, starts_at",
    )
    .eq("id", eventId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id as string,
    slug: data.slug as string,
    title: data.title as string,
    tagline: (data.tagline as string | null) ?? null,
    blurb: (data.blurb as string | null) ?? null,
    kind: data.kind as string,
    status: data.status as string,
    dateLabel: (data.date_label as string | null) ?? null,
    venue: (data.venue as string | null) ?? null,
    heroImageUrl: (data.hero_image_url as string | null) ?? null,
    startsAt: (data.starts_at as string | null) ?? null,
  };
}

/** Reports for one event, newest first. `null` means the table isn't there yet. */
export async function listReports(eventId: string): Promise<EventReport[] | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("event_reports")
    .select("*")
    .eq("event_id", eventId)
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("[event-reports] list", error);
    return null;
  }
  return (data as ReportRow[]).map(rowToReport);
}

export async function getReport(reportId: string): Promise<EventReport | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("event_reports")
    .select("*")
    .eq("id", reportId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToReport(data as ReportRow);
}

export async function createReport(input: {
  eventId: string;
  title: string;
  kind: ReportKind;
  config: ReportConfig;
  createdBy: string | null;
}): Promise<{ id: string } | { error: string }> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("event_reports")
    .insert({
      event_id: input.eventId,
      title: input.title,
      kind: input.kind,
      status: "draft",
      config: input.config,
      created_by: input.createdBy,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Could not create the report." };
  return { id: data.id as string };
}

export async function updateReport(
  reportId: string,
  patch: {
    title?: string;
    status?: ReportStatus;
    config?: ReportConfig;
    pdfUrl?: string | null;
    pdfGeneratedAt?: string | null;
  },
): Promise<string | null> {
  const supabase = await getServerSupabase();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.config !== undefined) row.config = patch.config;
  if (patch.pdfUrl !== undefined) row.pdf_url = patch.pdfUrl;
  if (patch.pdfGeneratedAt !== undefined) row.pdf_generated_at = patch.pdfGeneratedAt;
  const { error } = await supabase.from("event_reports").update(row).eq("id", reportId);
  return error ? error.message : null;
}

export async function deleteReport(reportId: string): Promise<string | null> {
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("event_reports").delete().eq("id", reportId);
  return error ? error.message : null;
}

// ------------------------------------------------------------------
// Live event data, used to seed a new report and to show the editor
// what it has to work with.
// ------------------------------------------------------------------

export type EventImpactData = {
  event: ReportEvent;
  photos: EventPhoto[];
  attendeeCount: number;
  speakerNames: string[];
  talkCount: number;
  /** Native responses (the platform's own feedback form). */
  responseCount: number;
  /** Rating / yes-no glance tiles ready to drop onto the numbers page. */
  feedbackStats: ReportStat[];
  /** Testimonials the attendee agreed we can quote. */
  testimonials: ReportTestimonial[];
  /** Imported (pre-platform) survey summary, if the archive has one. */
  imported: {
    title: string;
    responseCount: number;
    stats: ReportStat[];
    tedScore: { value: number; outOf?: number; label?: string } | null;
  } | null;
  partners: { name: string; label: string }[];
  computedAt: string;
};

// The native feedback form as questions, so its responses flow through the
// same summariser as the imported archives (mirrors the feedback admin page).
const NATIVE_QUESTIONS: ImportedQuestion[] = [
  { key: "overall", label: "Overall rating", type: "rating", max: 5 },
  { key: "been", label: "Been to TEDxNewy before", type: "boolean" },
  { key: "met", label: "Met someone new", type: "boolean" },
  { key: "ideas", label: "Left with new ideas", type: "boolean" },
  { key: "return", label: "Likelihood of returning", type: "choice" },
];

function toNativeResponses(responses: FeedbackResponse[]): ImportedResponse[] {
  return responses.map((r) => ({
    submittedAt: r.submittedAt,
    name: null,
    answers: {
      overall: r.overallRating,
      been: r.beenBefore,
      met: r.metSomeone,
      ideas: r.newIdeas,
      return: r.returnLikelihood,
    },
  }));
}

/** Turn glance summaries into short "value + label" tiles. */
function statsFromSummaries(summaries: QuestionSummary[]): ReportStat[] {
  const out: ReportStat[] = [];
  for (const s of summaries) {
    if (s.kind === "rating" && s.count > 0 && s.avg !== null) {
      out.push({
        value: `${s.avg.toFixed(1)}/${s.max}`,
        label: `${s.label.toLowerCase()}, from ${s.count} responses`,
      });
    } else if (s.kind === "boolean" && s.count > 0) {
      const pct = Math.round((s.yes / s.count) * 100);
      out.push({ value: `${pct}%`, label: s.label.toLowerCase() });
    } else if (s.kind === "choice" && s.count > 0 && s.options.length > 0) {
      const top = [...s.options].sort((a, b) => b.count - a.count)[0];
      const pct = Math.round((top.count / s.count) * 100);
      out.push({
        value: `${pct}%`,
        label: `said "${top.label.toLowerCase()}" for ${s.label.toLowerCase()}`,
      });
    }
  }
  return out;
}

export async function getEventImpactData(
  event: ReportEvent,
): Promise<EventImpactData> {
  const [photos, attendees, responses, speakers, talks, sponsors] =
    await Promise.all([
      getPhotosForEvent(event.id).catch(() => [] as EventPhoto[]),
      getEventAttendees(event.id).catch(() => []),
      getEventFeedback(event.id).catch(() => [] as FeedbackResponse[]),
      getSpeakersForEvent(event.id).catch(() => []),
      getTalksForEvent(event.id).catch(() => []),
      getSponsors().catch(() => []),
    ]);

  const native = summarizeFeedback(NATIVE_QUESTIONS, toNativeResponses(responses));
  const testimonials: ReportTestimonial[] = responses
    .filter((r) => r.testimonialConsent && r.testimonial && r.testimonial.trim())
    .map((r) => {
      const who = attendees.find((a) => a.id === r.attendeeId);
      return { text: r.testimonial!.trim(), name: who?.fullName ?? "" };
    });

  const archive = importedFeedbackForSlug(event.slug);
  const imported = archive
    ? {
        title: archive.title,
        responseCount: archive.responses.length,
        stats: statsFromSummaries(
          summarizeFeedback(archive.questions, archive.responses),
        ),
        tedScore: archive.tedScore ?? null,
      }
    : null;

  return {
    event,
    photos,
    attendeeCount: attendees.length,
    speakerNames: speakers.map((s) => s.name),
    talkCount: talks.length,
    responseCount: responses.length,
    feedbackStats: statsFromSummaries(native),
    testimonials,
    imported,
    partners: sponsors.map((s) => ({
      name: s.name,
      label: s.partnerType ?? `${s.tier} Partner`,
    })),
    computedAt: new Date().toISOString(),
  };
}

// ------------------------------------------------------------------
// Seed a config from the data. Editors then rewrite whatever they like.
// ------------------------------------------------------------------

const ACK =
  "TEDxNewy is staged on the land of the Awabakal and Worimi people. We pay our respects to Elders past, present and emerging. Sovereignty was never ceded. This independent TEDx event is operated under a free licence from TED.";

export { ACK as ACKNOWLEDGEMENT_TEXT };

export function seedConfig(data: EventImpactData, kind: ReportKind): ReportConfig {
  const c = blankConfig();
  const e = data.event;
  const year = e.startsAt ? new Date(e.startsAt).getFullYear() : new Date().getFullYear();
  const cover = data.photos[0]?.url ?? e.heroImageUrl ?? "";

  c.accent = kind === "highlight" ? "#17607a" : "#e02214";
  c.footerLabel = e.title;
  c.cover = {
    photoUrl: cover,
    stamp: kind === "highlight" ? `Highlights\nSeason ${year}` : `Impact report\nSeason ${year}`,
    kicker: [e.dateLabel, e.venue].filter(Boolean).join(" · "),
    title: e.title,
    lead: e.tagline ?? "",
  };

  const stats: ReportStat[] = [];
  if (data.attendeeCount > 0) stats.push({ value: String(data.attendeeCount), label: "people in the room" });
  if (data.speakerNames.length > 0) stats.push({ value: String(data.speakerNames.length), label: "speakers on stage" });
  if (data.talkCount > 0) stats.push({ value: String(data.talkCount), label: "talks now online" });
  if (data.photos.length > 0) stats.push({ value: String(data.photos.length), label: "photos in the gallery" });
  const fb = data.responseCount > 0 ? data.feedbackStats : data.imported?.stats ?? [];
  const fbCount = data.responseCount > 0 ? data.responseCount : data.imported?.responseCount ?? 0;
  if (fbCount > 0) stats.push({ value: String(fbCount), label: "feedback responses" });
  for (const s of fb.slice(0, 6 - stats.length)) stats.push(s);
  if (data.imported?.tedScore) {
    const t = data.imported.tedScore;
    stats.push({ value: t.outOf ? `${t.value}/${t.outOf}` : String(t.value), label: t.label ?? "TED score" });
  }
  c.numbers.stats = stats.slice(0, 6);
  c.numbers.note = e.blurb ? e.blurb.split("\n\n")[0] : "";

  c.photos.title = "Four ways the room shaped the night.";
  c.photos.items = data.photos.slice(0, 4).map((p) => ({ url: p.url, caption: "" }));

  const s1 = emptyStatement(0);
  s1.headline = "";
  s1.body = "";
  s1.photoUrl = data.photos[4]?.url ?? data.photos[1]?.url ?? "";
  const s2 = emptyStatement(1);
  const s3 = emptyStatement(2);
  c.statements = [s1, s2, s3];

  c.feedback.enabled = fb.length > 0 || data.testimonials.length > 0;
  c.feedback.title = "What the room told us afterwards.";
  c.feedback.stats = fb.slice(0, 4);
  c.feedback.testimonials = data.testimonials.slice(0, 3);

  c.close.title = "Volunteer-run, not-for-profit, and made possible by our partners.";
  c.close.body = "";
  c.close.partners = data.partners.slice(0, 4);
  c.close.nextText = "";
  c.close.linkLabel = "tedxnewy.com.au";
  c.close.linkUrl = `https://tedxnewy.com.au/events/${e.slug}`;

  return c;
}
