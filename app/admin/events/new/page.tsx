import { redirect } from "next/navigation";

// Retired: there is no "Add event" button any more — new events are added
// directly via SQL/Supabase, not through this form. Editing an existing
// event is a modal on /admin/events itself.
export default function NewEventRedirect() {
  redirect("/admin/events");
}
