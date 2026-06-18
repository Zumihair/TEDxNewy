import { Send } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { COMPOSE_TEMPLATES, EMAIL_PREVIEWS } from "@/lib/email-templates";
import { Flash, PageHeader } from "../ui";
import ComposeForm from "./ComposeForm";
import EmailPreviewBrowser from "./EmailPreviewBrowser";

export const metadata = {
  title: "Emails · Admin · TEDxNewy",
};

const ERR_COPY: Record<string, string> = {
  invalid: "Add at least one valid recipient, a subject and a message.",
  "no-key":
    "RESEND_API_KEY isn't set, so email can't send from here yet. Add it to the Vercel env vars first.",
};

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{
    sent?: string;
    error?: string;
    to?: string;
    template?: string;
  }>;
}) {
  const { sent, error, to, template } = await searchParams;
  await requireAdmin();

  const previews = EMAIL_PREVIEWS.map((p) => ({
    id: p.id,
    label: p.label,
    kind: p.kind,
    to: p.to,
    subject: p.content.subject,
    html: p.html,
  }));

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Settings · Emails"
        title="Emails"
        description="Preview every automated email in its branded shell, and compose a one-off message wrapped in the same header and footer."
      />

      {sent && (
        <Flash tone="ok">
          Sent to {sent} recipient{sent === "1" ? "" : "s"}.
        </Flash>
      )}
      {error && <Flash tone="error">{ERR_COPY[error] ?? "Something went wrong."}</Flash>}

      {/* COMPOSE */}
      <section id="compose" className="scroll-mt-24 space-y-5">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-[#e02214]" strokeWidth={2.25} />
          <h2 className="font-sans text-[18px] font-semibold tracking-[-0.01em] text-[#141210]">
            Compose
          </h2>
        </div>
        <p className="max-w-[70ch] text-[13.5px] leading-[1.6] text-[#6b6459]">
          Your message is wrapped in the standard TEDxNewy shell (logo header,
          social footer). Leave a blank line between paragraphs. Every recipient
          gets their own separate email, so they never see one another. Sending
          uses Resend, so it only goes out when{" "}
          <code className="font-mono text-[#141210]">RESEND_API_KEY</code> is set
          in Vercel.
        </p>

        <ComposeForm
          templates={COMPOSE_TEMPLATES}
          initialTo={to ?? ""}
          initialTemplateId={template}
        />
      </section>

      {/* PREVIEWS */}
      <EmailPreviewBrowser previews={previews} />
    </div>
  );
}
