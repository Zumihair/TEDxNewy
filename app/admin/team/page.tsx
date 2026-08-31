import Link from "next/link";
import { Plus } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { PageHeader, PrimaryButton } from "../ui";
import TeamList, { type TeamRow } from "./TeamList";
import FlashToast from "../FlashToast";

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  await requireFullAdmin();
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
        description={`${members?.length ?? 0} team members. Inactive members are hidden from the public site but kept for reference. Drives /team, updates within a minute.`}
        actions={
          <Link href="/admin/team/new">
            <PrimaryButton type="button">
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              Add team member
            </PrimaryButton>
          </Link>
        }
      />

      {saved && <FlashToast clear="saved">Saved.</FlashToast>}
      {deleted && <FlashToast clear="deleted">Deleted.</FlashToast>}

      <TeamList members={(members ?? []) as TeamRow[]} />
    </div>
  );
}
