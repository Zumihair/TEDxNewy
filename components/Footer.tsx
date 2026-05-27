"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ORG } from "@/lib/data";

const HIDE_ON = ["/admin", "/subscribe"];

export default function Footer() {
  const pathname = usePathname();
  const shouldHide = HIDE_ON.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (shouldHide) return null;
  return (
    <footer className="relative overflow-hidden bg-[#141210] text-[#f4efe6]">
      <div className="grain pointer-events-none absolute inset-0 opacity-20" />
      <div className="relative mx-auto max-w-[1440px] px-6 md:px-10">
        {/* Main */}
        <div className="grid gap-10 py-14 md:grid-cols-5 md:gap-8 md:py-16">
          <div className="md:col-span-2">
            <div
              className="font-sans font-normal leading-[1.04] tracking-[-0.03em] balance max-w-[20ch]"
              style={{
                fontSize: "clamp(2rem, 3.6vw, 3rem)",
                fontWeight: 400,
              }}
            >
              Ideas that refuse to sit still.
            </div>
            <p className="mt-8 max-w-md text-[14px] leading-[1.6] text-white/70">
              {ORG.acknowledgment}
            </p>
            <Link
              href="/youth-futures-lab"
              className="mt-8 inline-flex items-center gap-2.5 rounded-full px-3.5 py-2 transition-colors hover:bg-[rgba(224,34,20,0.22)]"
              style={{ background: "rgba(224, 34, 20, 0.14)", border: "1px solid rgba(224, 34, 20, 0.28)" }}
            >
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full rounded-full ping-soft opacity-75" style={{ background: "#e02214" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#e02214" }} />
              </span>
              <span className="text-[11.5px] font-semibold">
                Youth Futures Lab
                <span className="font-normal text-white/60"> · EOIs close 15 June</span>
              </span>
            </Link>
          </div>

          {/* Right side: nav columns up top, socials pinned to the bottom so
              they line up with the Youth Futures Lab chip on the left */}
          <div className="flex flex-col justify-between gap-12 md:col-span-3">
            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:gap-8">
              <FooterCol
                title="Explore"
                items={[
                  { label: "Past Talks", href: "/talks" },
                  { label: "Past Speakers", href: "/speakers" },
                  { label: "Past Salons", href: "/salons" },
                  { label: "Online Ideas", href: "/ideas" },
                ]}
              />
              <FooterCol
                title="Participate"
                align="center"
                items={[
                  { label: "Speakers", href: "/speak" },
                  { label: "Partners", href: "/partner" },
                  { label: "Volunteers", href: "/volunteer" },
                ]}
              />
              <FooterCol
                title="About"
                align="end"
                items={[
                  { label: "Mission", href: "/mission" },
                  { label: "Sponsors", href: "/sponsors" },
                  { label: "The Team", href: "/team" },
                  { label: "Contact Us", href: "/contact" },
                ]}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              {SOCIALS.map(({ label, href, Icon }) => {
                const external = href.startsWith("http");
                return (
                  <a
                    key={label}
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/40 hover:bg-white/5 hover:text-white"
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Access & inclusion statement */}
        <div className="border-t border-white/10 py-10 md:py-12">
          <div>
            <h4
              className="font-mono text-[10.5px] font-semibold uppercase text-white/45"
              style={{ letterSpacing: "0.24em" }}
            >
              Access &amp; inclusion
            </h4>
            <p className="mt-4 text-[14px] leading-[1.7] text-white/70">
              TEDxNewy is for everyone. We aim to be as inclusive as we can,
              making our events accessible to and welcoming for all, regardless
              of ability, age, background, culture, gender or identity. If
              there&rsquo;s something that would help you take part, whether
              that&rsquo;s an access requirement, a dietary need, or anything
              else, please{" "}
              <Link
                href="/contact"
                className="text-white/90 underline underline-offset-4 transition-colors hover:text-white"
              >
                get in touch
              </Link>{" "}
              and we&rsquo;ll do our best to make it happen.
            </p>
          </div>
        </div>

        {/* Legal bar */}
        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/10 py-6 text-[11.5px] text-white/55 sm:flex-row sm:items-center">
          <div>
            © {new Date().getFullYear()} {ORG.legalName} · ACN {ORG.acn} · {ORG.formerly}
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-white">Terms</Link>
            <Link href="/code-of-conduct" className="transition-colors hover:text-white">Code of Conduct</Link>
            <Link href="/contact" className="transition-colors hover:text-white">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
  align = "start",
}: {
  title: string;
  items: { label: string; href: string }[];
  align?: "start" | "center" | "end";
}) {
  return (
    <div
      className={
        align === "center"
          ? "md:justify-self-center"
          : align === "end"
            ? "md:justify-self-end"
            : undefined
      }
    >
      <h4 className="mb-6 font-mono text-[10.5px] font-semibold uppercase text-white/45" style={{ letterSpacing: "0.24em" }}>
        {title}
      </h4>
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.label}>
            <Link href={it.href} className="text-[14px] font-medium text-white/85 transition-colors hover:text-[#ff9b8f]">
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SOCIALS = [
  {
    label: "TEDxNewy on Instagram",
    href: `https://instagram.com/${ORG.handles.instagram.replace(/^@/, "")}`,
    Icon: InstagramIcon,
  },
  {
    label: "TEDxNewy on TikTok",
    href: `https://tiktok.com/${ORG.handles.tiktok}`,
    Icon: TikTokIcon,
  },
  {
    label: "TEDxNewy on LinkedIn",
    href: `https://www.linkedin.com/company/${ORG.handles.linkedin.replace(/^@/, "")}`,
    Icon: LinkedInIcon,
  },
  {
    label: `Email ${ORG.email}`,
    href: `mailto:${ORG.email}`,
    Icon: MailIcon,
  },
];

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="m3.5 6.5 8.5 6 8.5-6" />
    </svg>
  );
}
