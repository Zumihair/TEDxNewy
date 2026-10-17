import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { PageHeader } from "../ui";
import AddRecordButton from "../AddRecordButton";
import SponsorsList, { type SponsorRow } from "./SponsorsList";
import type { SponsorFile } from "./SponsorFiles";
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

  // The files shelf needs its table; until the SQL is run the list simply shows a note.
  const { data: fileRows, error: filesError } = await supabase
    .from("sponsor_files")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="adm-stack">
      <PageHeader
        title="Sponsors"
        actions={
          <AddRecordButton label="Add sponsor">
            <SponsorForm mode="new" initial={{}} action={createSponsor} />
          </AddRecordButton>
        }
      />

      {saved && <FlashToast clear="saved">Saved.</FlashToast>}
      {deleted && <FlashToast clear="deleted">Deleted.</FlashToast>}

      <SponsorsList
        sponsors={(sponsors ?? []) as SponsorRow[]}
        files={(fileRows ?? []) as SponsorFile[]}
        filesReady={!filesError}
      />
    </div>
  );
}
