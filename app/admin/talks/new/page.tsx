import { requireAdmin } from "@/lib/cms-auth";
import TalkForm from "../TalkForm";
import { createTalk } from "../actions";

export default async function NewTalkPage() {
  await requireAdmin();
  return <TalkForm mode="new" initial={{ year: 2025, event: "Reframe" }} action={createTalk} />;
}
