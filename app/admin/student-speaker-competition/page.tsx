import { redirect } from "next/navigation";

// Consolidated into the Forms hub. Kept so old bookmarks keep working.
export default function AdminStudentSpeakerRedirect() {
  redirect("/admin/forms/student-speaker");
}
