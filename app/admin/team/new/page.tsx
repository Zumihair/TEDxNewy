import { redirect } from "next/navigation";

// Retired: "Add team member" is now a modal on /admin/team itself.
export default function NewTeamMemberRedirect() {
  redirect("/admin/team");
}
