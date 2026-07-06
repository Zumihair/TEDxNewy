import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Flash, PageHeader, PrimaryButton } from "../ui";
import PostsList, { type PostRow } from "./PostsList";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  await requireAdmin();
  const { saved, deleted } = await searchParams;
  const supabase = await getServerSupabase();

  const { data: posts } = await supabase
    .from("cms_posts")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  const rows = (posts ?? []) as PostRow[];
  const drafts = rows.filter((p) => !p.published_at);
  const published = rows.filter((p) => p.published_at);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Online ideas"
        title="The blog"
        description={`${published.length} published, ${drafts.length} draft${drafts.length === 1 ? "" : "s"}. Drives /ideas, updates within a minute.`}
        actions={
          <Link href="/admin/posts/new">
            <PrimaryButton type="button">
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              New post
            </PrimaryButton>
          </Link>
        }
      />

      {saved && <Flash tone="ok">Saved.</Flash>}
      {deleted && <Flash tone="ok">Deleted.</Flash>}

      <PostsList posts={rows} />
    </div>
  );
}
