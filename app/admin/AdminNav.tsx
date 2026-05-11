"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/talks", label: "Talks" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {ITEMS.map((it) => {
        const active = it.exact
          ? pathname === it.href
          : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={
              "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors " +
              (active
                ? "bg-[#141210] text-white"
                : "text-[#6b6459] hover:bg-[rgba(20,18,16,0.06)] hover:text-[#141210]")
            }
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
