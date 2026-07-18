import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getAttendeeByToken } from "@/lib/event-feedback";
import FeedbackForm from "./FeedbackForm";

export const metadata: Metadata = {
  title: "Share your feedback · TEDxNewy",
  robots: { index: false, follow: false },
  alternates: { canonical: undefined },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--color-cream)] px-5 py-16 md:py-24">
      <div className="mx-auto max-w-[640px]">{children}</div>
    </main>
  );
}

export default async function FeedbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string; status?: string; done?: string }>;
}) {
  const { slug } = await params;
  const { t, status, done } = await searchParams;
  const token = typeof t === "string" ? t.trim() : "";

  // Dev-only: /feedback/<slug>?t=preview renders the form with sample data so
  // it can be previewed locally without a live token (or Supabase). Add
  // &done=1 to preview the thank-you state instead.
  if (process.env.NODE_ENV !== "production" && token === "preview") {
    if (done) {
      return (
        <Shell>
          <ThankYou eventTitle="60-Second Talk Night" slug={slug} />
        </Shell>
      );
    }
    return (
      <Shell>
        <FeedbackIntro eventTitle="60-Second Talk Night" />
        <FeedbackForm token="preview" slug={slug} />
      </Shell>
    );
  }

  const record = token ? await getAttendeeByToken(token) : null;

  // Unrecognised or missing link.
  if (!record) {
    return (
      <Shell>
        <div className="rounded-[var(--radius-lg)] border border-[rgba(20,18,16,0.10)] bg-white p-8 md:p-12">
          <h1 className="font-sans text-[28px] font-medium tracking-[-0.02em] text-[#141210]">
            This feedback link isn&rsquo;t valid.
          </h1>
          <p className="mt-4 text-[16px] leading-[1.65] text-[#2a2521]">
            The link may have been mistyped or expired. If you were sent a
            feedback request by email, please open it straight from there.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center rounded-full bg-[#e02214] px-6 py-3 text-[14.5px] font-medium text-white transition-colors hover:bg-[#b91404]"
          >
            Back to TEDxNewy
          </Link>
        </div>
      </Shell>
    );
  }

  const { attendee, event } = record;

  // Already submitted.
  if (attendee.feedbackCompletedAt) {
    return (
      <Shell>
        <ThankYou eventTitle={event.title} slug={slug} />
      </Shell>
    );
  }

  return (
    <Shell>
      <FeedbackIntro eventTitle={event.title} />

      {status === "error" && (
        <div className="mt-6 rounded-[var(--radius-md)] border border-[#e02214]/30 bg-[#e02214]/5 px-4 py-3 text-[14px] text-[#b91404]">
          Something went wrong saving your feedback. Please try again.
        </div>
      )}

      <FeedbackForm token={token} slug={slug} />
    </Shell>
  );
}

function FeedbackIntro({ eventTitle }: { eventTitle: string }) {
  return (
    <>
      <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#b91404]">
        {eventTitle}
      </div>
      <h1 className="mt-4 font-sans text-[clamp(2rem,5vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.025em] text-[#141210]">
        How was it?
      </h1>
      <p className="mt-4 text-[16.5px] leading-[1.65] text-[#2a2521]">
        Thanks for coming along. Your input should take about two minutes and
        helps us make the next one better.
      </p>
    </>
  );
}

function ThankYou({ eventTitle, slug }: { eventTitle: string; slug: string }) {
  const isTalkNight =
    slug === "60-second-talk-night" || slug === "talk-night";
  return (
    <div className="rounded-[var(--radius-lg)] border border-[rgba(20,18,16,0.10)] bg-white p-8 text-center md:p-14">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e02214]/10 text-[#e02214]">
        <CheckCircle2 className="h-9 w-9" strokeWidth={1.75} />
      </div>
      <div className="mt-6 font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#b91404]">
        {eventTitle}
      </div>
      <h1 className="mt-3 font-sans text-[clamp(1.9rem,4.5vw,2.6rem)] font-medium leading-[1.05] tracking-[-0.025em] text-[#141210]">
        Thank you, that&rsquo;s all in.
      </h1>
      <p className="mx-auto mt-4 max-w-[48ch] text-[16.5px] leading-[1.65] text-[#2a2521]">
        We genuinely appreciate you taking the time. Feedback like yours is
        exactly what shapes the next TEDxNewy, so thank you.
      </p>
      <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {isTalkNight && (
          <Link
            href="/60-second-talk-night"
            className="inline-flex items-center justify-center rounded-full bg-[#e02214] px-6 py-3 text-[14.5px] font-medium text-white transition-colors hover:bg-[#b91404]"
          >
            Watch the recap
          </Link>
        )}
        <Link
          href="/"
          className={
            isTalkNight
              ? "inline-flex items-center justify-center rounded-full border border-[rgba(20,18,16,0.16)] px-6 py-3 text-[14.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.05)]"
              : "inline-flex items-center justify-center rounded-full bg-[#e02214] px-6 py-3 text-[14.5px] font-medium text-white transition-colors hover:bg-[#b91404]"
          }
        >
          Back to TEDxNewy
        </Link>
      </div>
    </div>
  );
}
