"use client";

import { useState } from "react";

// แชร์ลิงก์หน้านี้ทาง LINE หรือคัดลอก/แชร์ของเครื่อง
export function ShareLinks({ href, text }: { href: string; text: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const share = async () => {
    const url = new URL(href, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: `WaterWest — ${text}`, text, url });
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
      <a
        href={`https://line.me/R/share?text=${encodeURIComponent(`${text} — WaterWest\nhttps://waterwest.info${href}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-[#06c755] px-4 py-1.5 text-sm font-semibold text-white"
      >
        แชร์ทาง LINE
      </a>
      <button type="button" onClick={share} className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold hover:border-accent">
        แชร์ลิงก์
      </button>
      {msg && <span className="text-xs text-muted" role="status">{msg}</span>}
    </div>
  );
}
