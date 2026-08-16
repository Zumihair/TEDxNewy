import { notFound } from "next/navigation";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import TalkForm from "../TalkForm";
import { updateTalk } from "../actions";
import { getEventOptions } from "../../events/options";

export default async function EditTalkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireFullAdmin();
  const { id } = await params;
  const supabase = await getServerSupabase();
  const [{ data: talk }, events] = await Promise.all([
    supabase
      .from("cms_talks")
      .select("*")
      .eq("id", decodeURIComponent(id))
      .single(),
    getEventOptions(),
  ]);
  if (!talk) notFound();

  return (
    <TalkForm
      mode="edit"
      initial={{
        id: talk.id,
        speaker: talk.speaker,
        speaker_slug: talk.speaker_slug,
        title: talk.title,
        year: talk.year,
        event: talk.event,
        event_id: talk.event_id ?? null,
        youtube_id: talk.youtube_id,
        blurb: talk.blurb,
        display_order: talk.display_order,
      }}
      events={events}
      action={updateTalk}
    />
  );
}
