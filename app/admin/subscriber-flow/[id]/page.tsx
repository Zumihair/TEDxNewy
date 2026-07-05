import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { newsletterFromOptions } from "@/lib/email-notify";
import { PageHeader } from "../../ui";
import StepEditor, { type StepRow } from "../StepEditor";

export const metadata = {
  title: "Edit flow step · Admin · TEDxNewy",
};

export default async function EditFlowStepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await getServerSupabase();

  const { data: step } = await supabase
    .from("subscriber_flow_steps")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!step) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Community · Subscriber Flow"
        title={`Step ${step.position}: ${step.name}`}
        description="Edit this step of the welcome flow. Changes take effect for subscribers who reach this step from now on."
        backHref="/admin/subscriber-flow"
      />
      <StepEditor step={step as StepRow} fromOptions={newsletterFromOptions()} />
    </div>
  );
}
