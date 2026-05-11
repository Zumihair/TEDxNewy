import Link from "next/link";
import { ArrowUpRight, Film, Users, Layers, Settings } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";

export default async function AdminDashboard() {
  await requireAdmin();
  const supabase = await getServerSupabase();
  const { count: talkCount } = await supabase
    .from("cms_talks")
    .select("*", { count: "exact", head: true });

  const stats = [
    { label: "Talks", value: talkCount ?? 0, href: "/admin/talks" },
  ];

  return (
    <>
      <div className="flex flex-col gap-3">
        <div
          className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
          style={{ letterSpacing: "0.24em" }}
        >
          Dashboard
        </div>
        <h1
          className="font-sans tracking-[-0.025em] text-[#141210] balance"
          style={{
            fontSize: "clamp(2rem, 4vw, 2.75rem)",
            lineHeight: 1.04,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          Welcome back.
        </h1>
        <p className="max-w-[58ch] text-[15.5px] leading-[1.6] text-[#2a2521]">
          Edit the live site without redeploying. Changes you make here flow
          to <Link href="/watch" className="underline decoration-[#e02214]/40 underline-offset-2 hover:text-[#e02214]">tedxnewy.vercel.app</Link>{" "}
          within a minute.
        </p>
      </div>

      {/* Stat cards */}
      <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className="group block rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[rgba(20,18,16,0.18)] hover:shadow-[var(--shadow-sm)]"
            >
              <div
                className="font-mono text-[10px] font-semibold uppercase text-[#6b6459]"
                style={{ letterSpacing: "0.24em" }}
              >
                {s.label}
              </div>
              <div
                className="mt-3 font-sans font-medium leading-none tracking-[-0.02em] text-[#141210]"
                style={{
                  fontSize: "clamp(2rem, 4vw, 2.75rem)",
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                {s.value}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Sections */}
      <div className="mt-14">
        <div
          className="font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
          style={{ letterSpacing: "0.24em" }}
        >
          What you can edit
        </div>
        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <SectionCard
            href="/admin/talks"
            icon={<Film className="h-4 w-4" strokeWidth={2.25} />}
            title="Talks"
            blurb="Add, edit, reorder, or remove TEDxCooksHill / TEDxNewy talks. Drives /watch."
          />
          <SectionCard
            href="#"
            icon={<Users className="h-4 w-4" strokeWidth={2.25} />}
            title="Speakers"
            blurb="Coming next: edit speaker bios, upload portraits. Drives /speakers."
            soon
          />
          <SectionCard
            href="#"
            icon={<Layers className="h-4 w-4" strokeWidth={2.25} />}
            title="Salons + events"
            blurb="Coming next: announce new events, update venue + date + status."
            soon
          />
          <SectionCard
            href="#"
            icon={<Settings className="h-4 w-4" strokeWidth={2.25} />}
            title="Site settings"
            blurb="Coming next: hero copy, ORG details, social handles, acknowledgment."
            soon
          />
        </ul>
      </div>
    </>
  );
}

function SectionCard({
  href,
  icon,
  title,
  blurb,
  soon,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  blurb: string;
  soon?: boolean;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#141210] text-white"
          aria-hidden
        >
          {icon}
        </span>
        {soon ? (
          <span
            className="rounded-full bg-[rgba(20,18,16,0.06)] px-2.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase text-[#6b6459]"
            style={{ letterSpacing: "0.22em" }}
          >
            Soon
          </span>
        ) : (
          <ArrowUpRight
            className="h-4 w-4 text-[#6b6459] transition-colors group-hover:text-[#e02214]"
            strokeWidth={2.25}
          />
        )}
      </div>
      <div className="mt-5 font-sans text-[18px] font-medium leading-tight tracking-[-0.01em] text-[#141210]">
        {title}
      </div>
      <p className="mt-1.5 text-[13.5px] leading-[1.5] text-[#6b6459]">
        {blurb}
      </p>
    </>
  );

  if (soon) {
    return (
      <li>
        <div className="block rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] p-5 opacity-80">
          {inner}
        </div>
      </li>
    );
  }
  return (
    <li>
      <Link
        href={href}
        className="group block rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[rgba(20,18,16,0.18)] hover:shadow-[var(--shadow-sm)]"
      >
        {inner}
      </Link>
    </li>
  );
}
