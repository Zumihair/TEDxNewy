import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import TemplateEditor from "@/components/team-brand/TemplateEditor";
import { TEMPLATES, hasTemplate } from "@/components/team-brand/templates-data";

export const metadata = { title: "Template · Brand hub · TEDxNewy", robots: { index: false, follow: false } };

export default async function TemplatePage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const meta = TEMPLATES.find((t) => t.slug === slug);
  if (!meta || !hasTemplate(slug)) notFound();
  return <TemplateEditor slug={slug} title={meta.title} />;
}
