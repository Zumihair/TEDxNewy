import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import PostForm from "../PostForm";
import { updatePost } from "../actions";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const supabase = await getServerSupabase();
  const { data: post } = await supabase
    .from("cms_posts")
    .select("*")
    .eq("slug", decodeURIComponent(slug))
    .single();
  if (!post) notFound();

  return (
    <PostForm
      mode="edit"
      initial={{
        slug: post.slug,
        title: post.title,
        summary: post.summary,
        body_markdown: post.body_markdown,
        hero_image_url: post.hero_image_url,
        author: post.author,
        published_at: post.published_at,
      }}
      action={updatePost}
    />
  );
}
