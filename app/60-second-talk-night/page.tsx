import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Lightbulb,
  Lock,
  MapPin,
  Mic,
  Users,
} from "lucide-react";
import CountdownClock from "@/components/CountdownClock";
import SixtySecondRing from "@/components/SixtySecondRing";
import TalkNightRegistrationForm from "@/components/TalkNightRegistrationForm";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

export const metadata = {
  alternates: { canonical: "/60-second-talk-night" },
  title: "TEDxNewy 60-Second Talk Night · One idea. One minute. One audience.",
  description:
    "An intimate, invite-only evening where you share or listen to ideas in 60 seconds. Thursday 16 July 2026, 6:00pm to 8:00pm in Newcastle West. Free, by expression of interest. Register to speak or listen.",
  openGraph: {
    title: "TEDxNewy 60-Second Talk Night",
    description:
      "One idea. One minute. One audience. An intimate, invite-only night in Newcastle West on 16 July 2026. Register your interest to speak or listen.",
    images: ["/images/talk-night.webp"],
    type: "website",
  },
};

const RUN_SHEET: Array<{ time: string; activity: string }> = [
  { time: "6:00pm", activity: "Welcome" },
  { time: "6:10pm", activity: "60-second talks (around 25 speakers)" },
  {
    time: "7:00pm",
    activity: "Connection, discussion and unpacking the ideas",
  },
  { time: "8:00pm", activity: "Wrap up" },
];

const DETAILS: Array<{
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}> = [
  { Icon: Calendar, label: "Date", value: "Thursday 16 July 2026" },
  { Icon: Clock, label: "Time", value: "6:00pm to 8:00pm" },
  { Icon: MapPin, label: "Location", value: "Newcastle West" },
  { Icon: Lock, label: "Entry", value: "Free, invite only via EOI" },
];

export default async function TalkNightPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const errored = status === "error";

  return (
    <>
      <BreadcrumbJsonLd
        name="60-Second Talk Night"
        path="/60-second-talk-night"
      />
      {/* HERO — deep red with spotlight glow + grain, image showcase right */}
      <section className="relative overflow-hidden bg-[#2a0604] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            width: "min(120vw, 1500px)",
            height: "min(90vw, 1000px)",
            background:
              "radial-gradient(ellipse at center top, rgba(255,54,38,0.45) 0%, rgba(224,34,20,0.22) 28%, rgba(138,13,5,0.10) 52%, rgba(42,6,4,0) 72%)",
          }}
        />
        <div className="grain pointer-events-none absolute inset-0 opacity-20" />

        <div className="relative mx-auto max-w-[1240px] px-5 pt-40 pb-20 md:px-10 md:pt-48 md:pb-28">
          <div className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr] md:gap-16">
            <div>
              <h1
                className="font-sans tracking-[-0.025em] text-white balance"
                style={{
                  fontSize: "clamp(2.5rem, 6vw, 4.75rem)",
                  lineHeight: 0.98,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                TEDxNewy 60-Second Talk Night
              </h1>
              <p
                className="mt-5 font-sans italic text-[#ff9b8f]"
                style={{
                  fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)",
                  fontWeight: 500,
                }}
              >
                One idea. One minute. One audience.
              </p>
              <p className="mt-7 max-w-[48ch] text-[17px] leading-[1.7] text-white/85 md:text-[18px]">
                An intimate evening where you share or listen to ideas in just
                60 seconds. Around 25 speakers each take the stage for one minute,
                then we stay on to connect and unpack the ideas together. It is
                invite only, by expression of interest, and we sadly can&rsquo;t
                take everyone.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="#register"
                  className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404]"
                >
                  Register your interest
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </Link>
                <span className="text-[14px] font-medium text-white/75">
                  Free · speak or listen
                </span>
              </div>
            </div>

            {/* Image showcase */}
            <div className="md:order-last">
              <div className="overflow-hidden rounded-[var(--radius-lg)] border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/talk-night.webp"
                  alt="TEDxNewy 60-Second Talk Night at The Base, Newcastle West, on 16 July 2026."
                  className="block aspect-[3/2] w-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Detail chips */}
          <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-white/10 md:grid-cols-4">
            {DETAILS.map(({ Icon, label, value }) => (
              <div key={label} className="bg-[#2a0604] p-5 md:p-6">
                <Icon className="h-5 w-5 text-[#ff9b8f]" strokeWidth={2} />
                <div
                  className="mt-4 font-mono text-[9.5px] font-semibold uppercase text-white/50"
                  style={{ letterSpacing: "0.2em" }}
                >
                  {label}
                </div>
                <div className="mt-1.5 text-[15px] font-medium leading-[1.35] text-white">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COUNTDOWN — accent rhythm band */}
      <section className="bg-[#3d0a05] text-white">
        <div className="mx-auto max-w-[1240px] px-5 py-16 md:px-10 md:py-20">
          <div className="grid items-center gap-10 md:grid-cols-[1fr_1.2fr] md:gap-16">
            <div>
              <h2
                className="font-sans tracking-[-0.025em] text-white balance"
                style={{
                  fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)",
                  lineHeight: 1.05,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                The room fills on 16 July.
              </h2>
              <p className="mt-5 max-w-[36ch] text-[16px] leading-[1.6] text-white/75">
                Seats are limited and given by invitation. Get your expression
                of interest in early so we can hold a place for you.
              </p>
              <Link
                href="#register"
                className="mt-7 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-[#ff9b8f] transition-colors hover:text-white"
              >
                Register your interest
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
            <CountdownClock />
          </div>
        </div>
      </section>

      {/* ABOUT — text + looping 60s ring */}
      <section className="relative overflow-hidden bg-[#2a0604] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3"
          style={{
            width: "min(90vw, 900px)",
            height: "min(90vw, 900px)",
            background:
              "radial-gradient(ellipse at center, rgba(255,54,38,0.30) 0%, rgba(138,13,5,0.10) 42%, rgba(42,6,4,0) 70%)",
          }}
        />
        <div className="relative mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-[1.3fr_1fr] md:gap-16">
            <div>
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
                style={{ letterSpacing: "0.28em" }}
              >
                About the night
              </div>
              <h2
                className="mt-5 font-sans tracking-[-0.025em] text-white balance"
                style={{
                  fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)",
                  lineHeight: 1.06,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                Everyone has one idea worth a minute.
              </h2>
              <p className="mt-6 text-[17px] leading-[1.7] text-white/85 md:text-[17.5px]">
                The 60-Second Talk Night strips a TED talk back to its core: a
                single idea, shared simply. No slide deck, no pressure. Just you,
                the stage and 60 seconds to share an idea, insight, story,
                challenge or perspective that matters to you.
              </p>
              <p className="mt-4 text-[17px] leading-[1.7] text-white/85 md:text-[17.5px]">
                Because the room is small and the night is intimate, every place
                is given by invitation through expression of interest. It is the
                easiest way to step on a TEDx stage for the first time, and a
                rare night out even if you come simply to listen.
              </p>
            </div>
            <div className="flex justify-center md:justify-end">
              <SixtySecondRing size={240} />
            </div>
          </div>
        </div>
      </section>

      {/* RUN SHEET */}
      <section className="bg-[#3d0a05] text-white">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
            style={{ letterSpacing: "0.28em" }}
          >
            Run sheet
          </div>
          <h2
            className="mt-5 max-w-[18ch] font-sans tracking-[-0.025em] text-white balance"
            style={{
              fontSize: "clamp(1.75rem, 3.6vw, 2.5rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            How the night runs.
          </h2>

          <div className="mt-10 overflow-hidden rounded-[var(--radius-lg)] border border-white/10">
            <ul className="divide-y divide-white/10">
              {RUN_SHEET.map((row) => (
                <li
                  key={row.time}
                  className="grid grid-cols-[100px_1fr] items-baseline gap-6 bg-white/[0.03] px-5 py-4 md:grid-cols-[150px_1fr] md:gap-8 md:px-7 md:py-5"
                >
                  <span className="font-mono text-[13px] font-semibold text-[#ff9b8f] md:text-[13.5px]">
                    {row.time}
                  </span>
                  <span className="text-[15px] leading-[1.55] text-white/90 md:text-[15.5px]">
                    {row.activity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* TWO WAYS IN — speak or listen */}
      <section className="bg-[#2a0604] text-white">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
            style={{ letterSpacing: "0.28em" }}
          >
            Two ways in
          </div>
          <h2
            className="mt-5 max-w-[22ch] font-sans tracking-[-0.025em] text-white balance"
            style={{
              fontSize: "clamp(1.75rem, 3.6vw, 2.5rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Take the stage, or take a seat.
          </h2>
          <p className="mt-5 max-w-[52ch] text-[16px] leading-[1.6] text-white/75">
            Either way you register the same way. The room is small, so every
            place is offered by invitation once we&rsquo;ve read the
            expressions of interest.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] p-7 md:p-8">
              <span
                aria-hidden
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#e02214] text-white"
              >
                <Mic className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.01em] text-white">
                Speak
              </h3>
              <p className="mt-3 flex-1 text-[15.5px] leading-[1.6] text-white/80">
                Got an idea worth a minute? Tell us your idea in a sentence when
                you register. No experience needed and no slides, just one idea
                you care about. Around 25 speakers make the final line-up.
              </p>
              <Link
                href="#register"
                className="mt-6 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-[#ff9b8f] transition-colors hover:text-white"
              >
                Put your hand up
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>

            <div className="flex flex-col rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] p-7 md:p-8">
              <span
                aria-hidden
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#e02214] text-white"
              >
                <Users className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.01em] text-white">
                Listen
              </h3>
              <p className="mt-3 flex-1 text-[15.5px] leading-[1.6] text-white/80">
                Come to hear 25 ideas in under an hour, then stay to meet the
                people behind them. Tell us why you&rsquo;d like to come, and
                bring one guest if you&rsquo;d like good company.
              </p>
              <Link
                href="#register"
                className="mt-6 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-[#ff9b8f] transition-colors hover:text-white"
              >
                Come along
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* REGISTRATION FORM */}
      <section
        id="register"
        className="relative scroll-mt-20 overflow-hidden bg-[#3d0a05] text-white"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            width: "min(120vw, 1300px)",
            height: "min(70vw, 700px)",
            background:
              "radial-gradient(ellipse at center top, rgba(255,54,38,0.28) 0%, rgba(138,13,5,0.08) 44%, rgba(42,6,4,0) 70%)",
          }}
        />
        <div className="relative mx-auto max-w-[760px] px-5 py-20 md:px-6 md:py-28">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
            style={{ letterSpacing: "0.28em" }}
          >
            Expression of interest
          </div>
          <h2
            className="mt-5 font-sans tracking-[-0.025em] text-white balance"
            style={{
              fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
              lineHeight: 1.06,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Register your interest.
          </h2>
          <p className="mt-5 text-[16px] leading-[1.6] text-white/75">
            Tell us whether you&rsquo;d like to speak or listen, and bring a
            guest if you like. It only takes a minute. Because the room is
            intimate we can&rsquo;t take everyone, so we&rsquo;ll be in touch to
            confirm your place.
          </p>

          <TalkNightRegistrationForm errored={errored} />
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="bg-[#2a0604] text-white">
        <div className="mx-auto max-w-[1100px] px-5 py-16 md:px-6 md:py-20">
          <div className="flex flex-col items-start gap-5 border-t border-white/10 pt-12 md:flex-row md:items-center md:justify-between">
            <div>
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-white/55"
                style={{ letterSpacing: "0.24em" }}
              >
                Questions
              </div>
              <p className="mt-3 max-w-[40ch] text-[18px] leading-[1.4] text-white md:text-[20px]">
                Want to know more before you register? We&rsquo;re happy to help.
              </p>
            </div>
            <a
              href="mailto:hello@tedxnewy.com.au"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-medium text-[#2a0604] transition-all hover:-translate-y-0.5 hover:bg-[#f4efe6]"
            >
              hello@tedxnewy.com.au
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
