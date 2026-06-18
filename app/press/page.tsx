import Link from "next/link";
import { ArrowUpRight, Download, Mail } from "lucide-react";
import PageHero from "@/components/PageHero";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import { ORG } from "@/lib/data";

const factLink =
  "text-[#e02214] underline underline-offset-4 transition-colors hover:text-[#b91404]";

export const metadata = {
  alternates: { canonical: "/press" },
  title: "Press & Media · TEDxNewy",
  description:
    "Media enquiries, fast facts, a ready-to-use description and brand assets for TEDxNewy, an independently licensed TED event in Newcastle, Australia.",
};

const facts: { label: string; body: React.ReactNode }[] = [
  {
    label: "What it is",
    body: "An independently licensed TED event. This TEDx event is operated under free standard and salon licences from TED.",
  },
  {
    label: "Where",
    body: "Newcastle, New South Wales, on Awabakal and Worimi Country.",
  },
  {
    label: "Formerly",
    body: "TEDxCooksHill. We rebranded to TEDxNewy in 2026.",
  },
  {
    label: "Who runs it",
    body: (
      <>
        100% volunteer-run and not-for-profit, under {ORG.legalName} (ACN{" "}
        {ORG.acn}). Meet the people behind it on our{" "}
        <Link href="/team" className={factLink}>
          team page
        </Link>
        .
      </>
    ),
  },
  {
    label: "The 2026 season",
    body: (
      <>
        Four events across the year: our{" "}
        <Link href="/newcastle-2050-salon" className={factLink}>
          Newcastle 2050 Salon
        </Link>
        , the{" "}
        <Link href="/60-second-talk-night" className={factLink}>
          60-Second Talk Night
        </Link>{" "}
        and{" "}
        <Link href="/youth-futures-lab" className={factLink}>
          Youth Futures Lab
        </Link>
        , building to our signature TEDxNewy event to close the year.
      </>
    ),
  },
];

const DESCRIPTION = `TEDxNewy is an independently licensed TED event based in Newcastle, on Awabakal and Worimi Country. Formerly TEDxCooksHill, it is run entirely by volunteers, aiming to promote ideas worth spreading. TEDxNewy stages talks, salons and community events that bring Novocastrians together around ideas that matter. (x = independently organised TED event.)`;

export default function PressPage() {
  return (
    <>
      <BreadcrumbJsonLd name="Press" path="/press" />
      <PageHero
        kicker="Press & Media"
        titleTop="Newcastle's ideas, on the record."
        intro={
          <>
            For interviews, event access, speaker introductions, photography or
            anything else, we&rsquo;d love to help tell the story of TEDxNewy.
          </>
        }
        body={
          <>
            Below you&rsquo;ll find how to reach us, a few fast facts, a
            ready-to-use description and our brand assets.
          </>
        }
      />

      {/* Media enquiries */}
      <section className="mx-auto max-w-[1100px] px-5 pt-10 pb-20 md:px-6 md:pt-12 md:pb-24">
        <div
          className="text-[10.5px] font-semibold uppercase text-[#e02214]"
          style={{ letterSpacing: "0.24em" }}
        >
          Media enquiries
        </div>
        <h2
          className="mt-5 max-w-[20ch] font-sans tracking-[-0.025em] text-[#141210] balance"
          style={{
            fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
            lineHeight: 1.05,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          Speak with the team.
        </h2>
        <p className="mt-6 max-w-[60ch] text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
          We aim to respond to media enquiries within two business days.
          Working to a deadline? Say so in your message and we&rsquo;ll do our
          best to move quickly.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={`mailto:${ORG.email}?subject=Media%20enquiry`}
            className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-6 py-3 font-sans text-[14px] font-medium text-white transition-colors hover:bg-[#b91404]"
          >
            <Mail className="h-4 w-4" strokeWidth={2} />
            {ORG.email}
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,18,16,0.18)] px-6 py-3 font-sans text-[14px] font-medium text-[#141210] transition-colors hover:border-[#141210] hover:bg-[#141210] hover:text-white"
          >
            Contact form
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>

      {/* Fast facts */}
      <section className="bg-[#f9f5ec]">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            Fast facts
          </div>
          <h2
            className="mt-5 max-w-[20ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            The essentials.
          </h2>
          <ul className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 md:grid-cols-3">
            {facts.map((f, i) => (
              <li key={f.label}>
                <div
                  className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
                  style={{ letterSpacing: "0.22em" }}
                >
                  {String(i + 1).padStart(2, "0")} · {f.label}
                </div>
                <p className="mt-3 text-[15.5px] leading-[1.6] text-[#2a2521]">
                  {f.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Standard description */}
      <section className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
        <div
          className="text-[10.5px] font-semibold uppercase text-[#e02214]"
          style={{ letterSpacing: "0.24em" }}
        >
          About us, in brief
        </div>
        <h2
          className="mt-5 max-w-[24ch] font-sans tracking-[-0.025em] text-[#141210] balance"
          style={{
            fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
            lineHeight: 1.05,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          Copy and paste, freely.
        </h2>
        <p className="mt-6 max-w-[60ch] text-[14px] text-[#6b6459]">
          A short description of TEDxNewy for use in articles, listings and
          programmes.
        </p>
        <blockquote className="mt-8 max-w-[68ch] rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.12)] bg-white p-6 text-[16px] leading-[1.7] text-[#2a2521] md:p-8 md:text-[17px]">
          {DESCRIPTION}
        </blockquote>
      </section>

      {/* Brand assets */}
      <section className="bg-[#f9f5ec]">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            Brand assets
          </div>
          <h2
            className="mt-5 max-w-[24ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Logos and usage.
          </h2>
          <p className="mt-6 max-w-[60ch] text-[16.5px] leading-[1.7] text-[#2a2521]">
            Please keep the TEDxNewy wordmark clear and unmodified, and
            don&rsquo;t recolour or stretch it. For high-resolution logos,
            event photography or speaker portraits, just{" "}
            <a
              href={`mailto:${ORG.email}?subject=Brand%20assets`}
              className="text-[#e02214] underline underline-offset-4"
            >
              email us
            </a>
            .
          </p>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <LogoCard
              href="/brand/tedxnewy-black.png"
              filename="tedxnewy-black.png"
              label="Wordmark · Black"
              dark={false}
            />
            <LogoCard
              href="/brand/tedxnewy-white.png"
              filename="tedxnewy-white.png"
              label="Wordmark · White"
              dark
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
        <h2
          className="max-w-[24ch] font-sans tracking-[-0.025em] text-[#141210] balance"
          style={{
            fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
            lineHeight: 1.05,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          Working on a story about Newcastle ideas?
        </h2>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={`mailto:${ORG.email}?subject=Media%20enquiry`}
            className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-6 py-3 font-sans text-[14px] font-medium text-white transition-colors hover:bg-[#b91404]"
          >
            Get in touch
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </a>
          <Link
            href="/subscribe"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,18,16,0.18)] px-6 py-3 font-sans text-[14px] font-medium text-[#141210] transition-colors hover:border-[#141210] hover:bg-[#141210] hover:text-white"
          >
            Get our updates
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </>
  );
}

function LogoCard({
  href,
  filename,
  label,
  dark,
}: {
  href: string;
  filename: string;
  label: string;
  dark: boolean;
}) {
  return (
    <a
      href={href}
      download={filename}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.12)] bg-white transition-colors hover:border-[#141210]/30"
    >
      <div
        className="flex h-40 items-center justify-center px-8"
        style={{ background: dark ? "#141210" : "#f4efe6" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={href} alt={`TEDxNewy wordmark, ${label}`} className="h-10 w-auto" />
      </div>
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div>
          <div className="text-[14px] font-medium text-[#141210]">{label}</div>
          <div className="font-mono text-[11px] text-[#6b6459]">PNG</div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#e02214]">
          <Download className="h-4 w-4" strokeWidth={2} />
          Download
        </span>
      </div>
    </a>
  );
}
