"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { workspaceForPath, type NavGroup, type NavItem } from "./nav-config";
import { ToastProvider } from "./Toaster";
import CommandPalette from "./CommandPalette";
import { EditProvider, ReadOnlyGuard } from "./EditContext";
import { canWriteAt, type AccessInfo } from "./access";
import { Icon, IconButton, type IconName } from "@/components/ds";

/**
 * The admin frame: a rail of workspaces (Home, Events, Comms, ...), and inside a
 * workspace a horizontal tab bar for its pages. On mobile the rail is a drawer
 * behind a top bar.
 */
export default function AdminShell({
  user,
  groups,
  signOutAction,
  access = { admin: true, canEdit: true, modules: {} },
  children,
  activeKey,
  activeHref,
  defaultOpen,
}: {
  user: { email?: string | null; label?: string | null };
  /** Already filtered to this sign-in's workspaces by the layout. */
  groups: NavGroup[];
  signOutAction: () => Promise<void>;
  /** What this sign-in may do: read or write per module, and whether it is an admin (Settings). */
  access?: AccessInfo;
  children: React.ReactNode;
  /** Force the active workspace (used by the no-login preview route). */
  activeKey?: string;
  /** Force the highlighted tab (used by the no-login preview route). */
  activeHref?: string;
  /** Start with the mobile drawer open (preview route only). */
  defaultOpen?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(!!defaultOpen);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // The desktop rail remembers whether it was shrunk.
  useEffect(() => {
    try {
      if (localStorage.getItem("adm-rail") === "collapsed") setCollapsed(true);
    } catch {}
  }, []);
  const toggleRail = () =>
    setCollapsed((v) => {
      try {
        localStorage.setItem("adm-rail", v ? "open" : "collapsed");
      } catch {}
      return !v;
    });

  // Cmd or Ctrl + K opens the jump-to-page search from anywhere in the admin.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const current = activeKey ?? workspaceForPath(pathname)?.key ?? "home";
  const active = groups.find((g) => g.key === current);

  const workspaces = groups.filter((g) => g.key !== "settings");
  const settings = groups.find((g) => g.key === "settings");
  const close = () => setOpen(false);

  const itemActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    const hit = (href: string) => pathname === href || pathname.startsWith(href + "/");
    if (!(hit(item.href) || (item.also ?? []).some(hit))) return false;
    // A deeper sibling keeps the highlight to itself: /admin/grants/library is
    // Letters and files, not also Grants.
    const siblings = groups.find((g) => g.items.includes(item))?.items ?? [];
    return !siblings.some((o) => o !== item && o.href.length > item.href.length && hit(o.href));
  };

  // Tabs: the overview (when the workspace has one), then its pages.
  const tabs =
    active && active.key !== "home" && (active.items.length > 1 || active.overview)
      ? [
          ...(active.overview ? [{ href: active.href, label: "Overview", on: (activeHref ?? pathname) === active.href }] : []),
          ...active.items.map((i) => ({ href: i.href, label: i.label, on: activeHref ? activeHref === i.href : itemActive(i) })),
        ]
      : [];

  const Rail = (
    <nav className="tx-nav" aria-label="Admin">
      <div className="adm-brandrow">
        <Link href="/admin" className="tx-nav__brand" onClick={close} aria-label="TEDxNewy admin home">
          <Image src="/brand/media/TEDxNewy-Standard-white.png" alt="TEDxNewy" width={1412} height={256} className="tx-nav__logo" priority />
        </Link>
        <button type="button" className="adm-collapse" onClick={toggleRail} aria-label={collapsed ? "Expand menu" : "Collapse menu"} aria-expanded={!collapsed} title={collapsed ? "Expand menu" : "Collapse menu"}>
          <Icon name="panel-left" size={18} />
        </button>
      </div>

      <button type="button" className="tx-nav__search" onClick={() => { close(); setPaletteOpen(true); }} style={{ border: 0, cursor: "pointer", width: "100%" }}>
        <Icon name="search" size={16} />
        <span>Jump to</span>
        <kbd>Ctrl K</kbd>
      </button>

      <div className="tx-nav__items">
        {workspaces.map((g) => (
          <Link
            key={g.key}
            href={g.href}
            onClick={close}
            className={"tx-nav__item" + (g.key === current ? " is-active" : "")}
          >
            <Icon name={g.icon as IconName} size={18} />
            <span>{g.heading}</span>
          </Link>
        ))}
      </div>

      <div className="tx-nav__foot">
        {settings ? (
          <Link
            href={settings.href}
            onClick={close}
            className={"tx-nav__item" + (settings.key === current ? " is-active" : "")}
          >
            <Icon name="settings" size={18} />
            <span>Settings</span>
          </Link>
        ) : null}
        <Link
          href="/admin/account"
          onClick={close}
          className={"tx-nav__item" + (pathname.startsWith("/admin/account") ? " is-active" : "")}
        >
          <Icon name="user" size={18} />
          <span>{access.admin ? "My account" : "Account"}</span>
        </Link>
        <Link href="/" target="_blank" rel="noreferrer" className="tx-nav__item">
          <Icon name="external-link" size={18} />
          <span>View live site</span>
        </Link>
        <span className="tx-nav__item tx-nav__user">
          <span className="tx-nav__avatar">{(user.label ?? user.email ?? "?").slice(0, 1)}</span>
          <span>{user.label ?? user.email}</span>
        </span>
        <form action={signOutAction}>
          <button type="submit" className="tx-nav__item" style={{ width: "100%", cursor: "pointer" }}>
            <Icon name="log-out" size={18} />
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <ToastProvider>
     <EditProvider access={access}>
      <div className={"voice-product adm-frame" + (collapsed ? " is-collapsed" : "")} data-ro={canWriteAt(pathname ?? "", access) ? undefined : "1"}>
        <ReadOnlyGuard />
        <aside className="adm-rail">{Rail}</aside>

        <header className="adm-top">
          <Link href="/admin" aria-label="TEDxNewy admin" className="adm-top__brand">
            <Image src="/brand/media/TEDxNewy-Standard-black.png" alt="TEDxNewy" width={1412} height={256} className="adm-top__logo" />
          </Link>
          <IconButton icon="menu" label="Open menu" onClick={() => setOpen(true)} />
        </header>

        {open && (
          <div className="adm-drawer">
            <button type="button" aria-label="Close menu" className="adm-drawer__scrim" onClick={close} />
            <div className="adm-drawer__panel">
              <div className="adm-drawer__close">
                <IconButton icon="x" label="Close menu" onClick={close} />
              </div>
              {Rail}
            </div>
          </div>
        )}

        <CommandPalette groups={groups} open={paletteOpen} onClose={() => setPaletteOpen(false)} />

        <main className="adm-main">
          {tabs.length > 0 && (
            <div className="adm-tabs" role="navigation" aria-label={`${active?.heading} pages`}>
              <div className="adm-tabs__inner">
                {tabs.map((t) => (
                  <Link key={t.href} href={t.href} className={"adm-tab" + (t.on ? " is-active" : "")}>
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="adm-main__inner">{children}</div>
        </main>
      </div>
     </EditProvider>
    </ToastProvider>
  );
}
