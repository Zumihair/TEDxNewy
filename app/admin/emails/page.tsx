import Link from "next/link";
import { History } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getResendFrom } from "@/lib/email-notify";
import { COMPOSE_TEMPLATES } from "@/lib/email-templates";
import { Flash, PageHeader } from "../ui";
import ComposeForm from "./ComposeForm";
import { listSavedTemplates } from "./templates";
import FlashToast from "../FlashToast";

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
  const [, savedTemplates] = await Promise.all([requireAdmin(), listSavedTemplates()]);

  const fromAddress = getResendFrom();
  // The shared onboarding@resend.dev sender (or no verified domain set) is a
  // deliverability risk — mail from it is often spam-filed or rejected.
  const isProduction = process.env.VERCEL_ENV === "production";
  const emailOff = !process.env.RESEND_API_KEY;
  const usingTestSender =
    isProduction && (!process.env.RESEND_FROM || /resend.dev/i.test(fromAddress));

  return (
    <div className="space-y-10">
      <PageHeader
        title="Quick email"
        description="A one-off branded email to anyone. Every recipient gets their own copy."
        actions={
          <Link
            href="/admin/emails/history"
            className="tx-btn tx-btn--secondary tx-btn--sm tx-btn--auto"
          >
            <History className="h-4 w-4" strokeWidth={2.25} />
            Send history
          </Link>
        }
      />

      {/* A send reports as ONE toast, not two. The old pair leaned on being
          stacked in the page ("Some didn't, see below"); a partial send is now
          a single amber line that carries both numbers. */}
      {sent && !failed && (
        <FlashToast clear="sent">
          Accepted by the email service for {sent} recipient
          {sent === "1" ? "" : "s"}. (Accepted means queued for delivery, not a
          guarantee it reached the inbox.)
        </FlashToast>
      )}
      {failed && (
        <FlashToast
          tone={sent && sent !== "0" ? "warning" : "error"}
          clear={["sent", "failed"]}
        >
          {sent && sent !== "0"
            ? `Accepted for ${sent} recipient${sent === "1" ? "" : "s"}, but `
            : ""}
          {failed} recipient{failed === "1" ? "" : "s"} failed to send.{" "}
          <Link href="/admin/emails/history" className="underline">
            Open the send history
          </Link>{" "}
          to see who and why.
        </FlashToast>
      )}
      {error && (
        <FlashToast tone="error" clear="error">
          {ERR_COPY[error] ?? "Something went wrong."}
        </FlashToast>
      )}

      {emailOff && !isProduction && (
        <Flash tone="info">
          This is a preview, so sending is switched off here. Emails send from the live site, from the verified
          tedxnewy.com.au address.
        </Flash>
      )}

      {usingTestSender && (
        <Flash tone="info">
          Emails are sending from{" "}
          <code className="font-ui">{fromAddress}</code>. That shared test
          address is often spam-filed or rejected, which is a likely reason
          recipients don&rsquo;t receive messages. Ask Will to switch it to a
          verified tedxnewy.com.au sender to fix deliverability.
        </Flash>
      )}

      <section id="compose" className="scroll-mt-24">
        <ComposeForm
          templates={COMPOSE_TEMPLATES}
          savedTemplates={savedTemplates}
          initialTo={to ?? ""}
          initialTemplateId={template}
        />
      </section>
    </div>
  );
}
