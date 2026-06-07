import Link from "next/link";
import {
  Film,
  Inbox,
  PenSquare,
  ShieldCheck,
  Sliders,
  UserCircle,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Badge, PageHeader, SectionLabel } from "./ui";

const SUBMISSION_TABLES = [
  { id: "nominations", label: "Speakers", href: "/admin/nominations" },
  { id: "applications", label: "Volunteers", href: "/admin/applications" },
  {
    id: "partner_enquiries",
    label: "Sponsors",
    href: "/admin/partner-enquiries",
  },
  { id: "contact_messages", label: "Contact", href: "/admin/contact-messages" },
  { id: "subscribers", label: "Subscribers", href: "/admin/subscribers" },
  {
    id: "youth_futures_registrations",
    label: "Youth Futures Lab",
    href: "/admin/youth-futures",
  },
  {
    id: "student_speaker_submissions",
    label: "Student Speaker",
    href: "/admin/student-speaker-competition",
  },
] as const;

export default async function AdminDashboard() {
  const supabase = await getServerSupabase();

  const [{ email }, counts] = await Promise.all([
    requireAdmin(),
    Promise.all([
      supabase.from("cms_talks").select("*", { count: "exact", head: true }),
      supabase.from("cms_speakers").select("*", { count: "exact", head: true }),
      supabase
        .from("cms_team_members")
        .select("*", { count: "exact", head: true }),
      supabase.from("cms_posts").select("*", { count: "exact", head: true }),
      supabase.from("cms_admins").select("*", { count: "exact", head: true }),
      ...SUBMISSION_TABLES.map((t) =>
        supabase.from(t.id).select("*", { count: "exact", head: true }),
      ),
    ]),
  ]);

  const [
    { count: talkCount },
    { count: speakerCount },
    { count: teamCount },
    { count: postCount },
    { count: adminCount },
    ...submissionCounts
  ] = counts;

  const submissionRows = SUBMISSION_TABLES.map((t, i) => ({
    ...t,
    count: submissionCounts[i]?.count ?? 0,
  }));
  const submissionTotal = submissionRows.reduce((acc, r) => acc + r.count, 0);

  const manage = [
    {
      href: "/admin/talks",
      icon: <Film className="h-4 w-4" strokeWidth={2.25} />,
      title: "Talks",
      blurb: "Add, edit and reorder past TEDxNewy talks. Drives /talks.",
      count: talkCount ?? 0,
    },
    {
      href: "/admin/speakers",
      icon: <Users className="h-4 w-4" strokeWidth={2.25} />,
      title: "Speakers",
      blurb:
        "Curate the speaker lineup year by year: bios, talks, portraits. Drives /speakers.",
      count: speakerCount ?? 0,
    },
    {
      href: "/admin/team",
      icon: <UserCircle className="h-4 w-4" strokeWidth={2.25} />,
      title: "Team",
      blurb: "Organisers, curators and crew on the public /team page.",
      count: teamCount ?? 0,
    },
    {
      href: "/admin/posts",
      icon: <PenSquare className="h-4 w-4" strokeWidth={2.25} />,
      title: "Online Ideas",
      blurb: "Write posts with markdown and live preview. Drives /ideas.",
      count: postCount ?? 0,
    },
    {
      href: "/admin/admins",
      icon: <ShieldCheck className="h-4 w-4" strokeWidth={2.25} />,
      title: "Admins",
      blurb: "Manage the email allowlist that can sign in to this CMS.",
      count: adminCount ?? 0,
    },
  ];

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Dashboard"
        title={greetingFor(email)}
        description={
          <>
            Edit the live site without redeploying. Changes propagate to{" "}
            <Link
              href="/"
              className="underline decoration-[#e02214]/40 underline-offset-2 hover:text-[#e02214]"
            >
              tedxnewy.com.au
            </Link>{" "}
            within ~60 seconds.
          </>
        }
      />

      {/* Manage — content tiles with live counts */}
      <section className="space-y-5">
        <SectionLabel>What you can edit</SectionLabel>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {manage.map((m) => (
            <ManageCard key={m.href} {...m} />
          ))}
          <ManageCard
            href="#"
            icon={<Sliders className="h-4 w-4" strokeWidth={2.25} />}
            title="Site settings"
            blurb="Coming next: editable hero copy, ORG details, social handles."
            soon
          />
        </ul>
      </section>

      {/* Submissions — 4 + 3 */}
      <section className="space-y-5">
        <SectionLabel>
          Submissions · {submissionTotal} total across all forms
        </SectionLabel>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {submissionRows.map((s) => (
            <li key={s.id}>
              <Link
                href={s.href}
                className="group flex h-full flex-col rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[rgba(20,18,16,0.18)] hover:shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="font-mono text-[10px] font-semibold uppercase leading-[1.35] text-[#6b6459]"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    {s.label}
                  </span>
                  <Inbox
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6b6459] group-hover:text-[#141210]"
                    strokeWidth={2.25}
                  />
                </div>
                <div
                  className="mt-auto pt-4 font-sans font-medium leading-none tracking-[-0.02em] text-[#141210]"
                  style={{
                    fontSize: "clamp(1.5rem, 2.6vw, 1.85rem)",
                    fontVariationSettings: '"opsz" 144',
                  }}
                >
                  {s.count}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function greetingFor(email: string) {
  const name = email.split("@")[0];
  const pretty =
    name.charAt(0).toUpperCase() + name.slice(1).replace(/[._-]+/g, " ");
  const hour = new Date().getHours();
  const greet =
    hour < 5 || hour >= 22
      ? "Up late"
      : hour < 12
        ? "Morning"
        : hour < 18
          ? "Afternoon"
          : "Evening";
  return `${greet}, ${pretty}.`;
}

function ManageCard({
  href,
  icon,
  title,
  blurb,
  count,
  soon,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  blurb: string;
  count?: number;
  soon?: boolean;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#141210] text-white"
          aria-hidden
        >
          {icon}
        </span>
        {soon ? (
          <Badge tone="soon">soon</Badge>
        ) : (
          <span
            className="font-sans font-medium leading-none tracking-[-0.02em] text-[#141210]"
            style={{
              fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
              fontVariationSettings: '"opsz" 144',
            }}
          >
            {count}
          </span>
        )}
      </div>
      <div className="mt-5 font-sans text-[17px] font-medium leading-tight tracking-[-0.01em] text-[#141210]">
        {title}
      </div>
      <p className="mt-1.5 text-[13px] leading-[1.5] text-[#6b6459]">{blurb}</p>
    </>
  );

  if (soon) {
    return (
      <li>
        <div className="block h-full rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] p-5 opacity-80">
          {inner}
        </div>
      </li>
    );
  }
  return (
    <li>
      <Link
        href={href}
        className="group block h-full rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[rgba(20,18,16,0.18)] hover:shadow-[var(--shadow-sm)]"
      >
        {inner}
      </Link>
    </li>
  );
}
