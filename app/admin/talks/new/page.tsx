import { requireAdmin } from "@/lib/cms-auth";
import TalkForm from "../TalkForm";
import { createTalk } from "../actions";
import { getEventOptions } from "../../events/options";

export default async function NewTalkPage() {
  await requireAdmin();
  const events = await getEventOptions();
  return (
    <TalkForm
      mode="new"
      initial={{ year: 2025, event: "Reframe" }}
      events={events}
      action={createTalk}
    />
  );
}
