"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "ภาพรวม" },
  { href: "/river", label: "เส้นทางน้ำ" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 text-sm">
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
              active ? "bg-accent text-white dark:text-bg" : "text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
