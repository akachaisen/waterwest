"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { removeSaved, useSavedAreas } from "./savedAreas";

type T = { id: string; t: string; te: string; a: string; p: string };
type P = { slug: string; name: string; sub: string };

const pinHref = (lat: number, lon: number) => `/area/pin?lat=${lat.toFixed(2)}&lon=${lon.toFixed(2)}`;

export function AreaPicker({ tambons, presets }: { tambons: T[]; presets: P[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const saved = useSavedAreas();
  const [gpsMsg, setGpsMsg] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/^(ต\.|ตำบล|อ\.|อำเภอ|จ\.|จังหวัด)\s*/, "");
    if (s.length < 1) return [];
    return tambons
      .filter((x) => x.t.includes(s) || x.a.includes(s) || x.p.includes(s) || x.te.toLowerCase().includes(s))
      .sort((a, b) => Number(b.t.startsWith(s)) - Number(a.t.startsWith(s)))
      .slice(0, 12);
  }, [q, tambons]);

  const useGps = () => {
    if (!navigator.geolocation) { setGpsMsg("เบราว์เซอร์นี้ไม่รองรับการหาตำแหน่ง"); return; }
    setGpsMsg("กำลังหาตำแหน่ง…");
    navigator.geolocation.getCurrentPosition(
      (pos) => router.push(pinHref(pos.coords.latitude, pos.coords.longitude)),
      () => setGpsMsg("ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง"),
      { timeout: 10000 },
    );
  };

  return (
    <div className="space-y-5">
      {saved.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-2 text-base font-semibold">พื้นที่ที่บันทึกไว้</h2>
          <ul className="divide-y divide-border">
            {saved.map((a) => (
              <li key={a.href} className="flex items-center gap-2 py-2">
                <Link href={a.href} className="min-w-0 flex-1 hover:text-accent">
                  <span className="block truncate font-semibold">{a.label || a.name}</span>
                  <span className="block truncate text-xs text-muted">{a.label ? `${a.name} · ` : ""}{a.sub}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => removeSaved(a.href)}
                  className="shrink-0 rounded-full px-2 py-1 text-xs text-muted hover:bg-surface-2 hover:text-red"
                  aria-label={`ลบ ${a.label || a.name}`}
                >
                  ลบ
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-muted">บันทึกไว้ในเบราว์เซอร์นี้เท่านั้น</p>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-surface p-4">
        <label htmlFor="area-q" className="mb-2 block text-base font-semibold">ค้นหาตำบล / อำเภอ</label>
        <input
          id="area-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="เช่น เจดีย์หัก, โพธาราม, อัมพวา"
          className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-base outline-none focus:border-accent"
          autoComplete="off"
        />
        {results.length > 0 && (
          <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
            {results.map((x) => (
              <li key={x.id}>
                <Link href={`/area/${x.id}`} className="block px-3 py-2 hover:bg-surface-2">
                  <span className="font-semibold">ต.{x.t}</span>
                  <span className="text-sm text-muted"> อ.{x.a} จ.{x.p}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {q.trim() && results.length === 0 && <p className="mt-2 text-sm text-muted">ไม่พบ — ครอบคลุมกาญจนบุรี ราชบุรี สมุทรสงคราม และ อ.บ้านแพ้ว</p>}
        <p className="mt-2 text-xs text-muted">ค้นหาในเครื่องของคุณ ไม่ส่งข้อความที่พิมพ์ไปที่ใด</p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-2 text-base font-semibold">พื้นที่ยอดนิยม</h2>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Link key={p.slug} href={`/area/${p.slug}`} className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-accent hover:text-accent">
              {p.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-2 text-base font-semibold">เลือกจากตำแหน่ง</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={useGps} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white dark:text-bg">
            📍 ใช้ตำแหน่งปัจจุบัน
          </button>
          <button type="button" onClick={() => setShowMap((v) => !v)} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-accent">
            🗺️ {showMap ? "ซ่อนแผนที่" : "แตะเลือกบนแผนที่"}
          </button>
        </div>
        {gpsMsg && <p className="mt-2 text-sm text-muted" role="status">{gpsMsg}</p>}
        {showMap && <PickMap onPick={(lat, lon) => router.push(pinHref(lat, lon))} />}
        <p className="mt-2 text-xs text-muted">ตำแหน่งถูกปัดเศษราว 1 กม. ก่อนใส่ในลิงก์ เพื่อไม่ให้ระบุบ้านได้ · ไม่มีการเก็บตำแหน่ง</p>
      </section>
    </div>
  );
}

function PickMap({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !box.current) return;
      map = L.map(box.current).setView([13.75, 99.8], 9);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      map.on("click", (e) => onPick(e.latlng.lat, e.latlng.lng));
    })();
    return () => { cancelled = true; map?.remove(); };
  }, [onPick]);
  return <div ref={box} className="mt-3 h-80 w-full overflow-hidden rounded-xl border border-border" aria-label="แผนที่สำหรับแตะเลือกพื้นที่" />;
}
