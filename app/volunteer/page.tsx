import PhotoFill from "@/components/PhotoFill";
import FormField from "@/components/FormField";
import SubmitLockForm from "@/components/SubmitLockForm";
import { Button } from "@/components/ds";
import { VOLUNTEER_ROLES } from "@/lib/volunteer-roles";
import RolesBoard, { GhostX } from "./RolesBoard";

export const metadata = {
  alternates: { canonical: "/volunteer" },
  title: "Volunteer with us · TEDxNewy",
  description:
    "TEDxNewy is run entirely by volunteers. No experience needed, just reliability, curiosity and a little time. Tell us you're in and we'll find the right fit.",
};

const availability = [
  "A one-off event day",
  "A few hours a month",
  "A few hours a week",
  "As much as it takes",
  "Not sure yet, happy to chat",
];

const STEPS = [
  { tag: "Online, a few minutes", title: "Apply", body: "Send us a short application. No CV needed." },
  {
    tag: "A call or a coffee",
    title: "Have a chat",
    body: "Someone from the team gets in touch to talk about what you'd enjoy and how much time you have.",
  },
  {
    tag: "Your first event",
    title: "Join the crew",
    body: "You're in, behind the scenes of every event you help make happen.",
    last: true,
  },
];

const display = { fontVariationSettings: '"opsz" 96' } as const;

/** A word set in a red box, the same treatment as our talk thumbnails. */
function Hl({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[0.08em] bg-[#e62b1e] px-[0.14em] text-white [-webkit-box-decoration-break:clone] [box-decoration-break:clone]">
      {children}
    </span>
  );
}

export default function VolunteerPage() {
  return (
    <>
      {/* HERO: dark, photo pair, ghost X behind. Listed in Nav's heroIsDark. */}
      <section className="relative overflow-hidden bg-black text-white">
        <GhostX className="pointer-events-none absolute -bottom-56 -left-44 h-[760px] w-[760px] text-white opacity-[0.06]" />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-32 md:px-12 md:pb-24 md:pt-40 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-14">
          <div className="flex flex-col gap-7">
            <h1
              className="font-sans font-medium balance"
              style={{ ...display, fontSize: "clamp(3.25rem, 8vw, 7.5rem)", lineHeight: 0.88, letterSpacing: "-0.045em" }}
            >
              Big ideas need a <Hl>crew</Hl>.
            </h1>
            <p className="max-w-[540px] text-[18px] leading-[1.6] text-white/85 md:text-[19px]">
              TEDxNewy is run entirely by volunteers. You don&rsquo;t need
              experience, just reliability, curiosity and a little time. Tell us
              you&rsquo;re in and we&rsquo;ll find the right fit.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href="#roles" variant="accent" size="lg">
                See open roles
              </Button>
              <Button href="#apply" variant="secondary" size="lg" onDark>
                Apply now
              </Button>
            </div>
            <ul className="flex flex-wrap gap-2.5">
              {["No experience needed", "Year-round and event-day roles", "100% volunteer-run"].map((c) => (
                <li
                  key={c}
                  className="inline-flex h-9 items-center rounded-full border border-white/20 bg-white/10 px-4 text-[14px] text-white"
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative h-[420px] sm:h-[520px] lg:h-[600px]">
            <div className="absolute inset-y-0 left-[12%] right-0 overflow-hidden rounded-[28px]">
              <PhotoFill
                src="/images/participate/volunteers.webp"
                alt="Two TEDxNewy volunteers smiling at Reframe, our 2025 flagship"
                sizes="(max-width: 1024px) 90vw, 45vw"
                priority
                hoverZoom={false}
                objectPosition="center 18%"
              />
            </div>
            <div className="absolute bottom-9 left-0 aspect-[4/3] w-[46%] overflow-hidden rounded-[20px] border-[6px] border-black">
              <PhotoFill
                src="/images/home/signal-crew.webp"
                alt="The volunteer crew on the Signal stage, October 2026"
                sizes="(max-width: 1024px) 45vw, 22vw"
                hoverZoom={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* OPEN ROLES: driven by lib/volunteer-roles.ts */}
      <section id="roles" className="scroll-mt-24 bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-9 px-5 py-20 md:px-12 md:py-28">
          <div className="flex flex-col gap-4">
            <h2
              className="font-sans font-medium text-black"
              style={{ ...display, fontSize: "clamp(2.75rem, 6vw, 5.5rem)", lineHeight: 0.92, letterSpacing: "-0.04em" }}
            >
              Open roles
            </h2>
            <p className="max-w-[560px] text-[17px] leading-[1.6] text-[#2a2521]">
              We&rsquo;ll post specific roles here as we build the 2027 team.
              For now, tell us you&rsquo;re in and we&rsquo;ll find the right
              fit together.
            </p>
          </div>
          <RolesBoard roles={VOLUNTEER_ROLES} />
        </div>
      </section>

      {/* HOW IT WORKS: maroon, a three-step path */}
      <section className="relative overflow-hidden bg-[#2a0604] text-white">
        <GhostX className="pointer-events-none absolute -bottom-44 -left-36 h-[620px] w-[620px] text-white opacity-[0.06]" />
        <div className="relative mx-auto grid max-w-[1240px] items-start gap-12 px-5 py-20 md:px-12 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div className="flex flex-col gap-9">
            <h2
              className="font-sans font-medium balance"
              style={{ ...display, fontSize: "clamp(2.75rem, 6vw, 5.75rem)", lineHeight: 0.9, letterSpacing: "-0.045em" }}
            >
              From hello to the <Hl>crew</Hl> in three steps.
            </h2>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[24px]">
              <PhotoFill
                src="/images/home/signal-laugh.webp"
                alt="The Signal audience laughing, October 2026"
                sizes="(max-width: 1024px) 90vw, 40vw"
                hoverZoom={false}
                objectPosition="center 30%"
              />
            </div>
          </div>
          <ol className="relative flex flex-col">
            <span
              aria-hidden
              className="absolute bottom-16 left-[90px] top-8 w-[2px] bg-[#ff9b8f]/35 md:left-[130px]"
            />
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="relative grid grid-cols-[64px_30px_minmax(0,1fr)] gap-x-3 pb-14 last:pb-0 md:grid-cols-[96px_34px_minmax(0,1fr)] md:gap-x-[18px]"
              >
                <span
                  aria-hidden
                  className="font-sans text-[56px] font-semibold leading-[0.8] tracking-[-0.05em] text-transparent md:text-[84px]"
                  style={{ WebkitTextStroke: "1.5px #ff9b8f" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden
                  className={
                    "ml-[5px] mt-[18px] h-5 w-5 rounded-full border-2 md:ml-[7px] md:mt-[22px] " +
                    (s.last
                      ? "border-[#e62b1e] bg-[#e62b1e] shadow-[0_0_0_8px_rgba(230,43,30,0.2)]"
                      : "border-[#ff9b8f] bg-[#2a0604]")
                  }
                />
                <div className="flex flex-col gap-3 pt-2">
                  <span
                    className={
                      "self-start rounded-full border px-3 py-1.5 text-[12.5px] font-semibold " +
                      (s.last ? "border-[#e62b1e] bg-[#e62b1e]" : "border-white/20 bg-white/10")
                    }
                  >
                    {s.tag}
                  </span>
                  <h3
                    className="font-sans text-[30px] font-medium leading-none tracking-[-0.03em] md:text-[38px]"
                    style={display}
                  >
                    {s.title}
                  </h3>
                  <p className="max-w-[40ch] text-[16px] leading-[1.6] text-white/85">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* APPLY: the general form (POST /api/volunteer) */}
      <section id="apply" className="scroll-mt-24 bg-white">
        <div className="mx-auto flex max-w-[900px] flex-col gap-9 px-5 py-20 md:px-12 md:py-28">
          <div className="flex flex-col gap-4">
            <h2
              className="font-sans font-medium text-black balance"
              style={{ ...display, fontSize: "clamp(2.5rem, 5vw, 4.5rem)", lineHeight: 0.95, letterSpacing: "-0.04em" }}
            >
              Tell us <Hl>you&rsquo;re in</Hl>.
            </h2>
            <p className="text-[17px] leading-[1.6] text-[#2a2521]">
              A few minutes, that&rsquo;s all. Tell us how much time you can
              give and we&rsquo;ll find the right fit.
            </p>
          </div>

          <SubmitLockForm action="/api/volunteer" method="post" className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="First name" name="firstName" required />
              <FormField label="Last name" name="lastName" required />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Email" name="email" type="email" required />
              <FormField label="Phone" name="phone" type="tel" hint="Optional" />
            </div>
            <FormField
              label="Where are you based?"
              name="location"
              hint="Optional"
              placeholder="Suburb or town, e.g. Newcastle, Lambton, the Hunter"
            />
            <fieldset>
              <legend className="font-sans text-[13.5px] font-bold text-[#1a1513]">
                How much time can you give?<span className="ml-1 text-[#e62b1e]">*</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {availability.map((a, i) => (
                  <label key={a} className="cursor-pointer">
                    <input
                      type="radio"
                      name="availability"
                      value={a}
                      required={i === 0}
                      className="peer sr-only"
                    />
                    <span className="inline-flex h-11 items-center rounded-full border border-black/20 bg-white px-4 text-[14.5px] font-medium text-black transition-colors peer-checked:border-black peer-checked:bg-black peer-checked:text-white peer-focus-visible:ring-[3px] peer-focus-visible:ring-[#e62b1e]/40">
                      {a}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <FormField
              label="A short note"
              name="note"
              required
              textarea
              rows={5}
              placeholder="What draws you to TEDxNewy? Anything you'd love to help with, or any relevant experience we should know about."
            />
            <Button type="submit" variant="accent" size="lg">
              Submit application
            </Button>
          </SubmitLockForm>
        </div>
      </section>
    </>
  );
}
