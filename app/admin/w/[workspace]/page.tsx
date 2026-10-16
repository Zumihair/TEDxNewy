import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { NAV_GROUPS } from "../../nav-config";
import { canAccessPath, visibleGroupsFor } from "../../access";
import { HubView } from "../../views";

export const metadata = { title: "Admin · TEDxNewy", robots: { index: false, follow: false } };

export default async function WorkspacePage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const { access } = await requireAdmin();
  const group = NAV_GROUPS.find((g) => g.key === workspace && g.key !== "home");
  if (!group) notFound();
  if (!canAccessPath(group.href, access)) redirect("/admin?denied=1");
  const visible = visibleGroupsFor(access).find((g) => g.key === group.key);
  return <HubView group={visible ?? group} />;
}
