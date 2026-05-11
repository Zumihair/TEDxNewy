"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";

type DropdownKey = "watch" | "participate";

type LinkItem = {
  href: string;
  label: string;
  dropdown?: DropdownKey;
};

const links: LinkItem[] = [
  { href: "/watch", label: "Watch", dropdown: "watch" },
  { href: "/speakers", label: "Speakers" },
  { href: "/salons", label: "Salons" },
  { href: "/about", label: "About" },
  { href: "/nominate", label: "Participate", dropdown: "participate" },
];

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<DropdownKey | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHomepage = pathname === "/";
  // Home page is dark all the way down — keep Nav in dark mode even when scrolled.
  const isDark = isHomepage && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setMenu(null);
  }, [pathname]);

  // Close dropdown on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openMenu = (key: DropdownKey) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenu(key);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMenu(null), 120);
  };

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      style={{
        background: isDark
          ? scrolled || menu
            ? "rgba(42, 6, 4, 0.92)"
            : "transparent"
          : "rgba(244, 239, 230, 0.94)",
        backdropFilter:
          isDark && !scrolled && !menu ? "none" : "blur(20px) saturate(140%)",
        WebkitBackdropFilter:
          isDark && !scrolled && !menu ? "none" : "blur(20px) saturate(140%)",
        borderBottom: isDark
          ? "1px solid rgba(255,255,255,0.10)"
          : "1px solid rgba(20, 18, 16, 0.08)",
      }}
      onMouseLeave={scheduleClose}
    >
      {/* Top utility row */}
      <div
        className="hidden items-center justify-end gap-6 px-8 py-2 text-[11px] font-medium tracking-wide md:flex"
        style={{
          color: isDark ? "rgba(255,255,255,0.65)" : "#6b6459",
          borderBottom: isDark
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(20,18,16,0.06)",
        }}
      >
        <Link href="/sponsors" className="hover:text-[#e02214]">Our Partners</Link>
        <span
          className="h-2.5 w-px"
          style={{ background: isDark ? "rgba(255,255,255,0.2)" : "rgba(20,18,16,0.15)" }}
        />
        <Link href="/watch" className="hover:text-[#e02214]">Past events</Link>
        <span
          className="h-2.5 w-px"
          style={{ background: isDark ? "rgba(255,255,255,0.2)" : "rgba(20,18,16,0.15)" }}
        />
        <Link href="/contact" className="hover:text-[#e02214]">Contact</Link>
      </div>

      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 md:px-10 md:py-6">
        <Link href="/" className="block leading-none" aria-label="TEDxNewy home">
          <Image
            src={isDark ? "/brand/tedxnewy-white.png" : "/brand/tedxnewy-black.png"}
            alt="TEDxNewy"
            width={680}
            height={170}
            priority
            className="h-7 w-auto md:h-8"
          />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            const isMenuOpen = l.dropdown && menu === l.dropdown;
            const color = isDark ? "rgba(255,255,255,0.88)" : "#141210";
            const activeColor = isDark ? "#ffffff" : "#141210";
            return (
              <div
                key={l.href}
                className="relative"
                onMouseEnter={() => l.dropdown && openMenu(l.dropdown)}
              >
                <Link
                  href={l.href}
                  className="inline-flex items-center gap-1 text-[15px] transition-colors"
                  style={{
                    color: active || isMenuOpen ? activeColor : color,
                    fontWeight: active ? 500 : 400,
                  }}
                  aria-haspopup={l.dropdown ? "true" : undefined}
                  aria-expanded={l.dropdown ? isMenuOpen : undefined}
                >
                  {l.label}
                  {l.dropdown && (
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        isMenuOpen ? "rotate-180" : ""
                      }`}
                      strokeWidth={2.25}
                    />
                  )}
                </Link>
                {/* Active underline */}
                {(active || isMenuOpen) && (
                  <span
                    aria-hidden
                    className="absolute -bottom-2 left-0 h-[2px] w-full rounded-full bg-[#e02214]"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/#identity"
            className="hidden items-center gap-2 rounded-full px-5 py-2 text-[13.5px] font-medium transition-all hover:-translate-y-0.5 md:inline-flex"
            style={{
              background: isDark ? "#ffffff" : "#e02214",
              color: isDark ? "#2a0604" : "#ffffff",
            }}
          >
            Subscribe
          </Link>
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-full md:hidden"
            style={{
              background: isDark ? "rgba(255,255,255,0.08)" : "rgba(20,18,16,0.06)",
              color: isDark ? "#ffffff" : "#141210",
            }}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Desktop dropdown panel */}
      {menu && (
        <div
          className="hidden md:block"
          onMouseEnter={() => menu && openMenu(menu)}
        >
          <div className="border-t border-white/10">
            <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-10 md:py-14">
              {menu === "watch" && <WatchPanel onLinkClick={() => setMenu(null)} />}
              {menu === "participate" && <ParticipatePanel onLinkClick={() => setMenu(null)} />}
            </div>
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-[rgba(20,18,16,0.08)] bg-[#f4efe6] px-6 py-4 md:hidden">
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-[15px] font-medium text-[#141210] hover:bg-[rgba(20,18,16,0.05)]"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link
                href="/#identity"
                onClick={() => setOpen(false)}
                className="block rounded-full bg-[#e02214] px-5 py-3.5 text-center text-[14px] font-semibold text-white"
              >
                Subscribe
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}

// =============================================================================
// Mega-menu panels
// =============================================================================

const linkColumnItem =
  "flex items-baseline justify-between gap-4 py-2 text-[15px] font-medium text-white/85 transition-colors hover:text-white";

function WatchPanel({ onLinkClick }: { onLinkClick: () => void }) {
  const items = [
    { href: "/tickets", label: "Newcastle 2050: What If?", meta: "30 April 2026 — Salon" },
    { href: "/watch?year=2025", label: "Reframe", meta: "October 2025 · watch" },
    { href: "/watch?year=2024", label: "Beyond Boundaries", meta: "October 2024 · watch" },
    { href: "/salons", label: "All Salons", meta: "Across the year" },
  ];

  return (
    <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_2fr] md:gap-16">
      <div>
        <div
          className="text-[10.5px] font-semibold uppercase text-white/55"
          style={{ letterSpacing: "0.28em" }}
        >
          Browse past events
        </div>
        <ul className="mt-4 divide-y divide-white/10">
          {items.map((it) => (
            <li key={it.href}>
              <Link href={it.href} onClick={onLinkClick} className={linkColumnItem}>
                <span>{it.label}</span>
                <span className="text-[12px] text-white/45">{it.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/watch"
          onClick={onLinkClick}
          className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium text-white"
        >
          Watch all talks and videos
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <PanelCard
          href="/tickets"
          title="Newcastle 2050: What If?"
          subtitle="The 2026 Salon recap"
          image="/images/salon-whatif.jpg"
          gradient="linear-gradient(135deg, #2a3a88 0%, #121a48 50%, #050818 100%)"
          onLinkClick={onLinkClick}
        />
        <PanelCard
          href="/speakers"
          title="Past speakers"
          subtitle="The 2025 Reframe lineup"
          image="/images/past-2025.jpg"
          gradient="linear-gradient(135deg, #1f4a5c 0%, #0c2430 60%, #050f15 100%)"
          onLinkClick={onLinkClick}
        />
      </div>
    </div>
  );
}

function ParticipatePanel({ onLinkClick }: { onLinkClick: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <PanelCard
        href="/apply"
        title="Volunteer with us"
        subtitle="Join the crew"
        image="/images/stage-dialogue.jpg"
        gradient="linear-gradient(135deg, #1f4a5c 0%, #0c2430 60%, #050f15 100%)"
        onLinkClick={onLinkClick}
        cta="Learn more"
      />
      <PanelCard
        href="/partner"
        title="Partner with us"
        subtitle="Support the season"
        image="/images/stage-benjie.jpg"
        gradient="linear-gradient(135deg, #2a0604 0%, #8c0d05 50%, #b91404 100%)"
        onLinkClick={onLinkClick}
        cta="Start a conversation"
      />
      <PanelCard
        href="/nominate"
        title="Nominate a speaker"
        subtitle="Tell us who we're missing"
        image="/images/stage-welcome.jpg"
        gradient="linear-gradient(135deg, #2a3a88 0%, #1f1f4a 50%, #050818 100%)"
        onLinkClick={onLinkClick}
        cta="Learn more"
      />
    </div>
  );
}

function PanelCard({
  href,
  title,
  subtitle,
  image,
  gradient,
  cta = "Learn more",
  onLinkClick,
}: {
  href: string;
  title: string;
  subtitle?: string;
  image?: string;
  gradient?: string;
  cta?: string;
  onLinkClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onLinkClick}
      className="group relative block aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40"
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
            "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.65) 100%)",
        }}
      />
      <div className="relative flex h-full flex-col justify-between p-6">
        <div>
          <h3
            className="font-sans tracking-[-0.02em] text-white"
            style={{
              fontSize: "clamp(1.5rem, 2vw, 1.85rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 96',
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <div className="mt-1.5 text-[13px] text-white/75">{subtitle}</div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13.5px] font-medium text-white">{cta}</span>
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e02214] text-white transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-[#b91404]"
            style={{ boxShadow: "0 8px 22px rgba(224, 34, 20, 0.35)" }}
          >
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
          </span>
        </div>
      </div>
    </Link>
  );
}
