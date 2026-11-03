import { redirect } from "next/navigation";
import PhotoFill from "@/components/PhotoFill";
import { Button } from "@/components/ds";
import { getVolunteerRoles } from "@/lib/volunteer-roles";
import RolesBoard, { GhostX } from "./RolesBoard";
import { ApplyButton, ApplyProvider } from "./ApplyModal";
import { Hl, display } from "./shared";

export const metadata = {
  alternates: { canonical: "/volunteer" },
  title: "Volunteer with us · TEDxNewy",
  description:
    "TEDxNewy is run entirely by volunteers. No experience needed, just reliability, curiosity and a little time. Tell us you're in and we'll find the right fit.",
};

const STEPS = [
  { title: "Apply", body: "Send us your interest for a role above." },
  {
    title: "Have a chat",
    body: "Someone from the team will be in touch to talk about what you'd enjoy and how much time you have.",
  },
  {
    title: "Join the team",
    body: "You're in, behind the scenes of every event you help make happen.",
    last: true,
  },
];

export default async function VolunteerPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const [roles, { role }] = await Promise.all([getVolunteerRoles(), searchParams]);
  // Older ?role= links: a posted role has its own page now.
  if (role && roles.some((r) => r.slug === role && !r.general)) redirect(`/volunteer/roles/${role}`);
  return (
    <ApplyProvider roles={roles}>
      {/* HERO: dark, photo pair, ghost X behind. Listed in Nav's heroIsDark. */}
      <section className="relative overflow-hidden bg-black text-white">
        <GhostX className="pointer-events-none absolute -bottom-56 -left-44 h-[760px] w-[760px] text-white opacity-[0.06]" />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-32 md:px-12 md:pb-24 md:pt-40 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14">
          <div className="flex flex-col gap-7">
            <h1
              className="isolate font-sans font-medium balance"
              style={{ ...display, fontSize: "clamp(3.25rem, 8vw, 7.5rem)", lineHeight: 0.88, letterSpacing: "-0.045em" }}
            >
              Big ideas need a <Hl>team</Hl>.
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
              <ApplyButton roles={roles} variant="secondary" onDark>
                Apply now
              </ApplyButton>
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
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px]">
            <PhotoFill
              src="/images/participate/volunteer-hero.webp"
              alt="The TEDxNewy volunteer team on the Signal stage, October 2026"
              sizes="(max-width: 1024px) 90vw, 45vw"
              priority
              hoverZoom={false}
              objectPosition="center 60%"
            />
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
              We&rsquo;re building the 2027 team. Pick a role below, or if
              nothing fits yet, apply as a Generalist and we&rsquo;ll find
              the right fit together.
            </p>
          </div>
          <RolesBoard roles={roles} />
        </div>
      </section>

      {/* HOW IT WORKS: maroon, a three-step path */}
      <section className="relative overflow-hidden bg-[#2a0604] text-white">
        <GhostX className="pointer-events-none absolute -bottom-44 -left-36 h-[620px] w-[620px] text-white opacity-[0.06]" />
        <div className="relative mx-auto grid max-w-[1240px] items-start gap-12 px-5 py-20 md:px-12 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div className="flex flex-col gap-9">
            <h2
              className="isolate font-sans font-medium balance"
              style={{ ...display, fontSize: "clamp(2.75rem, 6vw, 5.75rem)", lineHeight: 0.9, letterSpacing: "-0.045em" }}
            >
              From hello to the <Hl>team</Hl> in three steps.
            </h2>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[24px]">
              <PhotoFill
                src="/images/participate/volunteer-steps.webp"
                alt="A TEDxNewy volunteer greeting guests at Signal, October 2026"
                sizes="(max-width: 1024px) 90vw, 40vw"
                hoverZoom={false}
                objectPosition="center 30%"
              />
            </div>
          </div>
          <ol className="relative flex flex-col">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="relative grid grid-cols-[64px_30px_minmax(0,1fr)] gap-x-3 pb-14 last:pb-0 md:grid-cols-[96px_34px_minmax(0,1fr)] md:gap-x-[18px]"
              >
                {/* The path runs dot to dot, so it starts at the first dot and stops at the last. */}
                {i > 0 && (
                  <span aria-hidden className="absolute left-[90px] top-0 h-[28px] w-[2px] bg-[#ff9b8f]/35 md:left-[130px] md:h-[32px]" />
                )}
                {!s.last && (
                  <span aria-hidden className="absolute bottom-0 left-[90px] top-[28px] w-[2px] bg-[#ff9b8f]/35 md:left-[130px] md:top-[32px]" />
                )}
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
    </ApplyProvider>
  );
}
