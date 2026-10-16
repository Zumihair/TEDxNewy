import { redirect } from "next/navigation";

// The newsletter hub tiles were replaced by one switcher (Campaigns, Subscribers,
// Welcome flow), so the area opens on Campaigns.
export default function AdminNewsletterHub() {
  redirect("/admin/newsletter/campaigns");
}
