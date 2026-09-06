import { ArrowUpRight, Calendar, Quote } from "lucide-react";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

export const metadata = {
  alternates: { canonical: "/student-speaker-competition" },
  title: "Student Speaker Competition · TEDxNewy",
  description:
    "TEDxNewy's Student Speaker Competition is closed for entries this year. Thanks to every student across Newcastle who sent through a talk: the competition returns in 2027.",
};

/**
 * Retired 2026-09-06: entries closed on schedule (6 September 2026) and this
 * page dropped from an active entry form to a closed notice, same pattern
 * as the 60-Second Talk Night recap. The entry form, its API route and
 * student_speaker_submissions table are all untouched (see
 * StudentSpeakerEntryForm.tsx and app/api/student-speaker-competition/) so
 * the 2027 competition can just reuse them: rebuild this page from the
 * pre-2026-09-06 version in git history when entries reopen.
 */
export default function StudentSpeakerCompetitionPage() {
  return (
    <>
      <BreadcrumbJsonLd
        name="Student Speaker Competition"
        path="/student-speaker-competition"
      />

      {/* Hero */}
      <section className="bg-[var(--color-cream)] pt-40 pb-24 md:pt-48 md:pb-32">
        <div className="mx-auto max-w-[820px] px-5 text-center md:px-6">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#b91404]"
            style={{ letterSpacing: "0.24em" }}
          >
            Student Speaker Competition · 2026
          </div>
          <h1
            className="mt-6 font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(2.25rem, 5.5vw, 4rem)",
              lineHeight: 1.02,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Entries are closed.
          </h1>
          <p className="mx-auto mt-7 max-w-[54ch] text-[16.5px] leading-[1.65] text-[#2a2521] md:text-[18px]">
            Thank you to every student across Newcastle who sent through an
            idea. We&rsquo;re reviewing entries now and will be in touch with
            finalists directly. The competition returns in 2027.
          </p>
          <div
            className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-[rgba(20,18,16,0.15)] bg-white px-5 py-3 font-mono text-[11.5px] font-semibold uppercase text-[#141210]"
            style={{ letterSpacing: "0.18em" }}
          >
            <Calendar className="h-3.5 w-3.5" strokeWidth={2.25} />
            Entries closed 6 Sep 2026
          </div>
        </div>
      </section>

      {/* Testimonial from last year's winner */}
      <section className="bg-[#e02214] text-white">
        <div className="mx-auto max-w-[920px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-white/75"
            style={{ letterSpacing: "0.24em" }}
          >
            From last year&rsquo;s winner
          </div>

          <Quote
            aria-hidden
            className="mt-7 h-9 w-9 text-white/60"
            strokeWidth={1.5}
          />

          <blockquote
            className="mt-5 font-sans text-white balance"
            style={{
              fontSize: "clamp(1.5rem, 3.2vw, 2.25rem)",
              lineHeight: 1.25,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
              letterSpacing: "-0.015em",
            }}
          >
            &ldquo;This was a precious opportunity to not only share what is
            important to me, but also explore the process of presenting, speech
            writing and behind the scenes of a TEDxNewy event.&rdquo;
          </blockquote>

          <footer className="mt-9 flex flex-col gap-1">
            <div
              className="font-sans text-[16px] font-semibold text-white"
              style={{ fontVariationSettings: '"opsz" 96' }}
            >
              Chloe
            </div>
            <div
              className="font-mono text-[10.5px] font-semibold uppercase text-white/75"
              style={{ letterSpacing: "0.22em" }}
            >
              Merewether High School · 2025 winner
            </div>
          </footer>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-[#2a0604] text-white">
        <div className="mx-auto max-w-[1100px] px-5 py-16 md:px-6 md:py-20">
          <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-white/70"
                style={{ letterSpacing: "0.24em" }}
              >
                Questions?
              </div>
              <p className="mt-3 max-w-[44ch] text-[18px] leading-[1.4] text-white md:text-[20px]">
                If you entered and haven&rsquo;t heard back, or just want to
                ask about next year&rsquo;s competition, get in touch.
              </p>
            </div>
            <a
              href="mailto:activations@tedxnewy.com.au"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-medium text-[#2a0604] transition-all hover:-translate-y-0.5 hover:bg-[#f4efe6]"
            >
              activations@tedxnewy.com.au
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
