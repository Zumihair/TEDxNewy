import Link from "next/link";
import { History, Send } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getResendFrom } from "@/lib/email-notify";
import { COMPOSE_TEMPLATES } from "@/lib/email-templates";
import { Flash, PageHeader } from "../ui";
import ComposeForm from "./ComposeForm";
import { getComposeAudienceSummaries } from "./audiences";

export const metadata = {
  title: "Quick Compose · Admin · TEDxNewy",
};

const ERR_COPY: Record<string, string> = {
  invalid: "Add at least one valid recipient, a subject and a message.",
  "no-key":
    "Email isn't connected yet, so nothing can send from here. Ask Will to finish the email setup.",
};

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{
    sent?: string;
    failed?: string;
    error?: string;
    to?: string;
    template?: string;
  }>;
}) {
  const { sent, failed, error, to, template } = await searchParams;
  const [, audiences] = await Promise.all([
    requireAdmin(),
    getComposeAudienceSummaries(),
  ]);

  const fromAddress = getResendFrom();
  // The shared onboarding@resend.dev sender (or no verified domain set) is a
  // deliverability risk — mail from it is often spam-filed or rejected.
  const usingTestSender =
    !process.env.RESEND_FROM || /resend\.dev/i.test(fromAddress);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Community · Quick Compose"
        title="Quick Compose"
        description="Send a one-off branded email to a custom audience or a saved list. Previews of the automated form emails live at /dev/emails."
        actions={
          <Link
            href="/admin/emails/history"
            className="inline-flex items-center gap-2 rounded-full bg-[rgba(20,18,16,0.06)] px-5 py-2.5 text-[13.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
          >
            <History className="h-4 w-4" strokeWidth={2.25} />
            Send history
          </Link>
        }
      />

      {sent && (
        <Flash tone="ok">
          Accepted by the email service for {sent} recipient
          {sent === "1" ? "" : "s"}.
          {failed
            ? " Some didn't, see below."
            : " (Accepted means queued for delivery, not a guarantee it reached the inbox.)"}
        </Flash>
      )}
      {failed && (
        <Flash tone="error">
          {failed} recipient{failed === "1" ? "" : "s"} failed to send.{" "}
          <Link href="/admin/emails/history" className="underline">
            Open the send history
          </Link>{" "}
          to see who and why.
        </Flash>
      )}
      {error && <Flash tone="error">{ERR_COPY[error] ?? "Something went wrong."}</Flash>}

      {usingTestSender && (
        <Flash tone="info">
          Emails are sending from{" "}
          <code className="font-mono">{fromAddress}</code>. That shared test
          address is often spam-filed or rejected, which is a likely reason
          recipients don&rsquo;t receive messages. Ask Will to switch it to a
          verified tedxnewy.com.au sender to fix deliverability.
        </Flash>
      )}

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
          social footer). Use the toolbar to format the message, and Preview to
          see it first. Every recipient gets their own separate email, so they
          never see one another, sent in one batched request so none get dropped
          to rate limits. Every send is logged in the{" "}
          <Link href="/admin/emails/history" className="underline">
            send history
          </Link>
          .
        </p>

        <ComposeForm
          templates={COMPOSE_TEMPLATES}
          audiences={audiences}
          initialTo={to ?? ""}
          initialTemplateId={template}
        />
      </section>
    </div>
  );
}
