import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { PageHeader } from "../ui";
import AddRecordButton from "../AddRecordButton";
import TeamList, { type TeamRow } from "./TeamList";
import TeamMemberForm, { type MemberLogin } from "./TeamMemberForm";
import { createTeamMember } from "./actions";
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

  const { data: adminRows } = await supabase.from("cms_admins").select("*").not("team_slug", "is", null);
  const logins: Record<string, MemberLogin> = {};
  for (const r of (adminRows ?? []) as Record<string, unknown>[]) {
    const admin = typeof r.is_admin === "boolean" ? r.is_admin : r.access_level !== "community";
    logins[String(r.team_slug)] = {
      email: String(r.email),
      admin,
      canEdit: admin || (typeof r.can_edit === "boolean" ? r.can_edit : true),
    };
  }

  return (
    <div className="adm-stack">
      <PageHeader
        title="Your crew on /team"
        description={`${members?.length ?? 0} team members. Inactive members are hidden from the public site but kept for reference. Drives /team, updates within a minute.`}
        actions={
          <AddRecordButton label="Add team member">
            <TeamMemberForm
              mode="new"
              initial={{ is_active: true }}
              action={createTeamMember}
            />
          </AddRecordButton>
        }
      />

      {saved && <FlashToast clear="saved">Saved.</FlashToast>}
      {deleted && <FlashToast clear="deleted">Deleted.</FlashToast>}

      <TeamList members={(members ?? []) as TeamRow[]} logins={logins} />
    </div>
  );
}
