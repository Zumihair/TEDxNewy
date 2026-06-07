import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import SpeakerForm from "../SpeakerForm";
import { createSpeaker } from "../actions";

export default async function NewSpeakerPage() {
  await requireAdmin();
  const supabase = await getServerSupabase();
  const { data: talkRows } = await supabase
    .from("cms_talks")
    .select("id, speaker, title, year")
    .order("year", { ascending: false })
    .order("display_order", { ascending: true });
  const talks = (talkRows ?? []).map((t) => ({
    id: t.id as string,
    label: `${t.speaker} · ${t.title} (${t.year})`,
  }));

  return (
    <SpeakerForm
      mode="new"
      initial={{ year: 2025, accent: "red" }}
      talks={talks}
      action={createSpeaker}
    />
  );
}
