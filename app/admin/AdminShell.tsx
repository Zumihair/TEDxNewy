"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Film,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  PenSquare,
  ShieldCheck,
  UserCircle,
  Users,
  X,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  exact?: boolean;
  status?: "live" | "soon";
};

type NavGroup = { heading: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: <LayoutDashboard className="h-4 w-4" strokeWidth={2} />,
        exact: true,
        status: "live",
      },
    ],
  },
  {
    heading: "Content",
    items: [
      {
        href: "/admin/talks",
        label: "Talks",
        description: "/watch",
        icon: <Film className="h-4 w-4" strokeWidth={2} />,
        status: "live",
      },
      {
        href: "/admin/speakers",
        label: "Speakers",
        description: "/speakers",
        icon: <Users className="h-4 w-4" strokeWidth={2} />,
        status: "live",
      },
      {
        href: "/admin/team",
        label: "Team",
        description: "/team",
        icon: <UserCircle className="h-4 w-4" strokeWidth={2} />,
        status: "live",
      },
      {
        href: "/admin/posts",
        label: "Online Ideas",
        description: "/ideas",
        icon: <PenSquare className="h-4 w-4" strokeWidth={2} />,
        status: "live",
      },
    ],
  },
  {
    heading: "Access",
    items: [
      {
        href: "/admin/admins",
        label: "Admins",
        description: "Sign-in allowlist",
        icon: <ShieldCheck className="h-4 w-4" strokeWidth={2} />,
        status: "live",
      },
    ],
  },
];

// Flat list for backwards compat / Active checks
const NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export default function AdminShell({
  user,
  signOutAction,
  children,
}: {
  user: { email?: string | null };
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const Brand = (
    <div className="flex items-center gap-2.5">
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#e02214] font-mono text-[11px] font-bold text-white"
        aria-hidden
      >
        T
      </span>
      <div className="flex flex-col leading-none">
        <span className="text-[13.5px] font-semibold tracking-tight text-white">
          TEDxNewy
        </span>
        <span
          className="mt-1 font-mono text-[9px] font-semibold uppercase text-white/45"
          style={{ letterSpacing: "0.24em" }}
        >
          Admin
        </span>
      </div>
    </div>
  );

  const NavList = (
    <nav className="flex flex-col gap-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.heading} className="space-y-1.5">
          <div
            className="px-3 font-mono text-[9.5px] font-semibold uppercase text-white/35"
            style={{ letterSpacing: "0.28em" }}
          >
            {group.heading}
          </div>
          {group.items.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors " +
                  (active
                    ? "bg-white/[0.10] text-white"
                    : "text-white/65 hover:bg-white/[0.06] hover:text-white")
                }
              >
                <span
                  className={
                    "absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-r-full transition-all " +
                    (active ? "w-[3px] bg-[#ff3626]" : "w-0 bg-transparent")
                  }
                  aria-hidden
                />
                <span
                  className={
                    "inline-flex h-7 w-7 items-center justify-center rounded-md " +
                    (active
                      ? "bg-[#e02214] text-white"
                      : "bg-white/[0.04] text-white/55 group-hover:bg-white/[0.08] group-hover:text-white/80")
                  }
                >
                  {item.icon}
                </span>
                <span className="flex-1 text-[13.5px] font-medium">
                  {item.label}
                </span>
                {item.description && (
                  <span className="hidden font-mono text-[9.5px] text-white/35 md:inline">
                    {item.description}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col justify-between bg-[#111] px-5 py-7 md:flex">
        <div className="space-y-7">
          <Link href="/admin" className="block">
            {Brand}
          </Link>
          {NavList}
        </div>
        {SidebarFoot}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[rgba(20,18,16,0.08)] bg-white/90 px-5 py-3.5 backdrop-blur-sm md:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#e02214] font-mono text-[11px] font-bold text-white"
            aria-hidden
          >
            T
          </span>
          <span className="text-[13px] font-semibold tracking-tight">
            TEDxNewy Admin
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
          <aside className="relative flex h-full w-[280px] max-w-[85vw] flex-col justify-between bg-[#111] px-5 py-7 text-white">
            <div className="space-y-7">
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
      <main className="md:pl-[260px]">
        <div className="mx-auto max-w-[1100px] px-5 py-10 md:px-12 md:py-14">
          {children}
        </div>
      </main>
    </div>
  );
}
