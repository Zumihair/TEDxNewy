import { type NextRequest, NextResponse } from "next/server";
import { checkSubmission } from "@/lib/anti-spam";
import { recordFeedback } from "@/lib/event-feedback";

export const runtime = "nodejs";

function feedbackPath(slug: string, token: string, status?: string) {
  const q = new URLSearchParams({ t: token });
  if (status) q.set("status", status);
  return `/feedback/${encodeURIComponent(slug)}?${q.toString()}`;
}

export async function POST(req: NextRequest) {
  const data = Object.fromEntries(
    new URLSearchParams(await req.text()),
  ) as Record<string, string>;

  const token = String(data.token ?? "").trim();
  const slug = String(data.slug ?? "").trim() || "talk-night";

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url), 303);
  }

  // Bot filter: honeypot + timing come from SubmitLockForm; scan the free-text
  // answers for injected links. Tolerates missing fields, drops only on a real
  // signal.
  const { spam, reason } = checkSubmission(req, data, {
    textFields: ["highlight", "improve", "testimonial"],
  });
  if (spam) {
    console.warn("[event-feedback] dropped spam submission", { reason });
    // Silently treat as done so a bot gets no signal; no row is written.
    return NextResponse.redirect(
      new URL(feedbackPath(slug, token), req.url),
      303,
    );
  }

  const ratingRaw = parseInt(String(data.overallRating ?? ""), 10);
  const overallRating =
    Number.isFinite(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 5
      ? ratingRaw
      : null;

  const clean = (v: string | undefined) => {
    const s = String(v ?? "").trim();
    return s ? s.slice(0, 4000) : null;
  };
  // "yes"/"no" radios; absent stays null.
  const yesNo = (v: string | undefined): boolean | null => {
    const s = String(v ?? "").trim().toLowerCase();
    if (s === "yes") return true;
    if (s === "no") return false;
    return null;
  };

  const testimonial = clean(data.testimonial);

  const result = await recordFeedback(token, {
    beenBefore: yesNo(data.beenBefore),
    metSomeone: yesNo(data.metSomeone),
    newIdeas: yesNo(data.newIdeas),
    overallRating,
    highlight: clean(data.highlight),
    improve: clean(data.improve),
    returnLikelihood: clean(data.returnLikelihood),
    testimonial,
    // Consent is implied by choosing to leave a quote.
    testimonialConsent: !!testimonial,
  });

  const destSlug = result.slug ?? slug;
  if (!result.ok) {
    return NextResponse.redirect(
      new URL(feedbackPath(destSlug, token, "error"), req.url),
      303,
    );
  }
  // Success (or already submitted): the feedback page shows the thank-you.
  return NextResponse.redirect(
    new URL(feedbackPath(destSlug, token), req.url),
    303,
  );
}
