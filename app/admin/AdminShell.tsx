"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavGroup, NavItem } from "./nav-config";
import { ToastProvider } from "./Toaster";
import { accountLabel } from "@/lib/admin-accounts";
import { Icon, IconButton, type IconName } from "@/components/ds";

/**
 * The admin frame: a rail of workspaces (Home, Events, Comms, ...) with Settings
 * and the signed-in account at the foot. The workspace you are in opens to show
 * its pages. On mobile the rail is a drawer behind a top bar.
 */
export default function AdminShell({
  user,
  groups,
  signOutAction,
  children,
  activeKey,
  defaultOpen,
}: {
  user: { email?: string | null };
  /** Already filtered to this admin's access level by the layout. */
  groups: NavGroup[];
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
  /** Force the active workspace (used by the no-login preview route). */
  activeKey?: string;
  /** Start with the mobile drawer open (preview route only). */
  defaultOpen?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(!!defaultOpen);

  const itemActive = (item: NavItem) =>
    item.exact
      ? pathname === item.href
      : pathname.startsWith(item.href) || (item.also ?? []).some((a) => pathname.startsWith(a));
  const groupActive = (g: NavGroup) =>
    activeKey
      ? g.key === activeKey
      : g.key === "home"
        ? pathname === "/admin"
        : pathname.startsWith(g.href) || g.items.some(itemActive);

  const workspaces = groups.filter((g) => g.key !== "settings");
  const settings = groups.find((g) => g.key === "settings");
  const close = () => setOpen(false);

  const Rail = (
    <nav className="tx-nav" aria-label="Admin">
      <Link href="/admin" className="tx-nav__brand" onClick={close}>
        <Image src="/brand/tedxnewy-white.png" alt="TEDxNewy" width={680} height={170} className="tx-nav__logo" priority />
      </Link>

      <div className="tx-nav__items">
        {workspaces.map((g) => {
          const active = groupActive(g);
          return (
            <div key={g.key}>
              <Link href={g.href} onClick={close} className={"tx-nav__item" + (active ? " is-active" : "")}>
                <Icon name={g.icon as IconName} size={18} />
                <span>{g.heading}</span>
              </Link>
              {active && g.items.length > 1 && (
                <div className="adm-sub">
                  {g.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className={"adm-sub__item" + (itemActive(item) ? " is-active" : "")}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="tx-nav__foot">
        {settings && (
          <div>
            <Link
              href={settings.href}
              onClick={close}
              className={"tx-nav__item" + (groupActive(settings) ? " is-active" : "")}
            >
              <Icon name="settings" size={18} />
              <span>Settings</span>
            </Link>
            {groupActive(settings) && (
              <div className="adm-sub">
                {settings.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className={"adm-sub__item" + (itemActive(item) ? " is-active" : "")}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        <Link href="/" target="_blank" rel="noreferrer" className="tx-nav__item">
          <Icon name="external-link" size={18} />
          <span>View live site</span>
        </Link>
        <span className="tx-nav__item tx-nav__user">
          <span className="tx-nav__avatar">{accountLabel(user.email).slice(0, 1)}</span>
          <span>{accountLabel(user.email)}</span>
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
      <div className="voice-product adm-frame">
        <aside className="adm-rail">{Rail}</aside>

        <header className="adm-top">
          <Link href="/admin" aria-label="TEDxNewy admin" className="adm-top__brand">
            <Image src="/brand/tedxnewy-black.png" alt="TEDxNewy" width={680} height={170} style={{ height: 20, width: "auto" }} />
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

        <main className="adm-main">
          <div className="adm-main__inner">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
