import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { bufferConfigured } from "@/lib/buffer-social";
import { Card, NotSetUp, PageHeader } from "../ui";
import { PendingButton } from "../PendingButtons";
import { createPost } from "./actions";
import ConnectionsCard from "./ConnectionsCard";
import PostsList from "./PostsList";
import { type PostStatus, type SocialConnectionRow, type SocialPostWithMedia } from "./shared";
import FlashToast from "../FlashToast";

export const metadata = {
  title: "Socials · Admin · TEDxNewy",
};

type Tab = "drafts" | "scheduled" | "posted";

const TABS: { key: Tab; label: string; status: PostStatus }[] = [
  { key: "drafts", label: "Drafts", status: "draft" },
  { key: "scheduled", label: "Scheduled", status: "scheduled" },
  { key: "posted", label: "Posted", status: "posted" },
];

export default async function AdminSocialsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; deleted?: string; error?: string }>;
}) {
  await requireAdmin();
  const { tab: tabParam, deleted, error: flashError } = await searchParams;
  const tab: Tab =
    tabParam === "scheduled" || tabParam === "posted" ? tabParam : "drafts";
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("social_posts")
    .select("*, social_post_media(image_url, display_order, media_type)")
    .order("updated_at", { ascending: false });
  const { data: connectionRows } = await supabase
    .from("social_connections")
    .select("*");

  const posts = (data ?? []) as SocialPostWithMedia[];
  const activeStatus = TABS.find((t) => t.key === tab)!.status;
  const shown = posts.filter((p) => p.status === activeStatus);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Community · Socials"
        title="Socials"
        description="The drafts log for Instagram, Facebook and LinkedIn, from drafts through to posted."
        actions={
          !error && (
            <form action={createPost}>
              <PendingButton icon={<Plus className="h-4 w-4" strokeWidth={2.25} />}>
                New draft
              </PendingButton>
            </form>
          )
        }
      />

      {deleted && <FlashToast clear="deleted">Deleted.</FlashToast>}
      {flashError === "create" && (
        <FlashToast tone="error" clear="error">
          Could not create a draft. Try again.
        </FlashToast>
      )}

      <ConnectionsCard connections={(connectionRows ?? []) as SocialConnectionRow[]} />

      {error ? (
        <NotSetUp title="Socials isn't set up yet">
          The socials database update (20260719b_social_posts.sql)
          hasn&rsquo;t been applied yet. Run it in the Supabase SQL editor,
          then reload this page.
        </NotSetUp>
      ) : (
        <>
          {/* Tab bar, matching /admin/newsletter/campaigns */}
          <div className="flex items-center gap-1 border-b border-[rgba(20,18,16,0.10)]">
            {TABS.map((t) => {
              const active = t.key === tab;
              const count = posts.filter((p) => p.status === t.status).length;
              return (
                <Link
                  key={t.key}
                  href={`/admin/socials?tab=${t.key}`}
                  className={
                    "-mb-px border-b-2 px-4 py-2.5 text-[13.5px] font-medium transition-colors " +
                    (active
                      ? "border-[#e02214] text-[#141210]"
                      : "border-transparent text-[#6b6459] hover:text-[#141210]")
                  }
                >
                  {t.label} · {count}
                </Link>
              );
            })}
          </div>

          {shown.length === 0 ? (
            <Card className="px-6 py-14 text-center">
              <div className="font-sans text-[16px] font-medium text-[#141210]">
                {tab === "drafts" ? "No drafts yet" : `Nothing ${tab} right now`}
              </div>
              <p className="mx-auto mt-1.5 max-w-[48ch] text-[13.5px] leading-[1.6] text-[#6b6459]">
                {tab === "drafts"
                  ? "Start a draft, write the caption, and design the graphics without leaving the admin."
                  : "Posts move between statuses from inside their editor."}
              </p>
            </Card>
          ) : (
            // Drafts group by stage: ready at the top, early drafts last, so
            // what's closest to going out reads first. Only that tab
            // groups — stage is a drafting judgement and stops being shown
            // at all once a post is scheduled or posted.
            <PostsList
              rows={shown}
              tab={tab}
              grouped={tab === "drafts"}
              bufferOn={bufferConfigured()}
            />
          )}
        </>
      )}
    </div>
  );
}
