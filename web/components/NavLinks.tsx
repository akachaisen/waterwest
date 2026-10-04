"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "ภาพรวม" },
  { href: "/area", label: "พื้นที่ของฉัน" },
  { href: "/alerts", label: "เตือนภัย" },
  { href: "/river", label: "เส้นทางน้ำ" },
  { href: "/forecast", label: "คาดการณ์" },
  { href: "/dams", label: "เขื่อน" },
  { href: "/stations", label: "สถานี" },
  { href: "/map", label: "แผนที่" },
  { href: "/cctv", label: "กล้อง" },
  { href: "/news", label: "ประกาศ" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar flex w-full gap-0.5 overflow-x-auto text-sm sm:w-auto">
      {LINKS.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-full px-2.5 py-1.5 font-medium sm:px-3 transition-colors ${
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
