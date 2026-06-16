"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type DropdownKey = "upcoming" | "past" | "participate" | "about";

type LinkItem = {
  href?: string;
  label: string;
  dropdown?: DropdownKey;
};

const links: LinkItem[] = [
  { label: "Upcoming", dropdown: "upcoming" },
  { label: "Past Events", dropdown: "past" },
  { label: "Participate", dropdown: "participate" },
  { label: "About", dropdown: "about" },
];

// Mobile drawer sub-items — surfaced when a dropdown header is expanded.
const mobileSubItems: Record<
  DropdownKey,
  Array<{ href?: string; label: string; comingSoon?: boolean }>
> = {
  upcoming: [
    { href: "/student-speaker-competition", label: "School Speaker Competition" },
    { href: "/60-second-talk-night", label: "60-Second Talk Night" },
    { href: "/youth-futures-lab", label: "Youth Futures Lab" },
    { label: "Flagship TEDxNewy 2026", comingSoon: true },
  ],
  past: [
    { href: "/talks", label: "Talks" },
    { href: "/salons", label: "Salons" },
    { href: "/speakers", label: "Speakers" },
  ],
  participate: [
    { href: "/volunteer", label: "Volunteer" },
    { href: "/partner", label: "Partner" },
    { href: "/speak", label: "Nominate a speaker" },
  ],
  about: [
    { href: "/mission", label: "Mission" },
    { href: "/sponsors", label: "Sponsors" },
    { href: "/ideas", label: "Online Ideas" },
    { href: "/team", label: "Team" },
  ],
};

// Routes that own their own chrome — public Nav stays out of the way.
const HIDE_ON = ["/admin", "/subscribe"];

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<DropdownKey | null>(null);
  const [mobileMenu, setMobileMenu] = useState<DropdownKey | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shouldHide = HIDE_ON.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // Routes with a dark hero/background — keep the Nav in dark mode (white
  // logo, light links) even when scrolled, like the home page.
  const isDarkRoute = pathname === "/" || pathname === "/60-second-talk-night";
  const isDark = isDarkRoute && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdowns + mobile drawer on route change
  useEffect(() => {
    setMenu(null);
    setMobileMenu(null);
    setOpen(false);
  }, [pathname]);

  // Reset mobile accordion whenever the drawer itself closes
  useEffect(() => {
    if (!open) setMobileMenu(null);
  }, [open]);

  // Close dropdown on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (shouldHide) return null;

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
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-2 md:px-10 md:py-2">
        <Link href="/" className="block leading-none" aria-label="TEDxNewy home">
          <Image
            src={isDark ? "/brand/tedxnewy-white.png" : "/brand/tedxnewy-black.png"}
            alt="TEDxNewy"
            width={680}
            height={170}
            priority
            className="h-10 w-auto md:h-14"
          />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => {
            const active = l.href ? pathname === l.href : false;
            const isMenuOpen = !!l.dropdown && menu === l.dropdown;
            const color = isDark ? "rgba(255,255,255,0.88)" : "#141210";
            const activeColor = isDark ? "#ffffff" : "#141210";
            const triggerClass =
              "inline-flex items-center gap-1 text-[15px] transition-colors";
            const triggerStyle = {
              color: active || isMenuOpen ? activeColor : color,
              fontWeight: active ? 500 : 400,
            };
            const triggerInner = (
              <>
                {l.label}
                {l.dropdown && (
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      isMenuOpen ? "rotate-180" : ""
                    }`}
                    strokeWidth={2.25}
                  />
                )}
              </>
            );
            return (
              <div
                key={l.label}
                className="relative"
                onMouseEnter={() => l.dropdown && openMenu(l.dropdown)}
              >
                {/* Top-level items don't navigate — they only reveal their
                    panel on hover; clicking does nothing. */}
                <button
                  type="button"
                  className={triggerClass}
                  style={triggerStyle}
                  aria-haspopup="true"
                  aria-expanded={isMenuOpen}
                >
                  {triggerInner}
                </button>
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
            href="/subscribe"
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

      {/* Desktop dropdown — full-width panel that shares the nav background
          and smoothly expands/collapses to fit whichever menu is open */}
      <AnimatePresence initial={false}>
        {menu && (
          <motion.div
            key="nav-panel"
            className="hidden overflow-hidden md:block"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={() => menu && openMenu(menu)}
          >
            <div
              style={{
                borderTop: isDark
                  ? "1px solid rgba(255,255,255,0.10)"
                  : "1px solid rgba(20,18,16,0.08)",
              }}
            >
              <motion.div
                key={menu}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mx-auto max-w-[1440px] px-6 py-10 md:px-10 md:py-12"
              >
                {menu === "upcoming" && (
                  <UpcomingPanel isDark={isDark} onLinkClick={() => setMenu(null)} />
                )}
                {menu === "past" && (
                  <PastEventsPanel onLinkClick={() => setMenu(null)} />
                )}
                {menu === "participate" && (
                  <ParticipatePanel onLinkClick={() => setMenu(null)} />
                )}
                {menu === "about" && (
                  <AboutPanel isDark={isDark} onLinkClick={() => setMenu(null)} />
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile drawer — accordion for dropdown items, plain link otherwise */}
      {open && (
        <div className="border-t border-[rgba(20,18,16,0.08)] bg-[#f4efe6] px-6 py-4 md:hidden">
          <ul className="space-y-1">
            {links.map((l) => {
              const expanded = l.dropdown ? mobileMenu === l.dropdown : false;
              return (
                <li key={l.label}>
                  {l.dropdown ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setMobileMenu(expanded ? null : l.dropdown!)
                        }
                        aria-expanded={expanded}
                        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-[15px] font-medium text-[#141210] hover:bg-[rgba(20,18,16,0.05)]"
                      >
                        <span>{l.label}</span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            expanded ? "rotate-180" : ""
                          }`}
                          strokeWidth={2.25}
                        />
                      </button>
                      {expanded && (
                        <ul className="mb-1 ml-2 space-y-0.5 border-l-2 border-[rgba(20,18,16,0.08)] pl-3">
                          {mobileSubItems[l.dropdown].map((s) =>
                            s.href ? (
                              <li key={s.label}>
                                <Link
                                  href={s.href}
                                  onClick={() => setOpen(false)}
                                  className="block rounded-lg px-4 py-2.5 text-[14px] text-[#141210] hover:bg-[rgba(20,18,16,0.05)]"
                                >
                                  {s.label}
                                </Link>
                              </li>
                            ) : (
                              <li key={s.label}>
                                <div className="flex items-center justify-between gap-2 rounded-lg px-4 py-2.5 text-[14px] text-[#8a8278]">
                                  <span>{s.label}</span>
                                  <span className="shrink-0 rounded-full bg-[rgba(224,34,20,0.10)] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#e02214]">
                                    Coming soon
                                  </span>
                                </div>
                              </li>
                            ),
                          )}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={l.href ?? "#"}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-4 py-3 text-[15px] font-medium text-[#141210] hover:bg-[rgba(20,18,16,0.05)]"
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              );
            })}
            <li className="pt-2">
              <Link
                href="/subscribe"
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

// Colour tokens so the link-style panels stay readable on the dark home nav
// and the light inner-page nav alike.
function panelTokens(isDark: boolean) {
  return {
    kicker: isDark ? "text-white/55" : "text-[#6b6459]",
    heading: isDark ? "text-white" : "text-[#141210]",
    rowTitle: isDark ? "text-white/90" : "text-[#141210]",
    rowTitleHover: isDark
      ? "text-white/90 group-hover:text-white"
      : "text-[#141210] group-hover:text-[#e02214]",
    blurb: isDark ? "text-white/65" : "text-[#2a2521]",
    desc: isDark ? "text-white/45" : "text-[#8a8278]",
    divide: isDark ? "divide-white/10" : "divide-[rgba(20,18,16,0.10)]",
    rowHover: isDark
      ? "hover:bg-white/[0.08]"
      : "hover:bg-[rgba(20,18,16,0.05)]",
    arrow: isDark
      ? "text-white/40 group-hover:text-white"
      : "text-[#cfc7ba] group-hover:text-[#e02214]",
  };
}

type PanelTokens = ReturnType<typeof panelTokens>;

function PanelLinkRow({
  href,
  label,
  desc,
  t,
  onLinkClick,
}: {
  href: string;
  label: string;
  desc?: string;
  t: PanelTokens;
  onLinkClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onLinkClick}
      className={`group -mx-3 flex items-center justify-between gap-6 rounded-lg px-3 py-3.5 transition-colors ${t.rowHover}`}
    >
      <span className="min-w-0">
        <span
          className={`block text-[16px] font-medium transition-colors ${t.rowTitleHover}`}
        >
          {label}
        </span>
        {desc && (
          <span className={`mt-1 block text-[13px] ${t.desc}`}>{desc}</span>
        )}
      </span>
      <ArrowRight
        className={`h-4 w-4 shrink-0 transition-all group-hover:translate-x-0.5 ${t.arrow}`}
        strokeWidth={2}
      />
    </Link>
  );
}

// Shared full-width layout for the link-style menus: a short lede on the left,
// a divided list of links on the right.
function LinkPanel({
  isDark,
  kicker,
  heading,
  blurb,
  children,
}: {
  isDark: boolean;
  kicker: string;
  heading: string;
  blurb: string;
  children: React.ReactNode;
}) {
  const t = panelTokens(isDark);
  return (
    <div className="grid gap-10 md:grid-cols-[0.85fr_2fr] md:gap-16">
      <div>
        <div
          className={`text-[10.5px] font-semibold uppercase ${t.kicker}`}
          style={{ letterSpacing: "0.28em" }}
        >
          {kicker}
        </div>
        <h3
          className={`mt-4 font-sans tracking-[-0.02em] ${t.heading}`}
          style={{
            fontSize: "clamp(1.5rem, 2.2vw, 2rem)",
            lineHeight: 1.05,
            fontWeight: 500,
          }}
        >
          {heading}
        </h3>
        <p className={`mt-3 max-w-[34ch] text-[14px] leading-[1.6] ${t.blurb}`}>
          {blurb}
        </p>
      </div>
      <div className={`divide-y ${t.divide}`}>{children}</div>
    </div>
  );
}

function UpcomingPanel({
  isDark,
  onLinkClick,
}: {
  isDark: boolean;
  onLinkClick: () => void;
}) {
  const t = panelTokens(isDark);
  return (
    <LinkPanel
      isDark={isDark}
      kicker="On the horizon"
      heading="What's coming up"
      blurb="The events we're building toward across the season."
    >
      <PanelLinkRow
        href="/student-speaker-competition"
        label="School Speaker Competition"
        desc="OPEN NOW"
        t={t}
        onLinkClick={onLinkClick}
      />
      <PanelLinkRow
        href="/60-second-talk-night"
        label="60-Second Talk Night"
        desc="16 July · Newcastle West"
        t={t}
        onLinkClick={onLinkClick}
      />
      <PanelLinkRow
        href="/youth-futures-lab"
        label="Youth Futures Lab"
        desc="7 August · NUspace"
        t={t}
        onLinkClick={onLinkClick}
      />
      {/* Flagship — not yet live, so it nods to what's coming without a link */}
      <div className="-mx-3 flex items-center justify-between gap-6 px-3 py-3.5">
        <span className="min-w-0">
          <span className={`block text-[16px] font-medium ${t.rowTitle}`}>
            Flagship TEDxNewy 2026
          </span>
          <span className={`mt-1 block text-[13px] ${t.desc}`}>
            24 October · Conservatorium of Music
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-[rgba(224,34,20,0.14)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e02214]">
          Coming soon
        </span>
      </div>
    </LinkPanel>
  );
}

function PastEventsPanel({ onLinkClick }: { onLinkClick: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <PanelCard
        href="/talks"
        title="Talks"
        subtitle="Watch every TEDxNewy talk"
        image="/images/past-2025.jpg"
        gradient="linear-gradient(135deg, #2a3a88 0%, #1f1f4a 50%, #050818 100%)"
        onLinkClick={onLinkClick}
        cta="Watch talks"
      />
      <PanelCard
        href="/salons"
        title="Salons"
        subtitle="Our intimate idea nights"
        image="/images/salon-whatif.jpg"
        gradient="linear-gradient(135deg, #1f4a5c 0%, #0c2430 60%, #050f15 100%)"
        onLinkClick={onLinkClick}
        cta="Explore salons"
      />
      <PanelCard
        href="/speakers"
        title="Speakers"
        subtitle="Past TEDxNewy voices"
        image="/images/stage-benjie.jpg"
        gradient="linear-gradient(135deg, #2a0604 0%, #8c0d05 50%, #b91404 100%)"
        onLinkClick={onLinkClick}
        cta="Meet the speakers"
      />
    </div>
  );
}

function AboutPanel({
  isDark,
  onLinkClick,
}: {
  isDark: boolean;
  onLinkClick: () => void;
}) {
  const t = panelTokens(isDark);
  return (
    <LinkPanel
      isDark={isDark}
      kicker="About TEDxNewy"
      heading="Who we are"
      blurb="What we stand for and the people behind the season."
    >
      <PanelLinkRow
        href="/mission"
        label="Mission"
        desc="What TEDxNewy stands for"
        t={t}
        onLinkClick={onLinkClick}
      />
      <PanelLinkRow
        href="/sponsors"
        label="Sponsors"
        desc="The partners behind the season"
        t={t}
        onLinkClick={onLinkClick}
      />
      <PanelLinkRow
        href="/ideas"
        label="Online Ideas"
        desc="Writing from Newcastle"
        t={t}
        onLinkClick={onLinkClick}
      />
      <PanelLinkRow
        href="/team"
        label="Team"
        desc="The volunteer crew"
        t={t}
        onLinkClick={onLinkClick}
      />
    </LinkPanel>
  );
}

function ParticipatePanel({ onLinkClick }: { onLinkClick: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <PanelCard
        href="/volunteer"
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
        image="/images/youth-futures/yfl-brand.jpg"
        gradient="linear-gradient(135deg, #2a0604 0%, #8c0d05 50%, #b91404 100%)"
        onLinkClick={onLinkClick}
        cta="Start a conversation"
      />
      <PanelCard
        href="/speak"
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
