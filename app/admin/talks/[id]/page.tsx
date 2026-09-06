import { redirect } from "next/navigation";

// Retired: editing a talk is now a modal on /admin/talks itself.
export default function EditTalkRedirect() {
  redirect("/admin/talks");
}
