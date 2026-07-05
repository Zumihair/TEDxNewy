import { requireAdmin } from "@/lib/cms-auth";
import { Card, PageHeader } from "../ui";

export const metadata = {
  title: "Newsletter · Admin · TEDxNewy",
};

export default async function AdminNewsletterPage() {
  await requireAdmin();

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Community · Newsletter"
        title="Newsletter"
        description="Build, schedule and send campaigns to your subscribers with a block editor."
      />
      <Card className="p-6">
        <p className="text-[14px] leading-[1.6] text-[#6b6459]">
          The newsletter builder is on its way. It will land here with drafts,
          scheduling and a block editor for images, text, buttons and more.
        </p>
      </Card>
    </div>
  );
}
