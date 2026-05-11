import { requireAdmin } from "@/lib/cms-auth";
import SpeakerForm from "../SpeakerForm";
import { createSpeaker } from "../actions";

export default async function NewSpeakerPage() {
  await requireAdmin();
  return (
    <SpeakerForm
      mode="new"
      initial={{ year: 2025, accent: "red" }}
      action={createSpeaker}
    />
  );
}
