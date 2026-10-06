"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type AskItem = { href: string; title: string; sub: string; kind: "area" | "station" };

// ถามแถวบ้าน: พิมพ์ชื่อตำบล อำเภอ หรือสถานี → ไปหน้าพื้นที่ (ระดับน้ำใกล้สุด เวลาน้ำมาถึง ฝน น้ำทะเลหนุน)
export function AskBox({ items, examples }: { items: AskItem[]; examples: AskItem[] }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().replace(/^(ต\.|ตำบล|อ\.|อำเภอ|จ\.|จังหวัด)\s*/, "").toLowerCase();
    if (s.length < 2) return [];
    return items
      .filter((x) => `${x.title} ${x.sub}`.toLowerCase().includes(s))
      .sort((a, b) => Number(b.title.includes(s)) - Number(a.title.includes(s)) || Number(a.kind === "station") - Number(b.kind === "station"))
      .slice(0, 8);
  }, [q, items]);

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-base font-semibold">ถามแถวบ้าน: น้ำแถวนี้เป็นยังไง</h2>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="พิมพ์ชื่อตำบล อำเภอ หรือสถานี เช่น เจดีย์หัก"
        className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base"
        aria-label="ค้นหาพื้นที่"
      />
      {q.trim().length >= 2 && (
        <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
          {results.map((x) => (
            <li key={x.href}>
              <Link href={x.href} className="block px-3 py-2.5 hover:bg-surface-2">
                <span className="font-semibold">{x.title}</span>
                <span className="block text-xs text-muted">{x.sub}</span>
              </Link>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-2.5 text-sm text-muted">ไม่พบ ลองพิมพ์ชื่อตำบลหรืออำเภอ (ครอบคลุมกาญจนบุรี ราชบุรี สมุทรสงคราม บ้านแพ้ว)</li>}
        </ul>
      )}
      {q.trim().length < 2 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {examples.map((x) => (
            <Link key={x.href} href={x.href} className="rounded-full border border-border px-3 py-1 text-sm hover:border-accent hover:text-accent">
              {x.title}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
