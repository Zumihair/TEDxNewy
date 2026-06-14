import { Send } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { EMAIL_PREVIEWS, type EmailPreview } from "@/lib/email-templates";
import { Field, Flash, PageHeader, PrimaryButton, inputCls } from "../ui";
import { sendComposedEmail } from "./actions";

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
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;
  await requireAdmin();

  const confirmations = EMAIL_PREVIEWS.filter((p) => p.kind === "confirmation");
  const notifications = EMAIL_PREVIEWS.filter((p) => p.kind === "notification");

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
          social footer). Leave a blank line between paragraphs. Sending uses
          Resend, so it only goes out when{" "}
          <code className="font-mono text-[#141210]">RESEND_API_KEY</code> is set
          in Vercel.
        </p>

        <form
          action={sendComposedEmail}
          className="grid gap-5 rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-6 md:p-7"
        >
          <Field label="To" htmlFor="to" hint="One or more emails, comma or space separated.">
            <input
              id="to"
              name="to"
              type="text"
              required
              placeholder="someone@example.com"
              className={inputCls}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Subject" htmlFor="subject">
              <input
                id="subject"
                name="subject"
                type="text"
                required
                placeholder="A note from TEDxNewy"
                className={inputCls}
              />
            </Field>
            <Field
              label="Eyebrow"
              htmlFor="eyebrow"
              hint="Small label above the heading (optional)."
            >
              <input
                id="eyebrow"
                name="eyebrow"
                type="text"
                placeholder="A note from TEDxNewy"
                className={inputCls}
              />
            </Field>
          </div>

          <Field
            label="Heading"
            htmlFor="heading"
            hint="Large headline in the email (optional — defaults to the subject)."
          >
            <input
              id="heading"
              name="heading"
              type="text"
              placeholder="Thanks for being part of it"
              className={inputCls}
            />
          </Field>

          <Field label="Message" htmlFor="body">
            <textarea
              id="body"
              name="body"
              required
              rows={9}
              placeholder={"Hi there,\n\nWrite your message here. Blank lines start new paragraphs.\n\nThanks,\nTEDxNewy"}
              className={inputCls}
            />
          </Field>

          <div>
            <PrimaryButton type="submit">
              <Send className="h-4 w-4" strokeWidth={2.25} />
              Send email
            </PrimaryButton>
          </div>
        </form>
      </section>

      {/* PREVIEWS */}
      <PreviewSection
        title="Confirmation emails"
        subtitle="Sent to the person who submitted a form. The 60-Second Talk Night EOI confirmation is here."
        items={confirmations}
      />
      <PreviewSection
        title="Notification emails"
        subtitle="Sent to the admin team when a form comes in."
        items={notifications}
      />
    </div>
  );
}

function PreviewSection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: EmailPreview[];
}) {
  return (
    <section className="space-y-5">
      <div className="border-b border-[rgba(20,18,16,0.12)] pb-3">
        <h2 className="font-sans text-[18px] font-semibold tracking-[-0.01em] text-[#141210]">
          {title}
        </h2>
        <p className="mt-0.5 text-[13px] text-[#6b6459]">{subtitle}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {items.map((p) => (
          <article
            key={p.id}
            className="overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.12)] bg-white"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(20,18,16,0.10)] px-5 py-3.5">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-[#141210]">
                  {p.label}
                </div>
                <div className="mt-0.5 text-[12px] text-[#6b6459]">
                  To: {p.to}
                </div>
              </div>
              <div className="min-w-0 text-right">
                <div
                  className="font-mono text-[9.5px] font-semibold uppercase text-[#6b6459]"
                  style={{ letterSpacing: "0.2em" }}
                >
                  Subject
                </div>
                <div className="truncate text-[12.5px] text-[#141210]">
                  {p.content.subject}
                </div>
              </div>
            </div>
            <iframe
              title={p.label}
              srcDoc={p.html}
              className="block h-[520px] w-full border-0 bg-white"
            />
          </article>
        ))}
      </div>
    </section>
  );
}
