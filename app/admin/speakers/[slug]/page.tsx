import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import SpeakerForm from "../SpeakerForm";
import { updateSpeaker } from "../actions";

export default async function EditSpeakerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const supabase = await getServerSupabase();

  const [{ data: speaker }, { data: talkRows }] = await Promise.all([
    supabase
      .from("cms_speakers")
      .select("*")
      .eq("slug", decodeURIComponent(slug))
      .single(),
    supabase
      .from("cms_talks")
      .select("id, speaker, title, year")
      .order("year", { ascending: false })
      .order("display_order", { ascending: true }),
  ]);
  if (!speaker) notFound();

  const talks = (talkRows ?? []).map((t) => ({
    id: t.id as string,
    label: `${t.speaker} · ${t.title} (${t.year})`,
  }));

  return (
    <SpeakerForm
      mode="edit"
      initial={{
        slug: speaker.slug,
        name: speaker.name,
        title: speaker.title,
        talk_id: speaker.talk_id,
        blurb: speaker.blurb,
        year: speaker.year,
        accent: speaker.accent,
        image_url: speaker.image_url,
        linkedin_url: speaker.linkedin_url,
        instagram_url: speaker.instagram_url,
        display_order: speaker.display_order,
      }}
      talks={talks}
      action={updateSpeaker}
    />
  );
}
