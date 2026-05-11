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
  const { data: speaker } = await supabase
    .from("cms_speakers")
    .select("*")
    .eq("slug", decodeURIComponent(slug))
    .single();
  if (!speaker) notFound();

  return (
    <SpeakerForm
      mode="edit"
      initial={{
        slug: speaker.slug,
        name: speaker.name,
        title: speaker.title,
        talk: speaker.talk,
        blurb: speaker.blurb,
        year: speaker.year,
        accent: speaker.accent,
        image_url: speaker.image_url,
        display_order: speaker.display_order,
      }}
      action={updateSpeaker}
    />
  );
}
