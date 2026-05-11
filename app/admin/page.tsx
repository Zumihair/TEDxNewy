import Link from "next/link";
import { ArrowUpRight, Film, Users, UserCog } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Badge, Card, PageHeader, SectionLabel } from "./ui";

export default async function AdminDashboard() {
  const { email } = await requireAdmin();
  const supabase = await getServerSupabase();

  const [{ count: talkCount }, { count: speakerCount }, { count: adminCount }] =
    await Promise.all([
      supabase.from("cms_talks").select("*", { count: "exact", head: true }),
      supabase.from("cms_speakers").select("*", { count: "exact", head: true }),
      supabase.from("cms_admins").select("*", { count: "exact", head: true }),
    ]);

  // Recent activity — latest 5 changed rows across talks + speakers
  const { data: recentTalks } = await supabase
    .from("cms_talks")
    .select("id, title, speaker, updated_at, youtube_id")
    .order("updated_at", { ascending: false })
    .limit(3);
  const { data: recentSpeakers } = await supabase
    .from("cms_speakers")
    .select("slug, name, updated_at, image_url")
    .order("updated_at", { ascending: false })
    .limit(3);

  const recent = [
    ...(recentTalks ?? []).map((t) => ({
      kind: "talk" as const,
      id: t.id,
      title: t.title,
      sub: t.speaker,
      href: `/admin/talks/${encodeURIComponent(t.id)}`,
      thumb: `https://i.ytimg.com/vi/${t.youtube_id}/default.jpg`,
      updated_at: t.updated_at,
    })),
    ...(recentSpeakers ?? []).map((s) => ({
      kind: "speaker" as const,
      id: s.slug,
      title: s.name,
      sub: "Speaker",
      href: `/admin/speakers/${encodeURIComponent(s.slug)}`,
      thumb: s.image_url ?? "",
      updated_at: s.updated_at,
    })),
  ]
    .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
    .slice(0, 5);

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
              tedxnewy.vercel.app
            </Link>{" "}
            within ~60 seconds.
          </>
        }
      />

      {/* Stats */}
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard
          label="Talks"
          value={talkCount ?? 0}
          href="/admin/talks"
          tone="red"
        />
        <StatCard
          label="Speakers"
          value={speakerCount ?? 0}
          href="/admin/speakers"
        />
        <StatCard
          label="Team admins"
          value={adminCount ?? 0}
          href="/admin/team"
        />
      </ul>

      {/* Modules */}
      <section className="space-y-5">
        <SectionLabel>What you can edit</SectionLabel>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ModuleCard
            href="/admin/talks"
            icon={<Film className="h-4 w-4" strokeWidth={2.25} />}
            title="Talks"
            blurb="Add, edit, reorder, or remove TEDxCooksHill / TEDxNewy talks. Drives /watch with ISR every 60s."
            status="live"
          />
          <ModuleCard
            href="/admin/speakers"
            icon={<Users className="h-4 w-4" strokeWidth={2.25} />}
            title="Speakers"
            blurb="Curate the speaker lineup year by year. Edit bios, titles, talk titles and portrait URLs. Drives /speakers."
            status="live"
          />
          <ModuleCard
            href="/admin/team"
            icon={<UserCog className="h-4 w-4" strokeWidth={2.25} />}
            title="Team access"
            blurb="Add or remove admin emails for the CMS. Magic-link sign-in is enforced for every change."
            status="live"
          />
          <ModuleCard
            href="#"
            icon={<Film className="h-4 w-4" strokeWidth={2.25} />}
            title="Site settings"
            blurb="Coming next: editable hero copy, ORG details, social handles, acknowledgment."
            status="soon"
          />
        </ul>
      </section>

      {/* Recent activity */}
      {recent.length > 0 && (
        <section className="space-y-5">
          <SectionLabel>Recently edited</SectionLabel>
          <Card>
            <ul className="divide-y divide-[rgba(20,18,16,0.08)]">
              {recent.map((r) => (
                <li key={`${r.kind}-${r.id}`}>
                  <Link
                    href={r.href}
                    className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-[rgba(20,18,16,0.03)]"
                  >
                    <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded bg-[#1a1714]">
                      {r.thumb && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.thumb}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-medium text-[#141210]">
                        {r.title}
                      </div>
                      <div className="text-[12px] text-[#6b6459]">
                        {r.sub} · updated{" "}
                        {relativeTime(new Date(r.updated_at))}
                      </div>
                    </div>
                    <Badge tone={r.kind === "talk" ? "red" : "neutral"}>
                      {r.kind}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
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

function relativeTime(d: Date): string {
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function StatCard({
  label,
  value,
  href,
  tone = "neutral",
}: {
  label: string;
  value: number;
  href: string;
  tone?: "neutral" | "red";
}) {
  return (
    <li>
      <Link
        href={href}
        className="group block rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[rgba(20,18,16,0.18)] hover:shadow-[var(--shadow-sm)]"
      >
        <div className="flex items-center justify-between">
          <div
            className="font-mono text-[10px] font-semibold uppercase text-[#6b6459]"
            style={{ letterSpacing: "0.24em" }}
          >
            {label}
          </div>
          <ArrowUpRight
            className={
              "h-3.5 w-3.5 transition-colors " +
              (tone === "red"
                ? "text-[#e02214]"
                : "text-[#6b6459] group-hover:text-[#141210]")
            }
            strokeWidth={2.25}
          />
        </div>
        <div
          className="mt-4 font-sans font-medium leading-none tracking-[-0.02em] text-[#141210]"
          style={{
            fontSize: "clamp(2rem, 4vw, 2.75rem)",
            fontVariationSettings: '"opsz" 144',
          }}
        >
          {value}
        </div>
      </Link>
    </li>
  );
}

function ModuleCard({
  href,
  icon,
  title,
  blurb,
  status,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  blurb: string;
  status: "live" | "soon";
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
        <Badge tone={status === "live" ? "live" : "soon"}>{status}</Badge>
      </div>
      <div className="mt-5 font-sans text-[18px] font-medium leading-tight tracking-[-0.01em] text-[#141210]">
        {title}
      </div>
      <p className="mt-1.5 text-[13.5px] leading-[1.5] text-[#6b6459]">
        {blurb}
      </p>
    </>
  );

  if (status === "soon") {
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
