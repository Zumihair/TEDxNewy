import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ds";
import { getVolunteerRole } from "@/lib/volunteer-roles";
import { GhostX } from "../../RolesBoard";
import { Hl, VolunteerForm, display } from "../../shared";

// One posted volunteer role with its own application form. Only open roles
// render; a draft, closed or unknown slug is a 404. Listed in Nav's heroIsDark.

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const role = await getVolunteerRole((await params).slug);
  if (!role) return { title: "Volunteer with us · TEDxNewy" };
  return {
    title: `${role.title} · Volunteer with us · TEDxNewy`,
    description: role.summary,
    alternates: { canonical: `/volunteer/roles/${role.slug}` },
  };
}

export default async function VolunteerRolePage({ params }: Props) {
  const role = await getVolunteerRole((await params).slug);
  if (!role) notFound();

  const facts = [
    { label: "Crew", value: role.crew },
    { label: "Time", value: role.time },
    { label: "Where", value: role.where },
  ].filter((f) => f.value);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-black text-white">
        <GhostX className="pointer-events-none absolute -right-40 -top-24 h-[560px] w-[560px] text-white opacity-[0.06]" />
        <div className="relative mx-auto flex max-w-[1240px] flex-col gap-7 px-5 pb-16 pt-32 md:px-12 md:pb-20 md:pt-40">
          <Link
            href="/volunteer#roles"
            className="inline-flex items-center gap-2 self-start text-[15px] font-medium text-white/80 transition-colors hover:text-[#ff9b8f]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            All open roles
          </Link>
          <h1
            className="max-w-[16ch] font-sans font-medium balance"
            style={{ ...display, fontSize: "clamp(3rem, 7vw, 6.5rem)", lineHeight: 0.9, letterSpacing: "-0.045em" }}
          >
            {role.title}
          </h1>
          <p className="max-w-[640px] text-[18px] leading-[1.6] text-white/85 md:text-[19px]">{role.summary}</p>
          {facts.length > 0 && (
            <ul className="flex flex-wrap gap-2.5">
              {facts.map((f) => (
                <li
                  key={f.label}
                  className="inline-flex min-h-9 items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[14px] text-white"
                >
                  {f.value}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="#apply" variant="accent" size="lg">
              Apply for this role
            </Button>
          </div>
        </div>
      </section>

      {/* THE ROLE */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-[1240px] items-start gap-10 px-5 py-16 md:px-12 md:py-24 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-14">
          <div className="flex flex-col">
            <RoleList title="What you'll do" items={role.does} filled />
            {role.helps && <RoleList title="What helps" items={role.helps} />}
          </div>
          <aside className="flex flex-col gap-4 rounded-[24px] bg-[#f4efe6] p-7 lg:sticky lg:top-24">
            <h2 className="font-sans text-[24px] font-medium leading-tight tracking-[-0.02em] text-black" style={display}>
              The short version
            </h2>
            <dl className="flex flex-col">
              {facts.map((f) => (
                <div key={f.label} className="flex justify-between gap-4 border-t border-black/10 py-3 text-[15px] first:border-t-0">
                  <dt className="text-[#6b6459]">{f.label}</dt>
                  <dd className="text-right font-medium text-black">{f.value}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 border-t border-black/10 py-3 text-[15px]">
                <dt className="text-[#6b6459]">Paid</dt>
                <dd className="text-right font-medium text-black">No, all of us volunteer</dd>
              </div>
            </dl>
            <Button href="#apply" variant="accent" size="lg">
              Apply for this role
            </Button>
          </aside>
        </div>
      </section>

      {/* APPLY */}
      <section id="apply" className="scroll-mt-24 bg-[#f4efe6]">
        <div className="mx-auto flex max-w-[900px] flex-col gap-9 px-5 py-20 md:px-12 md:py-28">
          <div className="flex flex-col gap-4">
            <h2
              className="font-sans font-medium text-black balance"
              style={{ ...display, fontSize: "clamp(2.5rem, 5vw, 4.5rem)", lineHeight: 0.95, letterSpacing: "-0.04em" }}
            >
              Apply for <Hl>{role.title}</Hl>.
            </h2>
            <p className="text-[17px] leading-[1.6] text-[#2a2521]">
              A few minutes, that&rsquo;s all. Someone from the team will be in touch to have a chat.
            </p>
          </div>
          <VolunteerForm role={role} />
        </div>
      </section>
    </>
  );
}

function RoleList({ title, items, filled = false }: { title: string; items: string[]; filled?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-5 border-t border-black/10 py-9 first:border-t-0 first:pt-0">
      <h2 className="font-sans text-[30px] font-medium leading-none tracking-[-0.03em] text-black md:text-[36px]" style={display}>
        {title}
      </h2>
      <ul className="flex flex-col gap-3">
        {items.map((d) => (
          <li key={d} className="flex items-start gap-3 text-[17px] leading-[1.55] text-[#2a2521]">
            <span
              aria-hidden
              className={
                "mt-[9px] h-2.5 w-2.5 shrink-0 rounded-full " +
                (filled ? "bg-[#e62b1e]" : "border-2 border-[#e62b1e]")
              }
            />
            <span>{d}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
