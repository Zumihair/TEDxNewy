import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Lightbulb,
  MapPin,
  Mic,
  Network,
  Sparkles,
  Users,
  Utensils,
} from "lucide-react";
import YouthFuturesRegistrationForm from "@/components/YouthFuturesRegistrationForm";

export const metadata = {
  title: "2026 Youth Futures Lab · TEDxNewy",
  description:
    "A one-day hackathon for the next generation of Newcastle leaders. TEDxNewy × University of Newcastle, 5 August 2026 at NUspace City Campus. Free for selected schools — EOIs close 15 June.",
};

const SCHEDULE: Array<{ time: string; activity: string }> = [
  { time: "9:30 am", activity: "Registration & team formation" },
  { time: "10:00 am", activity: "Workshop 1 — Set-up, problem-solving & presentation skills" },
  { time: "11:00 am", activity: "Break" },
  { time: "11:15 am", activity: "Workshop 2 — Guided teamwork" },
  { time: "12:15 pm", activity: "Lunch" },
  { time: "1:00 pm", activity: "Team practice" },
  { time: "1:30 pm", activity: "Final pitch presentations" },
  { time: "2:30 pm", activity: "Wrap up" },
];

const WHO_SHOULD_ATTEND: string[] = [
  "Emerging and current student leaders",
  "Students with an interest in leadership, communication, innovation, or community impact",
  "Students looking to build confidence in public speaking and real-world problem solving",
];

const STUDENT_GAINS: Array<{
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  text: string;
}> = [
  { Icon: Mic, text: "Practical presentation and storytelling skills (TED-style delivery)" },
  { Icon: MapPin, text: "Experience working on a real Newcastle-based challenge" },
  { Icon: Users, text: "Collaboration and leadership experience in a fast-paced team setting" },
  { Icon: Network, text: "Exposure to TEDx and university facilitators for early networking" },
  { Icon: Lightbulb, text: "The opportunity to pitch ideas in a supportive, high-standard environment" },
];

const FACILITATORS: Array<{
  name: string;
  role: string;
  bio: string;
  image: string;
}> = [
  {
    name: "Magdalena Hoeller",
    role: "Adventures & Education Coordinator | Speaker Coach",
    bio: "TEDx Newy Speaker 2024 — works at the University of Newcastle.",
    image: "/images/facilitators/magdalena-hoeller.jpg",
  },
  {
    name: "Craig Smith",
    role: "Adventures & Education Team Lead",
    bio: "TEDx Newy Speaker 2024 — works with the NSW Government in Inclusive Education.",
    image: "/images/facilitators/craig-smith.jpg",
  },
];

export default async function YouthFuturesLabPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const errored = status === "error";

  return (
    <>
      {/* Hero — two-column: text + brand image. Mirrors PageHero styling. */}
      <section className="bg-[var(--color-cream)] pt-40 pb-20 md:pt-48 md:pb-28">
        <div className="mx-auto max-w-[1240px] px-5 md:px-6">
          <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr] md:gap-14">
            <div>
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
                style={{ letterSpacing: "0.24em" }}
              >
                Youth Futures Lab · 2026
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
                2026 Youth Futures Lab
              </h1>
              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-[14px] font-medium text-[#2a2521]">
                <span className="inline-flex items-center gap-2">
                  <Calendar
                    className="h-4 w-4 text-[#e02214]"
                    strokeWidth={2.25}
                  />
                  Wednesday, 5 August 2026
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock
                    className="h-4 w-4 text-[#e02214]"
                    strokeWidth={2.25}
                  />
                  9:30 am – 2:30 pm
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin
                    className="h-4 w-4 text-[#e02214]"
                    strokeWidth={2.25}
                  />
                  NUspace City Campus, Room X-101
                </span>
                <span className="inline-flex items-center gap-2">
                  <Sparkles
                    className="h-4 w-4 text-[#e02214]"
                    strokeWidth={2.25}
                  />
                  Free for selected schools
                </span>
              </div>
            </div>
            <div className="relative md:order-last">
              <div className="overflow-hidden rounded-[var(--radius-lg)] shadow-[0_24px_60px_-20px_rgba(42,6,4,0.35)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/youth-futures/yfl-brand.jpg"
                  alt="TEDxNewy event signage in the venue, hosted by TEDxNewy and Newcastle community partners."
                  className="block aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Primary CTA — aligned to the hero's left column */}
      <section className="-mt-14 pb-16 md:-mt-20 md:pb-20">
        <div className="mx-auto max-w-[1240px] px-5 md:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="#register"
              className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404]"
            >
              Schools Application
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <span className="text-[14px] font-medium text-[#2a2521]">
              EOIs close <strong>15 June 2026</strong> · spots are limited
            </span>
          </div>
        </div>
      </section>

      {/* About + Facilitators (right column, stacked); Who should attend below */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div className="grid gap-12 md:grid-cols-[1.1fr_1fr] md:gap-16">
            {/* Left: About */}
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
                Empowering young voices to lead what&rsquo;s next.
              </h2>
              <p className="mt-6 text-[17px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
                Students are placed into small teams and introduced to a local
                challenge for young adults. Guided through idea development,
                prototyping, and storytelling, each team will approach the
                challenge in their own unique way, producing a final pitch by
                the end of the day. The workshops are designed to sharpen
                analytical thinking, collaborative skills, and confident
                presentation technique. TEDx&nbsp;Newy and University of
                Newcastle facilitators guide and coach student teams throughout.
              </p>
            </div>

            {/* Right: Facilitators stacked */}
            <div>
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
                style={{ letterSpacing: "0.24em" }}
              >
                Facilitators
              </div>
              <p className="mt-2 text-[13.5px] text-[#6b6459]">
                TEDx&nbsp;Newy × University of Newcastle.
              </p>
              <div className="mt-5 space-y-4">
                {FACILITATORS.map((f) => (
                  <article
                    key={f.name}
                    className="flex items-start gap-4 rounded-[var(--radius-lg)] border border-[rgba(20,18,16,0.08)] bg-[#faf6ec] p-5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.image}
                      alt={f.name}
                      className="h-16 w-16 flex-shrink-0 rounded-full object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <h3 className="text-[16.5px] font-semibold leading-tight text-[#141210]">
                        {f.name}
                      </h3>
                      <p className="mt-1 text-[12.5px] font-medium leading-[1.4] text-[#e02214]">
                        {f.role}
                      </p>
                      <p className="mt-1.5 text-[13.5px] leading-[1.5] text-[#2a2521]">
                        {f.bio}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Who should attend — 2-col: collaboration image left, bullets right */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1100px] px-5 pb-20 md:px-6 md:pb-24">
          <div className="grid items-center gap-10 md:grid-cols-[1fr_1.1fr] md:gap-14">
            <div className="overflow-hidden rounded-[var(--radius-lg)] shadow-[0_24px_60px_-30px_rgba(42,6,4,0.35)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/youth-futures/yfl-collaboration.jpg"
                alt="Hands writing on tags during a TEDxNewy workshop, with TEDxNewy badges in the foreground."
                className="block aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
                style={{ letterSpacing: "0.24em" }}
              >
                Who should attend
              </div>
              <h2
                className="mt-4 font-sans tracking-[-0.025em] text-[#141210] balance"
                style={{
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  lineHeight: 1.1,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                Who this is for.
              </h2>
              <ul className="mt-6 space-y-3.5 text-[16px] leading-[1.55] text-[#2a2521] md:text-[16.5px]">
                {WHO_SHOULD_ATTEND.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-[0.65rem] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#e02214]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Outline / schedule */}
      <section className="bg-[var(--color-cream)]">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            Outline
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
            What the day looks like.
          </h2>

          <div className="mt-10 overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(20,18,16,0.10)] bg-white">
            <ul className="divide-y divide-[rgba(20,18,16,0.08)]">
              {SCHEDULE.map((row, idx) => (
                <li
                  key={row.time}
                  className={`grid grid-cols-[120px_1fr] items-baseline gap-6 px-5 py-4 md:grid-cols-[160px_1fr] md:gap-8 md:px-7 md:py-5 ${
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

          {/* Food note */}
          <div className="mt-5 flex items-start gap-3 rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.08)] bg-white px-5 py-4 text-[13.5px] leading-[1.55] text-[#2a2521]">
            <Utensils
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#e02214]"
              strokeWidth={2.25}
            />
            <p>
              <strong>Please note:</strong> morning tea and lunch are not
              provided. Students are encouraged to bring their own food, or use
              the University of Newcastle cafe on campus.
            </p>
          </div>
        </div>
      </section>

      {/* What students gain — 2-col: header + cards left, map image centered right */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr] md:gap-14">
            <div>
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
                style={{ letterSpacing: "0.24em" }}
              >
                What students gain
              </div>
              <h2
                className="mt-4 max-w-[20ch] font-sans tracking-[-0.025em] text-[#141210] balance"
                style={{
                  fontSize: "clamp(1.65rem, 3.4vw, 2.4rem)",
                  lineHeight: 1.08,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                Skills they&rsquo;ll carry well beyond the day.
              </h2>
              <ul className="mt-8 space-y-4">
                {STUDENT_GAINS.map(({ Icon, text }) => (
                  <li
                    key={text}
                    className="flex gap-4 rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.08)] bg-[#faf6ec] px-5 py-4 text-[15.5px] leading-[1.5] text-[#141210]"
                  >
                    <span
                      aria-hidden
                      className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#e02214] text-white"
                    >
                      <Icon className="h-4 w-4" strokeWidth={2.25} />
                    </span>
                    <span className="self-center">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-[var(--radius-lg)] shadow-[0_24px_60px_-30px_rgba(42,6,4,0.35)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/youth-futures/yfl-map.jpg"
                alt="Map of Newcastle marked with colored pins, representing a local challenge to be tackled by student teams."
                className="block aspect-[4/5] w-full object-cover"
                loading="lazy"
              />
              <div className="px-5 py-4 text-[12.5px] leading-[1.5] text-[#6b6459]">
                Teams tackle a real Newcastle-based challenge — picked fresh for
                each cohort.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* School participation — red call-out + disclaimer + CTA below */}
      <section className="bg-[var(--color-cream)]">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div className="overflow-hidden rounded-[40px] bg-[#e02214] p-8 text-white md:rounded-[60px] md:p-12">
            <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] md:gap-12">
              <div>
                <div
                  className="font-mono text-[10.5px] font-semibold uppercase text-white/75"
                  style={{ letterSpacing: "0.24em" }}
                >
                  School participation
                </div>
                <h2
                  className="mt-4 font-sans tracking-[-0.025em] text-white balance"
                  style={{
                    fontSize: "clamp(1.65rem, 3.4vw, 2.4rem)",
                    lineHeight: 1.05,
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 144',
                  }}
                >
                  How it works for your school.
                </h2>
              </div>
              <div className="space-y-6 text-[15.5px] leading-[1.6] md:text-[16px]">
                <div>
                  <div
                    className="font-mono text-[10px] font-semibold uppercase text-white/80"
                    style={{ letterSpacing: "0.24em" }}
                  >
                    Each school nominates
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    <li>· 1 accompanying teacher</li>
                    <li>· 3–10 students (recommended group size)</li>
                  </ul>
                </div>
                <div>
                  <div
                    className="font-mono text-[10px] font-semibold uppercase text-white/80"
                    style={{ letterSpacing: "0.24em" }}
                  >
                    Schools are responsible for
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    <li>· Transport to and from the venue</li>
                    <li>
                      · Standard excursion approvals and supervision
                      requirements
                    </li>
                  </ul>
                </div>
                <div className="border-t border-white/20 pt-5 text-[13.5px] leading-[1.6] text-white/85 md:text-[14px]">
                  <strong className="text-white">Please note:</strong> spaces
                  are limited and registrations close on 15 June 2026. To ensure
                  a diversity of ideas, preference will be given to a diverse
                  spread of school applicants. We&rsquo;ll confirm acceptance of
                  your registration within <strong>1 business day</strong> of
                  submission.
                </div>
              </div>
            </div>
          </div>

          {/* CTA beneath the red callout — centered, button only */}
          <div className="mt-10 flex justify-center">
            <Link
              href="#register"
              className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404]"
            >
              Schools Application
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
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
            Register your students.
          </h2>
          <p className="mt-4 max-w-[60ch] text-[15.5px] leading-[1.6] text-[#2a2521]">
            Free for selected schools. Spots are limited for a quality
            experience. Submit your school&rsquo;s expression of interest by{" "}
            <strong>15 June 2026</strong> and we&rsquo;ll confirm details within
            1 business day.
          </p>

          <YouthFuturesRegistrationForm errored={errored} />
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
                Request further details
              </div>
              <p className="mt-3 max-w-[40ch] text-[18px] leading-[1.4] text-white md:text-[20px]">
                Got a question or need a tailored pack for your school
                leadership team?
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
