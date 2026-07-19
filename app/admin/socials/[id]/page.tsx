import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { NotSetUp } from "../../ui";
import PostEditor from "./PostEditor";
import type { SocialMediaRow, SocialPostRow } from "../shared";

export const metadata = {
  title: "Edit post · Socials · Admin · TEDxNewy",
};

export default async function AdminSocialPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await getServerSupabase();

  const { data: post, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <NotSetUp title="Socials isn't set up yet">
        The socials database update (20260719b_social_posts.sql) hasn&rsquo;t
        been applied yet. Run it in the Supabase SQL editor, then reload this
        page.
      </NotSetUp>
    );
  }
  if (!post) notFound();

  const { data: media } = await supabase
    .from("social_post_media")
    .select("*")
    .eq("post_id", id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <PostEditor
      post={post as SocialPostRow}
      media={(media ?? []) as SocialMediaRow[]}
    />
  );
}
