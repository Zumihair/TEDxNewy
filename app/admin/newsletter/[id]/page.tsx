import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { newsletterFromOptions } from "@/lib/email-notify";
import { getAudienceCount, mailchimpConfigured } from "@/lib/mailchimp";
import { PageHeader } from "../../ui";
import NewsletterEditor, {
  type EditorTemplate,
  type NewsletterRow,
} from "../NewsletterEditor";

export const metadata = {
  title: "Edit newsletter · Admin · TEDxNewy",
};

export default async function EditNewsletterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await getServerSupabase();

  const { data: newsletter } = await supabase
    .from("newsletters")
    .select(
      "id, title, subject, preheader, from_address, audience, blocks, status, scheduled_at",
    )
    .eq("id", id)
    .single();

  if (!newsletter) notFound();

  // The newsletter sends through Mailchimp when configured, so the audience
  // count shown should be Mailchimp's; the local table is the fallback.
  const [{ data: templates }, { count }, mcCount] = await Promise.all([
    supabase
      .from("newsletter_templates")
      .select("id, name, subject, preheader, blocks")
      .order("created_at", { ascending: false }),
    supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .is("unsubscribed_at", null),
    mailchimpConfigured() ? getAudienceCount() : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Community · Newsletter"
        title={newsletter.title || "Untitled newsletter"}
        description="Build the email, preview it, then schedule or send it to your subscribers."
        backHref="/admin/newsletter"
      />
      <NewsletterEditor
        newsletter={newsletter as NewsletterRow}
        templates={(templates ?? []) as EditorTemplate[]}
        subscriberCount={mcCount ?? count ?? 0}
        audienceLabel={
          mcCount !== null ? "Mailchimp audience" : "All subscribers"
        }
        fromOptions={newsletterFromOptions()}
      />
    </div>
  );
}
