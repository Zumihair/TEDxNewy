import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Flash, PageHeader, PrimaryButton } from "../ui";
import TalksTable from "./TalksTable";

export default async function AdminTalksPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  await requireAdmin();
  const { saved, deleted } = await searchParams;
  const supabase = await getServerSupabase();

  const { data: talks } = await supabase
    .from("cms_talks")
    .select("*")
    .order("year", { ascending: false })
    .order("display_order", { ascending: true });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Talks"
        title="The talk archive"
        description={`${talks?.length ?? 0} talks live on /watch. Edits propagate within ~60 seconds of saving.`}
        actions={
          <Link href="/admin/talks/new">
            <PrimaryButton type="button">
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              Add talk
            </PrimaryButton>
          </Link>
        }
      />

      {saved && <Flash tone="ok">Saved — changes are live within a minute.</Flash>}
      {deleted && <Flash tone="ok">Deleted.</Flash>}

      <TalksTable talks={(talks ?? []) as never} />
    </div>
  );
}
