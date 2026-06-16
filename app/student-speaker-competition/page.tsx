import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  Eye,
  Lightbulb,
  Mic,
  MicVocal,
  Quote,
  Ticket,
  Trophy,
  UploadCloud,
  Video,
} from "lucide-react";
import StudentSpeakerEntryForm from "@/components/StudentSpeakerEntryForm";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

export const metadata = {
  alternates: { canonical: "/student-speaker-competition" },
  title: "2026 Student Speaker Competition · TEDxNewy",
  description:
    "Got an idea worth sharing? TEDxNewy's Student Speaker Competition is open to all local students. Record a short talk in the TEDx format (under 5 minutes) and submit by 15 August 2026. Finalists may take the TEDxNewy 2026 stage.",
};

const STEPS: Array<{
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
}> = [
  {
    Icon: Lightbulb,
    title: "Find Your Idea",
    body: "Think about what genuinely excites, concerns, or fascinates you. Your talk should centre on one clear idea you believe Newcastle needs to hear. It doesn’t need to be groundbreaking, just honest and yours.",
  },
  {
    Icon: Video,
    title: "Record Your Talk",
    body: "Film yourself delivering your TEDx Talk in under 5 minutes. You don’t need professional equipment. A clear video on your phone is perfectly fine. Focus on clarity, passion, and getting your idea across, and keep it to the point.",
  },
  {
    Icon: UploadCloud,
    title: "Submit via TEDx Newy",
    body: "Submit your video through the official entry form below before 15 August 2026. Make sure your video link is accessible and your contact details are correct. Good luck. We can’t wait to watch!",
  },
];

const PRIZES: Array<{
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
}> = [
  {
    Icon: Ticket,
    title: "Two Tickets to TEDxNewy 2026",
    body: "Bring a friend and experience the full TEDxNewy event from the audience: an inspiring day of ideas and stories.",
  },
  {
    Icon: Eye,
    title: "Exclusive Backstage Access",
    body: "Get a look at how TEDxNewy comes together on the day, including the parts the audience never sees.",
  },
  {
    Icon: MicVocal,
    title: "Public Speaking Coaching Session",
    body: "One exclusive session with an experienced speaking coach to sharpen your delivery, presence, and storytelling.",
  },
  {
    Icon: Trophy,
    title: "Speak at TEDxNewy",
    body: "The ultimate prize: the chance to take the TEDxNewy stage and deliver your talk live to a full audience.",
  },
];

export default async function StudentSpeakerCompetitionPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const errored = status === "error";

  return (
    <>
      <BreadcrumbJsonLd
        name="Student Speaker Competition"
        path="/student-speaker-competition"
      />
      {/* Hero */}
      <section className="bg-[var(--color-cream)] pt-40 pb-20 md:pt-48 md:pb-28">
        <div className="mx-auto max-w-[1240px] px-5 md:px-6">
          <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr] md:gap-14">
            <div>
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
                style={{ letterSpacing: "0.24em" }}
              >
                Student Speaker Competition · 2026
              </div>
              <h1
                className="mt-6 font-sans tracking-[-0.025em] text-[#141210] balance"
                style={{
                  fontSize: "clamp(2.5rem, 6vw, 5rem)",
                  lineHeight: 0.98,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                Got an idea worth sharing?{" "}
                <span style={{ color: "#e02214" }}>This is your stage.</span>
              </h1>
              <p className="mt-7 text-[16.5px] leading-[1.65] text-[#2a2521] md:text-[18px]">
                We&rsquo;re looking for bold student voices from across Newcastle
                to step up, share their perspective, and inspire an audience.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="#submit"
                  className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404]"
                >
                  Submit my entry
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </Link>
                <div
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,18,16,0.15)] bg-white px-5 py-3 font-mono text-[11.5px] font-semibold uppercase text-[#141210]"
                  style={{ letterSpacing: "0.18em" }}
                >
                  <Calendar className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Entries close 15 Aug 2026
                </div>
              </div>
            </div>

            {/* Brand-ish hero motif */}
            <div className="relative hidden h-[420px] items-center justify-center md:flex">
              <div
                aria-hidden
                className="absolute h-[360px] w-[360px] rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, #ff3626 0%, #e11905 25%, #b91404 55%, rgba(42,6,4,0) 80%)",
                }}
              />
              <div
                aria-hidden
                className="absolute h-[280px] w-[280px] rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(255,170,150,0.30) 0%, rgba(255,120,100,0.10) 50%, rgba(0,0,0,0) 75%)",
                  mixBlendMode: "screen",
                }}
              />
              <div className="relative flex flex-col items-center text-white">
                <Mic className="h-14 w-14" strokeWidth={1.4} />
                <div
                  className="mt-4 font-mono text-[10.5px] font-semibold uppercase"
                  style={{ letterSpacing: "0.26em" }}
                >
                  · Your idea · Our stage ·
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About the competition */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            About the competition
          </div>
          <h2
            className="mt-5 max-w-[26ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              lineHeight: 1.02,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Your idea. <span style={{ color: "#e02214" }}>Our stage.</span>
          </h2>
          <div className="mt-7 grid gap-7 md:grid-cols-2 md:gap-12">
            <p className="text-[16.5px] leading-[1.7] text-[#2a2521]">
              TEDxNewy&rsquo;s Student Speaker Competition is open to all local
              students: all ages, all schools, all backgrounds. Whether your
              idea is personal, scientific, or just something that&rsquo;s been
              living in your head, we want to hear it.
            </p>
            <p className="text-[16.5px] leading-[1.7] text-[#2a2521]">
              Inspired by the global TED tradition, this competition gives
              students the chance to develop and deliver a short talk in the
              TEDx format. Finalists might be invited to present at{" "}
              <strong>TEDxNewy 2026</strong> in front of a live audience.
            </p>
          </div>
        </div>
      </section>

      {/* How to enter — three numbered steps */}
      <section className="bg-[#f9f5ec]">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            How to enter
          </div>
          <h2
            className="mt-5 max-w-[24ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Three steps to your TEDx talk.
          </h2>

          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="relative flex flex-col rounded-[20px] border border-[rgba(20,18,16,0.08)] bg-white p-7 shadow-[0_1px_2px_rgba(20,18,16,0.04),0_6px_18px_rgba(20,18,16,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_1px_2px_rgba(20,18,16,0.04),0_18px_38px_-8px_rgba(20,18,16,0.18)]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e02214] font-mono text-[13px] font-bold text-white"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <step.Icon
                    className="h-5 w-5 text-[#141210]"
                    strokeWidth={1.75}
                  />
                </div>
                <h3
                  className="mt-5 font-sans text-[20px] font-medium tracking-[-0.01em] text-[#141210]"
                  style={{ fontVariationSettings: '"opsz" 96' }}
                >
                  {step.title}
                </h3>
                <p className="mt-3 text-[14.5px] leading-[1.6] text-[#2a2521]">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Prizes */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            Prizes
          </div>
          <h2
            className="mt-5 max-w-[24ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            What you can win.
          </h2>

          <ul className="mt-12 grid gap-6 md:grid-cols-2">
            {PRIZES.map((prize, i) => (
              <li
                key={prize.title}
                className="flex gap-5 rounded-[20px] border border-[rgba(20,18,16,0.08)] bg-[#f9f5ec] p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-12px_rgba(20,18,16,0.20)]"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#e02214] text-white">
                  <prize.Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <div
                    className="font-mono text-[10px] font-semibold uppercase text-[#e02214]"
                    style={{ letterSpacing: "0.22em" }}
                  >
                    Prize {i + 1}
                  </div>
                  <h3
                    className="mt-2 font-sans text-[18.5px] font-medium tracking-[-0.005em] text-[#141210]"
                    style={{ fontVariationSettings: '"opsz" 96' }}
                  >
                    {prize.title}
                  </h3>
                  <p className="mt-2.5 text-[14.5px] leading-[1.6] text-[#2a2521]">
                    {prize.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
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

      {/* Submit form */}
      <section id="submit" className="scroll-mt-20 bg-[#f9f5ec]">
        <div className="mx-auto max-w-[800px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            Are you ready?
          </div>
          <h2
            className="mt-4 font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.85rem, 3.4vw, 2.5rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Submit your talk.
          </h2>
          <p className="mt-4 text-[15.5px] leading-[1.65] text-[#2a2521]">
            Entries close <strong>15 August 2026</strong>. Make sure your video
            link is publicly accessible and your contact details are correct.
            We&rsquo;ll be in touch as judging progresses.
          </p>

          <StudentSpeakerEntryForm errored={errored} />
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
                Need help with your video, your idea, or just want to chat
                through it first?
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
