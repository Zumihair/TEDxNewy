"use client";

import Image from "next/image";
import Link from "next/link";
import PhotoFill from "@/components/PhotoFill";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
} from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  NAV_FALLBACK,
  type NavConfig,
  type NavGroupConfig,
} from "@/lib/nav-fallback";
import { SIGNAL_LIVE } from "@/lib/feature-flags";
import { TICKET_POPUP_URL } from "@/lib/tickets";
import { trackGetTickets } from "@/lib/pixel-events";

// Routes that own their own chrome — public Nav stays out of the way.
const HIDE_ON = ["/admin", "/subscribe", "/feedback"];

// While Signal isn't public yet, the header CTA reverts to the pre-Signal
// "Subscribe" behaviour instead of pointing at the ticket page.
const CTA_HREF = SIGNAL_LIVE ? "/signal" : "/subscribe";
const CTA_LABEL = SIGNAL_LIVE ? "Get tickets" : "Subscribe";

// Below this the bar never auto-hides: at the top of a page there is nothing
// to reclaim, and a bar that vanishes on the first flick reads as a glitch.
const HIDE_AFTER = 160;
// Ignore sub-pixel and rubber-band scrolling, which otherwise flips the bar
// in and out while the page is effectively still.
const DIRECTION_NOISE = 6;

export default function Nav({ nav }: { nav?: NavConfig }) {
  const groups = useMemo<NavConfig>(
    () => (nav && nav.length > 0 ? nav : NAV_FALLBACK),
    [nav],
  );

  // Mobile drawer sub-items, derived from the same config the desktop
  // mega-menu uses so the two stay in lockstep.
  const mobileSubItems = useMemo(() => {
    const map: Record<
      string,
      Array<{ href?: string; label: string; comingSoon?: boolean }>
    > = {};
    for (const g of groups) {
      map[g.key] = g.items.map((it) => ({
        href: it.href ?? undefined,
        label: it.label,
        comingSoon: !it.href,
      }));
    }
    return map;
  }, [groups]);

  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [retreated, setRetreated] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [mobileMenu, setMobileMenu] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const shouldHide = HIDE_ON.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // Header model: blend at the top, contrast on scroll.
  //
  // The homepage and /mission are our dark-hero routes; every other public
  // page opens on the cream hero. At the very top the bar is transparent and blends into the
  // hero, its links coloured to contrast whatever sits behind them (white over
  // the dark home hero, ink over a cream hero). The moment you scroll, the bar
  // lifts into an opaque cream surface with a soft shadow so it reads as a
  // distinct bar over any section beneath it. Opening a menu or the mobile
  // drawer while still at the top of the dark home hero tints the bar deep
  // maroon to match the hero rather than snapping to cream.
  // Flagship (Signature) event detail pages use the same big photo-hero
  // treatment as /signal (see app/events/[slug]/page.tsx's isFlagship
  // branch), so they need the same dark-hero header treatment. Hardcoded
  // like /signal since Nav has no access to the event's kind, only the
  // pathname — add a new slug here if another flagship event goes past.
  const FLAGSHIP_EVENT_PATHS = [
    "/events/reframe-2025",
    "/events/beyond-boundaries-2024",
  ];
  const heroIsDark =
    pathname === "/" ||
    pathname === "/signal" ||
    FLAGSHIP_EVENT_PATHS.includes(pathname ?? "");
  const atTop = !scrolled;
  // White logo + links: only while the bar is transparent (or maroon-tinted)
  // over the dark home hero. Everywhere else the content is ink.
  const lightContent = atTop && heroIsDark;

  // The nav lives in the root layout and is never unmounted, so `scrolled`
  // would otherwise carry a stale value across client-side navigations. Keying
  // this on `pathname` re-runs onScroll() the moment a new route commits, so
  // landing on the dark home hero from a scrolled page can't leave the bar in
  // its scrolled (ink content) state for a beat and flash black over the hero.
  // The same listener also drives "retreat on the way down, return on the way
  // up", so the bar gives its height back to the page while you're reading and
  // is there the instant you reach for it. Two guards keep it from feeling
  // twitchy: nothing happens in the first HIDE_AFTER pixels, and a movement
  // smaller than DIRECTION_NOISE is not treated as a direction at all.
  //
  // `last` is a local rather than state on purpose: it's read and written on
  // every scroll event and must not re-render anything by changing.
  useEffect(() => {
    let last = window.scrollY;
    setRetreated(false);
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 60);
      const delta = y - last;
      if (Math.abs(delta) < DIRECTION_NOISE) return;
      last = y;
      // Never retreat out from under the keyboard: if focus is inside the bar
      // the user is tabbing through it, and sliding it off screen would strand
      // them on an invisible control.
      if (y < HIDE_AFTER || navRef.current?.contains(document.activeElement)) {
        setRetreated(false);
        return;
      }
      setRetreated(delta > 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

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

  const openMenu = (key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenu(key);
  };
  // Tap/click toggles the panel (touch devices have no hover to open it).
  const toggleMenu = (key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenu((cur) => (cur === key ? null : key));
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMenu(null), 120);
  };
  // Close the mega-menu when keyboard focus leaves the whole nav (tabbing away).
  const onNavBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setMenu(null);
    }
  };

  const activeGroup = groups.find((g) => g.key === menu) ?? null;

  // Surface of the bar itself, derived from the model described above.
  const barExpanded = !!menu || open;
  // An open menu or drawer always wins over the retreat, or tapping the burger
  // near the bottom of a page would slide the drawer away as it opened.
  const barRetreated = retreated && !barExpanded;

  // On /signal the CTA used to be a link to the page you are already on, so on
  // desktop it looked live and did nothing. That page loads the Humanitix
  // pop-up widget, which intercepts clicks on TICKET_POPUP_URL, so point the
  // button there instead and it opens checkout in place. Everywhere else the
  // button's job is still to get people to the event page first.
  const ticketsInPlace = SIGNAL_LIVE && pathname === "/signal";
  const ctaHref = ticketsInPlace ? TICKET_POPUP_URL : CTA_HREF;

  // Rendered twice (desktop bar, mobile drawer) with different styling, so
  // this is a function rather than a component: an inline component would
  // remount the anchor on every render of Nav.
  const renderCta = (
    className: string,
    style?: CSSProperties,
    onClick?: () => void,
  ) =>
    ticketsInPlace ? (
      // pointerdown, not click: the widget swallows the click before React
      // sees it, so an onClick here would never fire. See lib/pixel-events.ts.
      <a
        href={ctaHref}
        onPointerDown={trackGetTickets}
        onClick={onClick}
        className={className}
        style={style}
      >
        {CTA_LABEL}
      </a>
    ) : (
      <Link href={ctaHref} onClick={onClick} className={className} style={style}>
        {CTA_LABEL}
      </Link>
    );
  const barStyle = (() => {
    // Blending: transparent over the hero at the very top, nothing open.
    if (atTop && !barExpanded) {
      return {
        background: "transparent",
        backdropFilter: "none",
        WebkitBackdropFilter: "none",
        borderBottom: "1px solid transparent",
        boxShadow: "none",
      };
    }
    // Menu/drawer opened while still at the top of the dark home hero: tint
    // deep maroon to match the hero and keep the white content readable.
    if (lightContent && barExpanded) {
      return {
        background: "rgba(42, 6, 4, 0.96)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "none",
      };
    }
    // Scrolled, or a menu open on a cream page: a lifted cream bar that stands
    // off the page beneath it.
    return {
      background: "rgba(247, 243, 235, 0.97)",
      backdropFilter: "blur(20px) saturate(140%)",
      WebkitBackdropFilter: "blur(20px) saturate(140%)",
      borderBottom: "1px solid rgba(20, 18, 16, 0.08)",
      boxShadow: "0 12px 34px -20px rgba(20, 18, 16, 0.35)",
    };
  })();

  return (
    <nav
      ref={navRef}
      className="fixed inset-x-0 z-50 transition-all duration-300"
      // top defaults to 0; a page-specific promo banner (e.g. Signal's) can
      // push the whole bar down by setting --banner-offset on <html> while
      // it's mounted, without every other page knowing it exists.
      //
      // Retreating is a transform, not a change to `top`: `top` is the
      // banner's business and animating it would fight the banner for the same
      // property. -115% clears the bar's own drop shadow as well as its box,
      // and because the banner sits at z-60 against this bar's z-50, whatever
      // is still on screen slides in behind it rather than over it.
      style={{
        top: "var(--banner-offset, 0px)",
        transform: barRetreated ? "translateY(-115%)" : "translateY(0)",
        ...barStyle,
      }}
      onMouseLeave={scheduleClose}
      // Tabbing into a retreated bar brings it straight back, so a keyboard
      // user can never land on a control that is off screen.
      onFocus={() => setRetreated(false)}
      onBlur={onNavBlur}
    >
      {/* Always-rendered link list for crawlers and assistive tech. The visual
          mega-menu reveals its links on hover/click (client state), so they are
          not in the initial HTML; this mirror gives search engines and screen
          readers real anchors to every primary destination on every page. */}
      <ul className="sr-only">
        {groups.flatMap((g) =>
          g.items
            .filter((it) => it.href)
            .map((it) => (
              <li key={`${g.key}-${it.label}`}>
                <Link href={it.href as string}>{it.label}</Link>
              </li>
            )),
        )}
      </ul>

      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-2 md:px-10 md:py-2">
        <Link href="/" className="block leading-none" aria-label="TEDxNewy home">
          <Image
            src={lightContent ? "/brand/tedxnewy-white.png" : "/brand/tedxnewy-black.png"}
            alt="TEDxNewy"
            width={680}
            height={170}
            priority
            className="h-10 w-auto md:h-14"
          />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {groups.map((g) => {
            const isMenuOpen = menu === g.key;
            const color = lightContent ? "rgba(255,255,255,0.88)" : "#141210";
            const activeColor = lightContent ? "#ffffff" : "#141210";
            return (
              <div
                key={g.key}
                className="relative"
                onMouseEnter={() => openMenu(g.key)}
              >
                {/* Top-level items don't navigate — they only reveal their
                    panel on hover; clicking does nothing. */}
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[15px] transition-colors"
                  style={{ color: isMenuOpen ? activeColor : color }}
                  aria-haspopup="true"
                  aria-expanded={isMenuOpen}
                  onClick={() => toggleMenu(g.key)}
                >
                  {g.label}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      isMenuOpen ? "rotate-180" : ""
                    }`}
                    strokeWidth={2.25}
                  />
                </button>
                {/* Active underline */}
                {isMenuOpen && (
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
          {renderCta(
            "hidden items-center gap-2 rounded-full px-5 py-2 text-[13.5px] font-medium transition-all hover:-translate-y-0.5 md:inline-flex",
            {
              background: lightContent ? "#ffffff" : "#e02214",
              color: lightContent ? "#2a0604" : "#ffffff",
            },
          )}
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-full md:hidden"
            style={{
              background: lightContent
                ? "rgba(255,255,255,0.08)"
                : "rgba(20,18,16,0.06)",
              color: lightContent ? "#ffffff" : "#141210",
            }}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Desktop dropdown — full-width panel that shares the nav background
          and smoothly expands/collapses to fit whichever menu is open */}
      <AnimatePresence initial={false}>
        {activeGroup && (
          <motion.div
            key="nav-panel"
            className="hidden overflow-hidden md:block"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={() => openMenu(activeGroup.key)}
          >
            <div
              style={{
                borderTop: lightContent
                  ? "1px solid rgba(255,255,255,0.10)"
                  : "1px solid rgba(20,18,16,0.08)",
              }}
            >
              <motion.div
                key={activeGroup.key}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mx-auto max-w-[1440px] px-6 py-10 md:px-10 md:py-12"
              >
                {activeGroup.style === "cards" ? (
                  <CardPanel
                    group={activeGroup}
                    onLinkClick={() => setMenu(null)}
                  />
                ) : (
                  <ListPanel
                    group={activeGroup}
                    isDark={lightContent}
                    onLinkClick={() => setMenu(null)}
                  />
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile drawer — accordion for dropdown items */}
      {open && (
        <div className="border-t border-[rgba(20,18,16,0.08)] bg-[#f4efe6] px-6 py-4 md:hidden">
          <ul className="space-y-1">
            {groups.map((g) => {
              const expanded = mobileMenu === g.key;
              return (
                <li key={g.key}>
                  <button
                    type="button"
                    onClick={() => setMobileMenu(expanded ? null : g.key)}
                    aria-expanded={expanded}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-[15px] font-medium text-[#141210] hover:bg-[rgba(20,18,16,0.05)]"
                  >
                    <span>{g.label}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        expanded ? "rotate-180" : ""
                      }`}
                      strokeWidth={2.25}
                    />
                  </button>
                  {expanded && (
                    <ul className="mb-1 ml-2 space-y-0.5 border-l-2 border-[rgba(20,18,16,0.08)] pl-3">
                      {(mobileSubItems[g.key] ?? []).map((s) =>
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
                </li>
              );
            })}
            <li className="pt-2">
              {renderCta(
                "block rounded-full bg-[#e02214] px-5 py-3.5 text-center text-[14px] font-semibold text-white",
                undefined,
                () => setOpen(false),
              )}
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
  badge,
}: {
  href: string;
  label: string;
  desc?: string | null;
  t: PanelTokens;
  onLinkClick: () => void;
  /** Optional status pill (e.g. "Coming soon"); replaces the arrow. */
  badge?: string | null;
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
      {badge ? (
        <span className="shrink-0 rounded-full bg-[rgba(224,34,20,0.14)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e02214]">
          {badge}
        </span>
      ) : (
        <ArrowRight
          className={`h-4 w-4 shrink-0 transition-all group-hover:translate-x-0.5 ${t.arrow}`}
          strokeWidth={2}
        />
      )}
    </Link>
  );
}

// Non-link list row — a label + desc with a status pill, for items that only
// nod at what's coming without a page to link to yet.
function PanelStaticRow({
  label,
  desc,
  badge,
  t,
}: {
  label: string;
  desc?: string | null;
  badge: string;
  t: PanelTokens;
}) {
  return (
    <div className="-mx-3 flex items-center justify-between gap-6 px-3 py-3.5">
      <span className="min-w-0">
        <span className={`block text-[16px] font-medium ${t.rowTitle}`}>
          {label}
        </span>
        {desc && (
          <span className={`mt-1 block text-[13px] ${t.desc}`}>{desc}</span>
        )}
      </span>
      <span className="shrink-0 rounded-full bg-[rgba(224,34,20,0.14)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e02214]">
        {badge}
      </span>
    </div>
  );
}

// Full-width layout for list-style menus: a short lede on the left, a divided
// list of links on the right.
function ListPanel({
  group,
  isDark,
  onLinkClick,
}: {
  group: NavGroupConfig;
  isDark: boolean;
  onLinkClick: () => void;
}) {
  const t = panelTokens(isDark);
  return (
    <div className="grid gap-10 md:grid-cols-[0.85fr_2fr] md:gap-16">
      <div>
        <div
          className={`text-[10.5px] font-semibold uppercase ${t.kicker}`}
          style={{ letterSpacing: "0.28em" }}
        >
          {group.kicker ?? ""}
        </div>
        <h3
          className={`mt-4 font-sans tracking-[-0.02em] ${t.heading}`}
          style={{
            fontSize: "clamp(1.5rem, 2.2vw, 2rem)",
            lineHeight: 1.05,
            fontWeight: 500,
          }}
        >
          {group.heading ?? group.label}
        </h3>
        {group.blurb && (
          <p className={`mt-3 max-w-[34ch] text-[14px] leading-[1.6] ${t.blurb}`}>
            {group.blurb}
          </p>
        )}
      </div>
      <div className={`divide-y ${t.divide}`}>
        {group.items.map((it) =>
          it.href ? (
            <PanelLinkRow
              key={it.label}
              href={it.href}
              label={it.label}
              desc={it.description}
              badge={it.badge}
              t={t}
              onLinkClick={onLinkClick}
            />
          ) : (
            <PanelStaticRow
              key={it.label}
              label={it.label}
              desc={it.description}
              badge={it.badge ?? "Coming soon"}
              t={t}
            />
          ),
        )}
      </div>
    </div>
  );
}

// Card-grid layout for the image-led menus.
function CardPanel({
  group,
  onLinkClick,
}: {
  group: NavGroupConfig;
  onLinkClick: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {group.items.map((it) => (
        <PanelCard
          key={it.label}
          href={it.href ?? "#"}
          title={it.label}
          subtitle={it.description}
          image={it.imageUrl}
          gradient={it.gradient}
          cta={it.ctaLabel ?? "Learn more"}
          onLinkClick={onLinkClick}
        />
      ))}
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
  subtitle?: string | null;
  image?: string | null;
  gradient?: string | null;
  cta?: string;
  onLinkClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onLinkClick}
      className="group relative block aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40"
      style={{ background: gradient ?? undefined }}
    >
      {image && (
        <PhotoFill
          src={image}
          alt=""
          sizes="(max-width: 768px) 100vw, 33vw"
          opacity={0.65}
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
