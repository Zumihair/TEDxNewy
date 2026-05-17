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
        {/* Top masthead line */}
        <div className="flex items-baseline justify-between gap-6 border-b border-white/10 py-8 md:py-10">
          <Link href="/" className="block leading-none" aria-label="TEDxNewy home">
            <Image
              src="/brand/tedxnewy-white.png"
              alt="TEDxNewy"
              width={680}
              height={170}
              className="h-7 w-auto md:h-8"
            />
          </Link>
          <div className="font-mono text-[10.5px] font-semibold uppercase text-white/55" style={{ letterSpacing: "0.24em" }}>
            Newcastle · AU
          </div>
        </div>

        {/* Main */}
        <div className="grid grid-cols-2 gap-10 py-16 md:grid-cols-5 md:gap-8">
          <div className="col-span-2">
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

          <FooterCol
            title="Explore"
            items={[
              { label: "Watch Past Talks", href: "/watch" },
              { label: "Past Speakers", href: "/speakers" },
              { label: "Online Ideas", href: "/ideas" },
              { label: "The Crew", href: "/team" },
              { label: "Past Salons", href: "/salons" },
            ]}
          />
          <FooterCol
            title="Participate"
            items={[
              { label: "Nominate a Speaker", href: "/nominate" },
              { label: "Join the Crew", href: "/apply" },
              { label: "Partner with Us", href: "/partner" },
            ]}
          />
          <FooterCol
            title="Connect"
            items={[
              { label: "Subscribe", href: "/subscribe" },
              { label: ORG.email, href: `mailto:${ORG.email}` },
              {
                label: "Instagram",
                href: `https://instagram.com/${ORG.handles.instagram.replace(/^@/, "")}`,
              },
              {
                label: "TikTok",
                href: `https://tiktok.com/${ORG.handles.tiktok}`,
              },
              {
                label: "LinkedIn",
                href: `https://www.linkedin.com/company/${ORG.handles.linkedin.replace(/^@/, "")}`,
              },
            ]}
          />
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

function FooterCol({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
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
