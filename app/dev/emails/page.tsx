import { notFound } from "next/navigation";
import { EMAIL_PREVIEWS, type EmailPreview } from "@/lib/email-templates";

/**
 * Local-only gallery of every transactional email, rendered with sample data.
 * Visit http://localhost:3000/dev/emails while running `npm run dev`.
 * Returns 404 in production so it never ships publicly.
 */
export const metadata = {
  title: "Email previews · TEDxNewy (dev)",
  robots: { index: false, follow: false },
};

export default function EmailPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const confirmations = EMAIL_PREVIEWS.filter((p) => p.kind === "confirmation");
  const notifications = EMAIL_PREVIEWS.filter((p) => p.kind === "notification");

  return (
    <main className="min-h-screen bg-[#f4efe6] px-5 py-10 text-[#141210] md:px-10">
      <div className="mx-auto max-w-[860px]">
        <header className="mb-10">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            Dev · Email previews
          </div>
          <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.02em]">
            What every form email looks like
          </h1>
          <p className="mt-2 max-w-[60ch] text-[14px] leading-[1.6] text-[#6b6459]">
            Rendered from <code className="font-mono">lib/email-templates.ts</code>{" "}
            with sample data. Edit that file and refresh to revise. Confirmations
            go to the person who submitted; notifications go to the admin team.
          </p>
        </header>

        <Section
          title="Confirmation emails"
          subtitle="Sent to the person who submitted (branded HTML)"
          items={confirmations}
        />
        <Section
          title="Notification emails"
          subtitle="Sent to the admin team (plain text)"
          items={notifications}
        />
      </div>
    </main>
  );
}

function Section({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: EmailPreview[];
}) {
  return (
    <section className="mb-12">
      <div className="mb-5 border-b border-[rgba(20,18,16,0.12)] pb-3">
        <h2 className="text-[18px] font-semibold tracking-[-0.01em]">{title}</h2>
        <p className="mt-0.5 text-[13px] text-[#6b6459]">{subtitle}</p>
      </div>
      <div className="space-y-8">
        {items.map((p) => (
          <article
            key={p.id}
            className="overflow-hidden rounded-[14px] border border-[rgba(20,18,16,0.12)] bg-white"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(20,18,16,0.10)] px-5 py-3.5">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold">{p.label}</div>
                <div className="mt-0.5 text-[12px] text-[#6b6459]">
                  To: {p.to}
                </div>
              </div>
              <div className="text-right">
                <div
                  className="font-mono text-[9.5px] font-semibold uppercase text-[#6b6459]"
                  style={{ letterSpacing: "0.2em" }}
                >
                  Subject
                </div>
                <div className="text-[12.5px] text-[#141210]">
                  {p.content.subject}
                </div>
              </div>
            </div>
            <iframe
              title={p.label}
              // Dev-only: point production asset URLs at the local dev server so
              // not-yet-deployed images (e.g. new partner logos) still preview.
              srcDoc={p.html.replaceAll("https://tedxnewy.com.au", "")}
              className="block h-[560px] w-full border-0 bg-white"
            />
            <details className="border-t border-[rgba(20,18,16,0.10)] px-5 py-3">
              <summary className="cursor-pointer text-[12.5px] font-medium text-[#6b6459]">
                Plain-text version
              </summary>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-md bg-[#f9f5ec] p-4 font-mono text-[12px] leading-[1.55] text-[#141210]">
                {p.content.text}
              </pre>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
