import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Lightbulb,
  MapPin,
  Mic,
  Ticket,
  Users,
} from "lucide-react";
import TalkNightRegistrationForm from "@/components/TalkNightRegistrationForm";

export const metadata = {
  title: "TEDxNewy 60-Second Talk Night · One idea. One minute. One audience.",
  description:
    "A fast-paced community night where anyone can share an idea in 60 seconds. Wednesday 16 July 2026, 6:00pm to 8:00pm at The Base, Newcastle West. Free to attend. Register your interest to speak or come along.",
  openGraph: {
    title: "TEDxNewy 60-Second Talk Night",
    description:
      "One idea. One minute. One audience. A free community night at The Base, Newcastle West on 16 July 2026. Register your interest to speak or attend.",
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
  { Icon: Calendar, label: "Date", value: "Wednesday 16 July 2026" },
  { Icon: Clock, label: "Time", value: "6:00pm to 8:00pm" },
  { Icon: MapPin, label: "Venue", value: "The Base, Newcastle West" },
  { Icon: Ticket, label: "Cost", value: "Free to attend" },
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
      {/* Hero — left: pitch + CTA. Right: details card.
          A hero image can drop into the right column later. */}
      <section className="bg-[var(--color-cream)] pt-40 pb-20 md:pt-48 md:pb-24">
        <div className="mx-auto max-w-[1240px] px-5 md:px-6">
          <div className="grid items-center gap-12 md:grid-cols-[1.15fr_1fr] md:gap-16">
            <div>
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
                style={{ letterSpacing: "0.24em" }}
              >
                Upcoming event
              </div>
              <h1
                className="mt-6 font-sans tracking-[-0.025em] text-[#141210] balance"
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
                className="mt-5 font-sans italic text-[#e02214]"
                style={{
                  fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)",
                  fontWeight: 500,
                }}
              >
                One idea. One minute. One audience.
              </p>
              <p className="mt-7 max-w-[48ch] text-[17px] leading-[1.7] text-[#2a2521] md:text-[18px]">
                A fast-paced community night where anyone can share an idea in
                just 60 seconds. Around 25 speakers each take the stage for one
                minute, then we stay on to connect and unpack the ideas
                together. We&rsquo;re seeking expressions of interest from
                speakers and attendees alike.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="#register"
                  className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404]"
                >
                  Register your interest
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </Link>
                <span className="text-[14px] font-medium text-[#2a2521]">
                  Free · speakers and attendees welcome
                </span>
              </div>
            </div>

            {/* Details card */}
            <div className="md:order-last">
              <div className="rounded-[var(--radius-lg)] border border-[rgba(20,18,16,0.10)] bg-white p-7 shadow-[0_24px_60px_-30px_rgba(42,6,4,0.35)] md:p-8">
                <div
                  className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
                  style={{ letterSpacing: "0.24em" }}
                >
                  The night
                </div>
                <ul className="mt-5 space-y-5">
                  {DETAILS.map(({ Icon, label, value }) => (
                    <li key={label} className="flex items-start gap-4">
                      <span
                        aria-hidden
                        className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#faf2ec] text-[#e02214]"
                      >
                        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                      </span>
                      <span className="min-w-0">
                        <span
                          className="block font-mono text-[10px] font-semibold uppercase text-[#8a8278]"
                          style={{ letterSpacing: "0.18em" }}
                        >
                          {label}
                        </span>
                        <span className="mt-1 block text-[16px] font-medium leading-[1.4] text-[#141210]">
                          {value}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About — two-column: lede + "how it works" card */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div className="grid gap-12 md:grid-cols-[1.1fr_1fr] md:gap-16">
            <div>
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
                style={{ letterSpacing: "0.24em" }}
              >
                About
              </div>
              <h2
                className="mt-4 font-sans tracking-[-0.025em] text-[#141210] balance"
                style={{
                  fontSize: "clamp(1.65rem, 3.4vw, 2.4rem)",
                  lineHeight: 1.08,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                Everyone has one idea worth a minute.
              </h2>
              <p className="mt-6 text-[17px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
                The 60-Second Talk Night strips a TED talk back to its core: a
                single idea, shared simply. There&rsquo;s no slide deck and no
                pressure. Just you, the stage and 60 seconds to share an idea,
                insight, story, challenge or perspective that matters to you.
              </p>
              <p className="mt-4 text-[17px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
                After the talks, everyone is invited to stay, connect and keep
                the conversations going. It&rsquo;s the easiest way to step on a
                TEDx stage for the first time, and a great night out even if you
                just come to listen.
              </p>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[rgba(20,18,16,0.08)] bg-[#faf6ec] p-7 md:p-8">
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
                style={{ letterSpacing: "0.24em" }}
              >
                How it works
              </div>
              <ul className="mt-6 space-y-5 text-[15.5px] leading-[1.55] text-[#141210]">
                <li className="flex gap-4">
                  <span
                    aria-hidden
                    className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#e02214] text-white"
                  >
                    <Lightbulb className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <span className="self-center">
                    Bring one idea you can share in 60 seconds.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span
                    aria-hidden
                    className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#e02214] text-white"
                  >
                    <Mic className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <span className="self-center">
                    Around 25 speakers each take the stage for one minute.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span
                    aria-hidden
                    className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#e02214] text-white"
                  >
                    <Users className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <span className="self-center">
                    Stay afterwards to connect and unpack the ideas together.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Run sheet */}
      <section className="bg-[var(--color-cream)]">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            Run sheet
          </div>
          <h2
            className="mt-4 max-w-[18ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.65rem, 3.4vw, 2.4rem)",
              lineHeight: 1.08,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            How the night runs.
          </h2>

          <div className="mt-10 overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(20,18,16,0.10)] bg-white">
            <ul className="divide-y divide-[rgba(20,18,16,0.08)]">
              {RUN_SHEET.map((row, idx) => (
                <li
                  key={row.time}
                  className={`grid grid-cols-[110px_1fr] items-baseline gap-6 px-5 py-4 md:grid-cols-[150px_1fr] md:gap-8 md:px-7 md:py-5 ${
                    idx % 2 === 0 ? "bg-white" : "bg-[#faf6ec]"
                  }`}
                >
                  <span className="font-mono text-[13px] font-semibold text-[#e02214] md:text-[13.5px]">
                    {row.time}
                  </span>
                  <span className="text-[15px] leading-[1.55] text-[#141210] md:text-[15.5px]">
                    {row.activity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Two paths — speak or attend */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            Two ways in
          </div>
          <h2
            className="mt-4 max-w-[22ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.65rem, 3.4vw, 2.4rem)",
              lineHeight: 1.08,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Take the stage, or take a seat.
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-[var(--radius-lg)] border border-[rgba(20,18,16,0.10)] bg-[#faf6ec] p-7 md:p-8">
              <span
                aria-hidden
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#e02214] text-white"
              >
                <Mic className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.01em] text-[#141210]">
                Speak at the event
              </h3>
              <p className="mt-3 flex-1 text-[15.5px] leading-[1.6] text-[#2a2521]">
                Got an idea worth a minute? Register your interest to speak. No
                experience needed, no slides, just one idea you care about.
                Spots are limited to around 25 speakers.
              </p>
              <Link
                href="#register"
                className="mt-6 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-[#e02214]"
              >
                Put your hand up
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>

            <div className="flex flex-col rounded-[var(--radius-lg)] border border-[rgba(20,18,16,0.10)] bg-[#faf6ec] p-7 md:p-8">
              <span
                aria-hidden
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#e02214] text-white"
              >
                <Users className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.01em] text-[#141210]">
                Attend the event
              </h3>
              <p className="mt-3 flex-1 text-[15.5px] leading-[1.6] text-[#2a2521]">
                Come along to hear 25 ideas in under an hour, then stay to meet
                the people behind them. Attendance is free. Register your
                interest so we can save you a spot.
              </p>
              <Link
                href="#register"
                className="mt-6 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-[#e02214]"
              >
                Come along
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Registration form */}
      <section id="register" className="scroll-mt-20 bg-[#f9f5ec]">
        <div className="mx-auto max-w-[800px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            Expression of interest
          </div>
          <h2
            className="mt-4 font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.65rem, 3vw, 2.25rem)",
              lineHeight: 1.1,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Register your interest.
          </h2>
          <p className="mt-4 text-[15.5px] leading-[1.6] text-[#2a2521]">
            Tell us whether you&rsquo;d like to speak, attend, or both. It only
            takes a minute, and it&rsquo;s the same place to put your hand up for
            the stage or save yourself a seat.
          </p>

          <TalkNightRegistrationForm errored={errored} />
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
