import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import TeamMemberForm from "../TeamMemberForm";
import { updateTeamMember } from "../actions";

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const supabase = await getServerSupabase();
  const { data: member } = await supabase
    .from("cms_team_members")
    .select("*")
    .eq("slug", decodeURIComponent(slug))
    .single();
  if (!member) notFound();

  return (
    <TeamMemberForm
      mode="edit"
      initial={{
        slug: member.slug,
        name: member.name,
        role: member.role,
        bio: member.bio,
        image_url: member.image_url,
        email: member.email,
        linkedin_url: member.linkedin_url,
        instagram_url: member.instagram_url,
        display_order: member.display_order,
        is_active: member.is_active,
      }}
      action={updateTeamMember}
    />
  );
}
