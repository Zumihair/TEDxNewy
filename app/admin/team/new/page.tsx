import { requireAdmin } from "@/lib/cms-auth";
import TeamMemberForm from "../TeamMemberForm";
import { createTeamMember } from "../actions";

export default async function NewTeamMemberPage() {
  await requireAdmin();
  return (
    <TeamMemberForm
      mode="new"
      initial={{ is_active: true }}
      action={createTeamMember}
    />
  );
}
