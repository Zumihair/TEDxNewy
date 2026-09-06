import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { PageHeader } from "../ui";
import AddRecordButton from "../AddRecordButton";
import SponsorsList, { type SponsorRow } from "./SponsorsList";
import SponsorForm from "./SponsorForm";
import { createSponsor } from "./actions";
import FlashToast from "../FlashToast";

export default async function AdminSponsorsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  await requireFullAdmin();
  const { saved, deleted } = await searchParams;
  const supabase = await getServerSupabase();

  const { data: sponsors } = await supabase
    .from("cms_sponsors")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Sponsors"
        title="Partners"
        description={`${sponsors?.length ?? 0} sponsors on the roster. Drives /sponsors and the Signal sponsor teaser.`}
        actions={
          <AddRecordButton label="Add sponsor">
            <SponsorForm mode="new" initial={{}} action={createSponsor} />
          </AddRecordButton>
        }
      />

      {saved && <FlashToast clear="saved">Saved.</FlashToast>}
      {deleted && <FlashToast clear="deleted">Deleted.</FlashToast>}

      <SponsorsList sponsors={(sponsors ?? []) as SponsorRow[]} />
    </div>
  );
}
