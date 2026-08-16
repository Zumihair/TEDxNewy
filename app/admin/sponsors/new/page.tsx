import { requireFullAdmin } from "@/lib/cms-auth";
import SponsorForm from "../SponsorForm";
import { createSponsor } from "../actions";

export default async function NewSponsorPage() {
  await requireFullAdmin();
  return (
    <SponsorForm mode="new" initial={{ tier: "Community" }} action={createSponsor} />
  );
}
