import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { getSystemCaps } from "@/lib/system-caps";
import { UNTRACKED } from "@/lib/system-caps-config";
import { PageHeader } from "../ui";
import { CapTiles } from "./Tiles";

export const dynamic = "force-dynamic";
export const metadata = { title: "System caps · Admin · TEDxNewy" };

export default async function SystemCapsPage() {
  await requireAdmin();
  const supabase = await getServerSupabase();
  const tiles = await getSystemCaps(supabase);

  return (
    <div className="adm-stack">
      <PageHeader title="System caps" description="Hover or press a tile for the trend." />
      <CapTiles tiles={tiles} untracked={UNTRACKED} />
    </div>
  );
}
