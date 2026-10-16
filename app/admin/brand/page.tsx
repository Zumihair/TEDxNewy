import { requireAdmin } from "@/lib/cms-auth";
import BrandPortal from "@/components/team-brand/BrandPortal";
import { PageHeader } from "../PageHeader";

export const metadata = { title: "Brand hub · Admin · TEDxNewy", robots: { index: false, follow: false } };

export default async function BrandHubPage() {
  await requireAdmin();
  return (
    <div className="adm-stack">
      <PageHeader
        title="Brand hub"
        description="Logos, colours and fonts to download, templates to fill in and print, and the studio for social posts."
      />
      <BrandPortal />
    </div>
  );
}
