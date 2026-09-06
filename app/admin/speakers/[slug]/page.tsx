import { redirect } from "next/navigation";

// Retired: editing a speaker is now a modal on /admin/speakers itself.
export default function EditSpeakerRedirect() {
  redirect("/admin/speakers");
}
