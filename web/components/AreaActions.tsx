"use client";

import { useState } from "react";
import { addSaved, removeSaved, useSavedAreas } from "./savedAreas";

// ปุ่มบันทึก (ตั้งชื่อเองได้ เช่น "บ้านแม่") และแชร์ลิงก์พื้นที่
export function AreaActions({ href, name, sub }: { href: string; name: string; sub: string }) {
  const saved = useSavedAreas().some((x) => x.href === href);
  const [msg, setMsg] = useState<string | null>(null);

  const toggle = () => {
    if (saved) {
      removeSaved(href);
      setMsg("ลบออกจากพื้นที่ที่บันทึกแล้ว");
      return;
    }
    const label = window.prompt("ตั้งชื่อพื้นที่นี้ (เช่น บ้าน, บ้านแม่) — เว้นว่างได้", "")?.trim().slice(0, 40);
    addSaved({ href, name, sub, label: label || undefined });
    setMsg("บันทึกแล้ว ดูได้ที่หน้า พื้นที่ของฉัน");
  };

  const share = async () => {
    const url = new URL(href, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: `WaterWest — ${name}`, text: `สถานการณ์น้ำ ${name}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setMsg("คัดลอกลิงก์แล้ว");
    } catch {
      // ผู้ใช้ยกเลิกการแชร์
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={saved}
        className={`rounded-full px-4 py-2 text-sm font-semibold ${saved ? "border border-accent text-accent" : "bg-accent text-white dark:text-bg"}`}
      >
        {saved ? "★ บันทึกแล้ว" : "☆ บันทึกพื้นที่นี้"}
      </button>
      <a
        href={`https://line.me/R/share?text=${encodeURIComponent(`สถานการณ์น้ำ ${name} (${sub}) — WaterWest
https://waterwest.info${href}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-[#06c755] px-4 py-2 text-sm font-semibold text-white"
      >
        แชร์ทาง LINE
      </a>
      <button type="button" onClick={share} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-accent">
        แชร์ลิงก์
      </button>
      {msg && <span className="text-xs text-muted" role="status">{msg}</span>}
    </div>
  );
}
