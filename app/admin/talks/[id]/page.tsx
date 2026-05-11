import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import TalkForm from "../TalkForm";
import { updateTalk } from "../actions";

export default async function EditTalkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await getServerSupabase();
  const { data: talk } = await supabase
    .from("cms_talks")
    .select("*")
    .eq("id", decodeURIComponent(id))
    .single();
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
        youtube_id: talk.youtube_id,
        blurb: talk.blurb,
        display_order: talk.display_order,
      }}
      action={updateTalk}
    />
  );
}
