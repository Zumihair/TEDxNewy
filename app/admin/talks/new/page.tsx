import { redirect } from "next/navigation";

// Retired: "Add talk" is now a modal on /admin/talks itself.
export default function NewTalkRedirect() {
  redirect("/admin/talks");
}
