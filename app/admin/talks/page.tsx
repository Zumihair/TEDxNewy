import { RefreshCw } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { youtubeApiKey } from "@/lib/youtube";
import { Flash, PageHeader, SecondaryButton } from "../ui";
import AddRecordButton from "../AddRecordButton";
import { getEventOptions } from "../events/options";
import TalksTable from "./TalksTable";
import TalkForm from "./TalkForm";
import { createTalk, refreshTalkStats } from "./actions";
import FlashToast from "../FlashToast";

export default async function AdminTalksPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    deleted?: string;
    refreshed?: string;
    "refresh-error"?: string;
  }>;
}) {
  await requireFullAdmin();
  const params = await searchParams;
  const { saved, deleted, refreshed } = params;
  const refreshError = params["refresh-error"];
  const supabase = await getServerSupabase();

  const [{ data: talks }, { data: stats }, events] = await Promise.all([
    supabase
      .from("cms_talks")
      .select("*")
      .order("year", { ascending: false })
      .order("display_order", { ascending: true }),
    supabase.from("cms_talk_stats").select("*"),
    getEventOptions(),
  ]);

  // Splice stats into each talk by talk_id for the table.
  const statsById = new Map(
    (stats ?? []).map((s) => [s.talk_id as string, s]),
  );
  const talksWithStats = (talks ?? []).map((t) => ({
    ...t,
    view_count: statsById.get(t.id as string)?.view_count as number | null | undefined,
    stats_fetched_at: statsById.get(t.id as string)?.fetched_at as string | null | undefined,
  }));

  const lastFetched = (stats ?? [])
    .map((s) => s.fetched_at as string | null)
    .filter((v): v is string => Boolean(v))
    .sort()
    .at(-1);
  const hasKey = Boolean(youtubeApiKey());

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Talks"
        title="The talk archive"
        description={`${talks?.length ?? 0} talks live on /talks. Edits propagate within ~60 seconds of saving.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <form action={refreshTalkStats}>
              <SecondaryButton type="submit">
                <RefreshCw className="h-4 w-4" strokeWidth={2.25} />
                Refresh views
              </SecondaryButton>
            </form>
            <AddRecordButton label="Add talk">
              <TalkForm mode="new" initial={{}} events={events} action={createTalk} />
            </AddRecordButton>
          </div>
        }
      />

      {saved && (
        <FlashToast clear="saved">Saved — changes are live within a minute.</FlashToast>
      )}
      {deleted && <FlashToast clear="deleted">Deleted.</FlashToast>}
      {refreshed && (
        <FlashToast clear="refreshed">
          Refreshed {refreshed} talk{refreshed === "1" ? "" : "s"} from the
          YouTube Data API.
        </FlashToast>
      )}
      {refreshError && (
        <FlashToast tone="error" clear="refresh-error">
          {refreshError}
        </FlashToast>
      )}
      {!hasKey && (
        <Flash tone="info">
          YouTube view counts are disabled — set <code>YOUTUBE_API_KEY</code> in
          Vercel to enable. The rest of the admin works as normal.
        </Flash>
      )}
      {hasKey && lastFetched && (
        <p className="text-[12px] text-[#6b6459]">
          Views last refreshed{" "}
          {new Date(lastFetched).toLocaleString("en-AU", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
          .
        </p>
      )}

      <TalksTable talks={talksWithStats as never} events={events} />
    </div>
  );
}
