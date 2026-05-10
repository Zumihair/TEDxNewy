import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import FormField from "@/components/FormField";
import { ORG } from "@/lib/data";

export const metadata = {
  title: "Contact · TEDxNewy",
  description:
    "Get in touch with TEDxNewy. We're a 100% volunteer-run organisation in Newcastle, Australia.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        kicker="Get in touch"
        titleTop="We'd love to hear from you."
        intro={
          <>
            Have a question, idea, or want to work with us? Drop us a line.
            We&rsquo;re a 100% volunteer-run organisation, so it may take us
            up to a week to respond &mdash; we get to every message.
          </>
        }
      />

      {/* Contact form */}
      <section className="mx-auto max-w-[820px] px-5 pb-20 md:px-6 md:pb-24">
        <form action="/api/contact" method="post" className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="First name" name="firstName" required />
            <FormField label="Last name" name="lastName" />
          </div>
          <FormField label="Email" name="email" type="email" required />
          <FormField label="Mobile" name="phone" type="tel" hint="Optional" />
          <FormField
            label="Your message"
            name="message"
            textarea
            rows={6}
            required
            placeholder="What's on your mind?"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2"
          >
            Send message
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </form>

        <div className="mt-10 rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-[#f9f5ec] p-6 text-[14px] leading-[1.6] text-[#2a2521]">
          <strong className="text-[#141210]">Heads-up:</strong> we&rsquo;re a
          100% volunteer-run organisation, so it may take us up to a week to
          respond to your enquiry. Press and partnership enquiries can also
          email{" "}
          <a
            href={`mailto:${ORG.email}`}
            className="text-[#e02214] underline-offset-4 hover:underline"
          >
            {ORG.email}
          </a>{" "}
          directly.
        </div>
      </section>

      {/* Apply to participate — three CTAs */}
      <section className="bg-[#3d0a05] text-white">
        <div className="mx-auto max-w-[1240px] px-5 py-20 md:px-10 md:py-24">
          <h2
            className="font-sans tracking-[-0.025em] text-white"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Apply to participate
          </h2>
          <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <li>
              <ParticipateCard
                href="/nominate"
                title="Become a speaker"
                body="Have an idea, or know someone who does?"
                image="/images/stage-welcome.jpg"
                gradient="linear-gradient(135deg, #2a3a88 0%, #1f1f4a 50%, #050818 100%)"
              />
            </li>
            <li>
              <ParticipateCard
                href="/apply"
                title="Become a volunteer"
                body="Find out about current volunteering opportunities."
                image="/images/stage-dialogue.jpg"
                gradient="linear-gradient(135deg, #1f4a5c 0%, #0c2430 60%, #050f15 100%)"
              />
            </li>
            <li>
              <ParticipateCard
                href="/sponsors"
                title="Partner with us"
                body="Interested in partnering with TEDxNewy? Start the conversation."
                image="/images/stage-benjie.jpg"
                gradient="linear-gradient(135deg, #2a0604 0%, #8c0d05 50%, #b91404 100%)"
              />
            </li>
          </ul>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-[#2a0604] text-white">
        <div className="mx-auto max-w-[760px] px-5 py-20 text-center md:px-6 md:py-24">
          <div
            className="text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
            style={{ letterSpacing: "0.28em" }}
          >
            Don&rsquo;t want to miss anything?
          </div>
          <h2
            className="mt-5 font-sans tracking-[-0.025em] text-white balance"
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Subscribe to be first.
          </h2>
          <form
            action="/api/subscribe"
            method="post"
            className="mx-auto mt-8 flex max-w-md flex-col items-stretch gap-3 sm:flex-row"
          >
            <input type="hidden" name="source" value="contact" />
            <label htmlFor="contact-newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="contact-newsletter-email"
              type="email"
              name="email"
              required
              placeholder="your@email.com"
              className="h-12 w-full flex-1 rounded-full border border-white/25 bg-white/5 px-5 text-[14.5px] text-white placeholder:text-white/45 backdrop-blur-sm focus:border-white focus:outline-none focus:ring-2 focus:ring-[#e02214]/40"
            />
            <button
              type="submit"
              className="h-12 shrink-0 whitespace-nowrap rounded-full bg-[#e02214] px-7 text-[14px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404]"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

function ParticipateCard({
  href,
  title,
  body,
  image,
  gradient,
}: {
  href: string;
  title: string;
  body: string;
  image?: string;
  gradient?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40"
      style={{ background: gradient }}
    >
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-65 transition-transform duration-700 group-hover:scale-[1.04]"
        />
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.65) 100%)",
        }}
      />
      <div className="relative flex h-full flex-col justify-between p-7">
        <h3
          className="max-w-[14ch] font-sans tracking-[-0.02em] text-white balance"
          style={{
            fontSize: "clamp(1.65rem, 2.4vw, 2rem)",
            lineHeight: 1.05,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 96',
          }}
        >
          {title}
        </h3>
        <div className="space-y-5">
          <p className="max-w-[28ch] text-[14.5px] leading-[1.5] text-white/85">
            {body}
          </p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13.5px] font-medium text-white">
              Learn more
            </span>
            <span
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e02214] text-white transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-[#b91404]"
              style={{ boxShadow: "0 8px 22px rgba(224, 34, 20, 0.35)" }}
            >
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
