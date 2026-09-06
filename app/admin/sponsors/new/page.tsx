import { redirect } from "next/navigation";

// Retired: "Add sponsor" is now a modal on /admin/sponsors itself.
export default function NewSponsorRedirect() {
  redirect("/admin/sponsors");
}
