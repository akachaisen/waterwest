"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { RiverMap, type MapPlace, type MapStation } from "./RiverMap";
import { StationHero } from "./StationHero";
import type { Level } from "@/lib/types";
import { SOURCE_NAME } from "@/lib/status";

// แผนที่ + แผงรายละเอียดสถานีด้านขวา (จอคอม) · มือถือใช้ป๊อปอัปแล้วกดไปหน้าสถานี
// สถานีที่เลือกอยู่ในลิงก์ (?s=K.2B) จึงแชร์หน้าแผนที่ที่เปิดสถานีนั้นได้
export function MapExplorer({ stations, places, showRadar, initial }: { stations: MapStation[]; places: MapPlace[]; showRadar: boolean; initial: string | null }) {
  const [code, setCode] = useState<string | null>(initial && stations.some((s) => s.code === initial) ? initial : null);
  const select = useCallback((c: string) => {
    setCode(c);
    const u = new URL(window.location.href);
    u.searchParams.set("s", c);
    window.history.replaceState(null, "", u);
  }, []);
  const close = () => {
    setCode(null);
    const u = new URL(window.location.href);
    u.searchParams.delete("s");
    window.history.replaceState(null, "", u);
  };
  const st = stations.find((s) => s.code === code);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-4">
      <RiverMap stations={stations} places={places} showRadar={showRadar} focus={initial} onSelect={select} />
      <aside className="hidden lg:block" aria-label="รายละเอียดสถานี">
        {st ? (
          <div className="sticky top-20 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold leading-snug">
                  {st.code} · {st.name}
                </h2>
                {st.source && <p className="text-xs text-muted">{SOURCE_NAME[st.source] ?? st.source}</p>}
              </div>
              <button type="button" onClick={close} className="rounded-full px-2 text-lg text-muted hover:text-text" aria-label="ปิดแผงรายละเอียด">
                ×
              </button>
            </div>
            <StationHero s={{ ...st, level: st.level as Level }} />
            <Link href={`/stations/${encodeURIComponent(st.code)}`} className="block rounded-xl border border-border bg-surface px-4 py-2.5 text-center text-sm font-semibold text-accent hover:border-accent">
              ดูกราฟ 7 วัน กล้อง และเกณฑ์บ้านฉัน ›
            </Link>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">แตะจุดสถานีบนแผนที่เพื่อดูไม้วัดระดับน้ำและรายละเอียดตรงนี้</p>
        )}
      </aside>
    </div>
  );
}
