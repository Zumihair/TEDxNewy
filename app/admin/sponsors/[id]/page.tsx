import { redirect } from "next/navigation";

// Retired: editing a sponsor is now a modal on /admin/sponsors itself.
export default function EditSponsorRedirect() {
  redirect("/admin/sponsors");
}
