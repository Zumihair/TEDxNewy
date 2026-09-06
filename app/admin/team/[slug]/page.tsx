import { redirect } from "next/navigation";

// Retired: editing a team member is now a modal on /admin/team itself.
export default function EditTeamMemberRedirect() {
  redirect("/admin/team");
}
