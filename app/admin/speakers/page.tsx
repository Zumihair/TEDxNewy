import { requireFullAdmin } from "@/lib/cms-auth";
import TalksSpeakersNav from "../talks/TalksSpeakersNav";
import { getServerSupabase } from "@/lib/supabase-server";
import { PageHeader } from "../ui";
import AddRecordButton from "../AddRecordButton";
import { getEventOptions } from "../events/options";
import SpeakersList, { type SpeakerRow } from "./SpeakersList";
import SpeakerForm from "./SpeakerForm";
import { createSpeaker } from "./actions";
import FlashToast from "../FlashToast";

export default async function AdminSpeakersPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  await requireFullAdmin();
  const { saved, deleted } = await searchParams;
  const supabase = await getServerSupabase();

  const [{ data: speakers }, { data: talkRows }, events] = await Promise.all([
    supabase
      .from("cms_speakers")
      .select("*")
      .order("year", { ascending: false })
      .order("display_order", { ascending: true }),
    supabase
      .from("cms_talks")
      .select("id, speaker, title, year")
      .order("year", { ascending: false })
      .order("display_order", { ascending: true }),
    getEventOptions(),
  ]);
  const talks = (talkRows ?? []).map((t) => ({
    id: t.id as string,
    label: `${t.speaker} · ${t.title} (${t.year})`,
  }));

  return (
    <div className="adm-stack">
      <PageHeader
        title="Talks and speakers"
        actions={
          <AddRecordButton label="Add speaker">
            <SpeakerForm
              mode="new"
              initial={{ year: 2025 }}
              talks={talks}
              events={events}
              action={createSpeaker}
            />
          </AddRecordButton>
        }
      />

      <TalksSpeakersNav active="speakers" counts={{ talks: talks.length, speakers: speakers?.length ?? 0 }} />

      {saved && <FlashToast clear="saved">Saved.</FlashToast>}
      {deleted && <FlashToast clear="deleted">Deleted.</FlashToast>}

      <SpeakersList
        speakers={(speakers ?? []) as SpeakerRow[]}
        talks={talks}
        events={events}
      />
    </div>
  );
}
