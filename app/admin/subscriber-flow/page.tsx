import { requireAdmin } from "@/lib/cms-auth";
import { Card, PageHeader } from "../ui";

export const metadata = {
  title: "Subscriber Flow · Admin · TEDxNewy",
};

export default async function AdminSubscriberFlowPage() {
  await requireAdmin();

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Community · Subscriber Flow"
        title="Subscriber Flow"
        description="The welcome sequence new subscribers receive after they sign up."
      />
      <Card className="p-6">
        <p className="text-[14px] leading-[1.6] text-[#6b6459]">
          The subscriber welcome flow is on its way. You will be able to view
          and reorder the sequence of emails a new subscriber receives, and edit
          each step.
        </p>
      </Card>
    </div>
  );
}
