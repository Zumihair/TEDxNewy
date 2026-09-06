import { redirect } from "next/navigation";

// Retired: editing an event is now a modal on /admin/events itself.
export default function EditEventRedirect() {
  redirect("/admin/events");
}
