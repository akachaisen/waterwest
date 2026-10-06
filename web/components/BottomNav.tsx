"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// เมนูล่างสำหรับมือถือ (จอเล็กกว่า sm) — 4 ปุ่มหลัก + "เพิ่มเติม" เปิดรายการหน้าที่เหลือ
const MAIN = [
  { href: "/", label: "หน้าแรก", icon: "M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5" },
  { href: "/area", label: "บ้านฉัน", icon: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" },
  { href: "/map", label: "แผนที่", icon: "M9 4 3 6.5v13.5L9 17.5l6 2.5 6-2.5V4l-6 2.5zM9 4v13.5M15 6.5V20" },
  { href: "/alerts", label: "เตือนภัย", icon: "M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" },
];
const MORE = [
  { href: "/forecast", label: "น้ำจะมาถึงเมื่อไร", note: "เวลาน้ำเดินทาง น้ำทะเลหนุน ฝน" },
  { href: "/river", label: "เส้นทางน้ำ", note: "ผังแม่น้ำจากเขื่อนถึงอ่าวไทย" },
  { href: "/dams", label: "เขื่อน", note: "วชิราลงกรณ ศรีนครินทร์" },
  { href: "/cctv", label: "กล้องเขื่อน", note: "ภาพล่าสุด" },
  { href: "/stations", label: "สถานีวัดน้ำ", note: "ทุกสถานีพร้อมกราฟ" },
  { href: "/news", label: "ประกาศ", note: "ประกาศจากหน่วยงาน" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const moreActive = MORE.some((m) => isActive(m.href));

  return (
    <div className="sm:hidden">
      {open && (
        <>
          <button type="button" aria-label="ปิดเมนู" className="fixed inset-0 z-20 bg-black/30" onClick={() => setOpen(false)} />
          <div id="more-menu" className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 mx-3 rounded-2xl border border-border bg-surface p-2 shadow-lg">
            <ul>
              {MORE.map((m) => (
                <li key={m.href}>
                  <Link
                    href={m.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-3 py-2.5 ${isActive(m.href) ? "bg-accent/10 text-accent" : "hover:bg-surface-2"}`}
                  >
                    <span className="block font-semibold">{m.label}</span>
                    <span className="block text-xs text-muted">{m.note}</span>
                  </Link>
                </li>
              ))}
              <li>
                <a href="tel:1784" className="mt-1 block rounded-xl bg-red px-3 py-2.5 text-center font-bold text-white">
                  📞 โทรสายด่วน ปภ. 1784
                </a>
              </li>
            </ul>
          </div>
        </>
      )}
      <nav
        aria-label="เมนูหลัก"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="grid h-16 grid-cols-5">
          {MAIN.map((m) => {
            const active = isActive(m.href);
            return (
              <li key={m.href}>
                <Link
                  href={m.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-full flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold ${active ? "text-accent" : "text-muted"}`}
                >
                  <Icon d={m.icon} />
                  {m.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="more-menu"
              className={`flex h-full w-full flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold ${open || moreActive ? "text-accent" : "text-muted"}`}
            >
              <Icon d="M4 7h16M4 12h16M4 17h16" />
              เพิ่มเติม
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
