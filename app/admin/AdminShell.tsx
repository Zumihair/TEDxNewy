"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AtSign,
  Bell,
  Building2,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  Film,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  PanelsTopLeft,
  PenSquare,
  Send,
  Share2,
  ShieldCheck,
  UserCircle,
  Users,
  Waypoints,
  X,
  FolderOpen,
  Handshake,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import type { NavGroup, NavItem } from "./nav-config";
import { sectionThemeFor } from "./section-theme";

// Maps the string icon names in nav-config to the actual lucide components.
const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Inbox,
  CalendarDays,
  Film,
  Users,
  UserCircle,
  Building2,
  CalendarRange,
  PenSquare,
  AtSign,
  Send,
  Newspaper,
  Waypoints,
  PanelsTopLeft,
  Share2,
  Bell,
  ShieldCheck,
  FolderOpen,
  Handshake,
  Ticket,
};

export default function AdminShell({
  user,
  groups,
  signOutAction,
  children,
}: {
  user: { email?: string | null };
  /** Already filtered to this admin's access level by the layout. */
  groups: NavGroup[];
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (item: NavItem) =>
    item.exact
      ? pathname === item.href
      : pathname.startsWith(item.href) ||
        (item.also ?? []).some((a) => pathname.startsWith(a));

  // Collapsible groups start collapsed, except the one holding the current
  // page so the active link is always visible on load.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      groups.map((g) => [
        g.heading,
        g.collapsible ? g.items.some(isActive) : true,
      ]),
    ),
  );

  const toggleGroup = (heading: string) =>
    setOpenGroups((s) => ({ ...s, [heading]: !s[heading] }));

  const Brand = (
    <div className="flex flex-col items-start gap-1.5">
      <Image
        src="/brand/tedxnewy-white.png"
        alt="TEDxNewy"
        width={680}
        height={170}
        priority
        className="h-8 w-auto self-start"
      />
      {/* pl-3 lines this up with the nav group headings below (their px-3). */}
      <span
        className="pl-3 font-mono text-[9px] font-semibold uppercase text-white/45"
        style={{ letterSpacing: "0.28em" }}
      >
        Admin
      </span>
    </div>
  );

  const NavList = (
    <nav className="flex flex-col gap-3.5">
      {groups.map((group) => {
        const expanded = openGroups[group.heading];
        return (
        <div key={group.heading} className="space-y-0.5">
          {group.collapsible ? (
            <button
              type="button"
              onClick={() => toggleGroup(group.heading)}
              aria-expanded={expanded}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1 font-mono text-[9.5px] font-semibold uppercase text-white/35 transition-colors hover:text-white/65"
              style={{ letterSpacing: "0.28em" }}
            >
              <span>{group.heading}</span>
              <ChevronRight
                className={
                  "h-3 w-3 transition-transform " + (expanded ? "rotate-90" : "")
                }
                strokeWidth={2.5}
              />
            </button>
          ) : (
            <div
              className="px-3 font-mono text-[9.5px] font-semibold uppercase text-white/35"
              style={{ letterSpacing: "0.28em" }}
            >
              {group.heading}
            </div>
          )}
          {(!group.collapsible || expanded) &&
            group.items.map((item) => {
            const active = isActive(item);
            const Icon = ICONS[item.iconName];
            // Active accent follows the item's section colour (bright variant
            // for the dark sidebar), so the selected page matches its family.
            const accent = sectionThemeFor(item.href).onDark;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={
                  "group relative flex items-center gap-2.5 rounded-lg px-3 py-1.5 transition-colors " +
                  (active
                    ? "bg-white/[0.10] text-white"
                    : "text-white/65 hover:bg-white/[0.06] hover:text-white")
                }
              >
                <span
                  className={
                    "absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-r-full transition-all " +
                    (active ? "w-[3px]" : "w-0")
                  }
                  style={{ backgroundColor: active ? accent : "transparent" }}
                  aria-hidden
                />
                <span
                  className={
                    "inline-flex h-6 w-6 items-center justify-center rounded-md " +
                    (active
                      ? "text-white"
                      : "bg-white/[0.04] text-white/55 group-hover:bg-white/[0.08] group-hover:text-white/80")
                  }
                  style={active ? { backgroundColor: accent } : undefined}
                >
                  {Icon && <Icon className="h-4 w-4" strokeWidth={2} />}
                </span>
                <span className="flex-1 text-[13.5px] font-medium">
                  {item.label}
                </span>
                {item.status === "soon" && (
                  <span
                    className="rounded-full bg-white/[0.08] px-1.5 py-0.5 font-mono text-[8.5px] font-semibold uppercase text-white/45"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        );
      })}
    </nav>
  );

  const SidebarFoot = (
    <div className="space-y-2 border-t border-white/[0.08] pt-4">
      <Link
        href="/"
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between rounded-lg px-3 py-2 text-[12.5px] font-medium text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        <span className="inline-flex items-center gap-2">
          <Home className="h-3.5 w-3.5" strokeWidth={2} />
          View live site
        </span>
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.25} />
      </Link>
      <div className="rounded-lg bg-white/[0.04] px-3 py-2.5">
        <div className="text-[11px] font-medium text-white/55">Signed in as</div>
        <div className="mt-1 truncate text-[12.5px] font-medium text-white">
          {user.email}
        </div>
        <form action={signOutAction} className="mt-2.5">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium text-white/85 transition-colors hover:bg-white/[0.12] hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={2.25} />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4efe6] text-[#141210]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col justify-between bg-[#111] px-4 py-6 md:flex">
        <div className="space-y-5">
          <Link href="/admin" className="block">
            {Brand}
          </Link>
          {NavList}
        </div>
        {SidebarFoot}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[rgba(20,18,16,0.08)] bg-white/90 px-5 py-3.5 backdrop-blur-sm md:hidden">
        <Link
          href="/admin"
          className="flex items-center gap-2.5"
          aria-label="TEDxNewy Admin"
        >
          <Image
            src="/brand/tedxnewy-black.png"
            alt="TEDxNewy"
            width={680}
            height={170}
            className="h-6 w-auto"
          />
          {/* Nudged down: uppercase glyphs sit above the box's descender space,
              so a plain items-center looks optically high next to the logo. */}
          <span
            className="translate-y-[2px] font-mono text-[9px] font-semibold uppercase text-[#6b6459]"
            style={{ letterSpacing: "0.24em" }}
          >
            Admin
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[rgba(20,18,16,0.06)] text-[#141210]"
        >
          <Menu className="h-4 w-4" strokeWidth={2} />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/50"
          />
          <aside className="relative flex h-full w-[280px] max-w-[85vw] flex-col justify-between bg-[#111] px-4 py-6 text-white">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                {Brand}
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white"
                >
                  <X className="h-4 w-4" strokeWidth={2.25} />
                </button>
              </div>
              {NavList}
            </div>
            {SidebarFoot}
          </aside>
        </div>
      )}

      {/* Main content area */}
      <main className="md:pl-[232px]">
        <div className="mx-auto max-w-[1100px] px-5 py-10 md:px-12 md:py-14">
          {children}
        </div>
      </main>
    </div>
  );
}
