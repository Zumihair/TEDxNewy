import { redirect } from "next/navigation";

// Retired: "Add speaker" is now a modal on /admin/speakers itself.
export default function NewSpeakerRedirect() {
  redirect("/admin/speakers");
}
