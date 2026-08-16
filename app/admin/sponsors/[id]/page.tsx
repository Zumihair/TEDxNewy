import { notFound } from "next/navigation";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import SponsorForm from "../SponsorForm";
import { updateSponsor } from "../actions";

export default async function EditSponsorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireFullAdmin();
  const { id } = await params;
  const supabase = await getServerSupabase();

  const { data: sponsor } = await supabase
    .from("cms_sponsors")
    .select("*")
    .eq("id", id)
    .single();
  if (!sponsor) notFound();

  return (
    <SponsorForm
      mode="edit"
      initial={{
        id: sponsor.id,
        name: sponsor.name,
        tier: sponsor.tier,
        partner_type: sponsor.partner_type,
        logo_url: sponsor.logo_url,
        website_url: sponsor.website_url,
        display_order: sponsor.display_order,
      }}
      action={updateSponsor}
    />
  );
}
