import Link from "next/link";
import { Plus } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Flash, PageHeader, PrimaryButton } from "../ui";
import SponsorsList, { type SponsorRow } from "./SponsorsList";

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
          <Link href="/admin/sponsors/new">
            <PrimaryButton type="button">
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              Add sponsor
            </PrimaryButton>
          </Link>
        }
      />

      {saved && <Flash tone="ok">Saved.</Flash>}
      {deleted && <Flash tone="ok">Deleted.</Flash>}

      <SponsorsList sponsors={(sponsors ?? []) as SponsorRow[]} />
    </div>
  );
}
