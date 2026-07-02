"use client";

import Image from "next/image";
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
        {/* Main: brand + socials on the left, nav columns on the right */}
        <div className="grid gap-10 py-12 md:grid-cols-12 md:gap-8 md:py-14">
          <div className="md:col-span-5">
            <Image
              src="/brand/tedxnewy-white.png"
              alt="TEDxNewy"
              width={680}
              height={170}
              className="mb-6 hidden h-8 w-auto md:block"
            />
            <div
              className="font-sans font-normal leading-[1.05] tracking-[-0.03em] balance max-w-[18ch]"
              style={{
                fontSize: "clamp(1.6rem, 2.4vw, 2.1rem)",
                fontWeight: 400,
              }}
            >
              Ideas that refuse to sit still.
            </div>

            <div className="mt-7 flex items-center gap-2.5">
              {SOCIALS.map(({ label, href, Icon }) => {
                const external = href.startsWith("http");
                return (
                  <a
                    key={label}
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/40 hover:bg-white/5 hover:text-white"
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            <FooterCol
              title="Explore"
              items={[
                { label: "Past Talks", href: "/talks" },
                { label: "Past Speakers", href: "/speakers" },
                { label: "Past Salons", href: "/salons" },
              ]}
            />
            <FooterCol
              title="Participate"
              items={[
                { label: "Speakers", href: "/speak" },
                { label: "Partners", href: "/partner" },
                { label: "Volunteers", href: "/volunteer" },
              ]}
            />
            <FooterCol
              title="About"
              items={[
                { label: "Mission", href: "/mission" },
                { label: "The Team", href: "/team" },
                { label: "Sponsors", href: "/sponsors" },
                { label: "Press", href: "/press" },
                { label: "Contact", href: "/contact" },
              ]}
            />
          </nav>
        </div>

        {/* Fine print: acknowledgment + access, side by side and compact */}
        <div className="grid gap-x-12 gap-y-6 border-t border-white/10 py-8 md:grid-cols-2">
          <div>
            <h4
              className="font-mono text-[10px] font-semibold uppercase text-white/40"
              style={{ letterSpacing: "0.24em" }}
            >
              Acknowledgment of Country
            </h4>
            <p className="mt-3 text-[12.5px] leading-[1.6] text-white/55">
              {ORG.acknowledgment}
            </p>
          </div>
          <div>
            <h4
              className="font-mono text-[10px] font-semibold uppercase text-white/40"
              style={{ letterSpacing: "0.24em" }}
            >
              Access &amp; inclusion
            </h4>
            <p className="mt-3 text-[12.5px] leading-[1.6] text-white/55">
              TEDxNewy is for everyone, regardless of ability, age, background,
              culture, gender or identity. If something would help you take
              part, whether an access requirement, a dietary need or anything
              else, please{" "}
              <Link
                href="/contact"
                className="text-white/80 underline underline-offset-4 transition-colors hover:text-white"
              >
                get in touch
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Legal bar */}
        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/10 py-5 text-[11.5px] text-white/55 sm:flex-row sm:items-center">
          <div>
            © {new Date().getFullYear()} {ORG.legalName} · ACN {ORG.acn} ·{" "}
            {ORG.formerly}
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              Terms
            </Link>
            <Link
              href="/code-of-conduct"
              className="transition-colors hover:text-white"
            >
              Code of Conduct
            </Link>
            <Link href="/contact" className="transition-colors hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4
        className="mb-4 font-mono text-[10.5px] font-semibold uppercase text-white/45"
        style={{ letterSpacing: "0.24em" }}
      >
        {title}
      </h4>
      <ul className="space-y-2.5">
        {items.map((it) => (
          <li key={it.label}>
            <Link
              href={it.href}
              className="text-[14px] font-medium text-white/85 transition-colors hover:text-[#ff9b8f]"
            >
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
