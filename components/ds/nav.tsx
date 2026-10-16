import Link from "next/link";
import { Icon, type IconName } from "./Icon";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/** The favicon on its own: a white x in a TED red circle. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="tx-mark">
      <circle cx="16" cy="16" r="16" fill="var(--red)" />
      <g fill="var(--white)" transform="rotate(45 16 16)">
        <rect x="12" y="4" width="8" height="24" />
        <rect x="4" y="12" width="24" height="8" />
      </g>
    </svg>
  );
}

export type AdminNavItem = { key: string; label: string; icon: IconName; href: string; count?: number };

/** The admin rail: brand, search, six workspaces, then Settings and you. */
export function AdminNav({
  items,
  active,
  user,
  compact,
  logo,
  settingsHref = "/admin/settings",
}: {
  items: AdminNavItem[];
  active?: string;
  user?: string;
  compact?: boolean;
  logo?: string;
  settingsHref?: string;
}) {
  return (
    <nav className={cx("tx-nav", compact && "tx-nav--compact")} aria-label="Admin">
      <div className="tx-nav__brand">
        <BrandMark />
        {!compact &&
          (logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="tx-nav__logo" src={logo} alt="TEDxNewy" />
          ) : (
            <span>TEDxNewy</span>
          ))}
      </div>
      <div className="tx-nav__items">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cx("tx-nav__item", item.key === active && "is-active")}
            title={item.label}
          >
            <Icon name={item.icon} size={18} />
            {!compact && <span>{item.label}</span>}
            {!compact && item.count != null && <span className="tx-nav__count">{item.count}</span>}
          </Link>
        ))}
      </div>
      <div className="tx-nav__foot">
        <Link href={settingsHref} className="tx-nav__item">
          <Icon name="settings" size={18} />
          {!compact && <span>Settings</span>}
        </Link>
        {user && (
          <span className="tx-nav__item tx-nav__user">
            <span className="tx-nav__avatar">{user.slice(0, 1)}</span>
            {!compact && <span>{user}</span>}
          </span>
        )}
      </div>
    </nav>
  );
}
