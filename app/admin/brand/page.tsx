import { requireAdmin } from "@/lib/cms-auth";
import BrandPortal from "@/components/team-brand/BrandPortal";
import { PageHeader } from "../PageHeader";

export const metadata = { title: "Logos and branding · Resources · Admin · TEDxNewy", robots: { index: false, follow: false } };

export default async function BrandHubPage() {
  await requireAdmin();
  return (
    <div className="adm-stack">
      <PageHeader title="Logos and branding" description="Logos, colours, fonts and the lines we use again and again, ready to download or copy." />
      <BrandPortal />
    </div>
  );
}
