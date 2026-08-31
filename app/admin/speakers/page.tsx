import Link from "next/link";
import { Plus } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { PageHeader, PrimaryButton } from "../ui";
import SpeakersList, { type SpeakerRow } from "./SpeakersList";
import FlashToast from "../FlashToast";

export default async function AdminSpeakersPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  await requireFullAdmin();
  const { saved, deleted } = await searchParams;
  const supabase = await getServerSupabase();

  const { data: speakers } = await supabase
    .from("cms_speakers")
    .select("*")
    .order("year", { ascending: false })
    .order("display_order", { ascending: true });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Speakers"
        title="The lineup"
        description={`${speakers?.length ?? 0} speakers in the archive. Drives /speakers and the speaker links on /talks.`}
        actions={
          <Link href="/admin/speakers/new">
            <PrimaryButton type="button">
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              Add speaker
            </PrimaryButton>
          </Link>
        }
      />

      {saved && <FlashToast clear="saved">Saved.</FlashToast>}
      {deleted && <FlashToast clear="deleted">Deleted.</FlashToast>}

      <SpeakersList speakers={(speakers ?? []) as SpeakerRow[]} />
    </div>
  );
}
