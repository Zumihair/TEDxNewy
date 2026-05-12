import Link from "next/link";
import { EyeOff, Pencil, Plus, Trash2, User } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import {
  Badge,
  Card,
  DangerButton,
  Flash,
  PageHeader,
  PrimaryButton,
} from "../ui";
import { deleteTeamMember } from "./actions";

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  await requireAdmin();
  const { saved, deleted } = await searchParams;
  const supabase = await getServerSupabase();

  const { data: members } = await supabase
    .from("cms_team_members")
    .select("*")
    .order("is_active", { ascending: false })
    .order("display_order", { ascending: true });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Team"
        title="Your crew on /team"
        description={`${members?.length ?? 0} team members. Inactive members are hidden from the public site but kept for reference. Drives /team with ISR every 60s.`}
        actions={
          <Link href="/admin/team/new">
            <PrimaryButton type="button">
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              Add team member
            </PrimaryButton>
          </Link>
        }
      />

      {saved && <Flash tone="ok">Saved.</Flash>}
      {deleted && <Flash tone="ok">Deleted.</Flash>}

      {(members?.length ?? 0) === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] px-6 py-16 text-center">
          <p className="text-[15px] text-[#2a2521]">
            No team members yet. Hit Add team member to introduce your first.
          </p>
        </div>
      ) : (
        <Card>
          <ul className="divide-y divide-[rgba(20,18,16,0.08)]">
            {(members ?? []).map((m) => (
              <li
                key={m.slug}
                className="grid grid-cols-[56px_1fr_auto] items-center gap-4 px-4 py-3.5 md:gap-5 md:px-5"
              >
                <Link
                  href={`/admin/team/${encodeURIComponent(m.slug)}`}
                  className="relative block aspect-[4/5] w-14 overflow-hidden rounded bg-[#1a1714]"
                  aria-label={`Edit ${m.name}`}
                >
                  {m.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.image_url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/40">
                      <User className="h-4 w-4" strokeWidth={2} />
                    </div>
                  )}
                </Link>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/team/${encodeURIComponent(m.slug)}`}
                      className="font-sans text-[15px] font-medium tracking-[-0.005em] text-[#141210] hover:text-[#e02214]"
                    >
                      {m.name}
                    </Link>
                    {!m.is_active && (
                      <Badge tone="neutral">
                        <EyeOff className="mr-1 h-3 w-3" strokeWidth={2.25} />
                        Hidden
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6b6459]">
                    {m.role && <span>{m.role}</span>}
                    <span className="font-mono text-[10.5px] text-[#6b6459]/70">
                      {m.slug}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/team/${encodeURIComponent(m.slug)}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                    Edit
                  </Link>
                  <form action={deleteTeamMember}>
                    <input type="hidden" name="slug" value={m.slug} />
                    <DangerButton type="submit">
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                      Delete
                    </DangerButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
