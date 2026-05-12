import { requireAdmin } from "@/lib/cms-auth";
import PostForm from "../PostForm";
import { createPost } from "../actions";

export default async function NewPostPage() {
  await requireAdmin();
  return <PostForm mode="new" initial={{}} action={createPost} />;
}
