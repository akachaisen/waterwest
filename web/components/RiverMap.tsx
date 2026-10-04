"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as LMap, LayerGroup } from "leaflet";

export type MapStation = {
  code: string;
  name: string;
  lat: number;
  lon: number;
  level: string;
  label: string;
  diffBank: number | null;
  q: number | null;
  time: string | null;
  isKey: boolean;
  stale: boolean;
};
export type MapPlace = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  kind: "dam" | "home" | "mouth";
  note?: string;
  facts?: string[];
  camera?: { src: string; name: string };
};

const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + " น." : "-";

// สร้าง popup ด้วย DOM (textContent) ไม่ต่อ HTML จากข้อมูล
function el(tag: string, text?: string, style?: string, children: Node[] = []) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (style) e.setAttribute("style", style);
  children.forEach((c) => e.appendChild(c));
  return e;
}

function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function RiverMap({ stations, places, showRadar = false }: { stations: MapStation[]; places: MapPlace[]; showRadar?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const meRef = useRef<LayerGroup | null>(null);
  const [near, setNear] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !box.current || mapRef.current) return;
      const css = getComputedStyle(document.documentElement);
      const color = (lv: string) => css.getPropertyValue(`--${lv}`).trim() || "#888";
      const surface = css.getPropertyValue("--surface").trim() || "#fff";

      const map = L.map(box.current, { scrollWheelZoom: false, attributionControl: true });
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const stationLayer = L.layerGroup();
      for (const s of stations) {
        const lv = s.stale ? "unknown" : s.level;
        const m = L.circleMarker([s.lat, s.lon], {
          radius: s.isKey ? 9 : 7,
          color: surface,
          weight: 2,
          fillColor: color(lv),
          fillOpacity: 1,
        });
        const link = el("a", "ดูกราฟ 7 วัน →", "font-weight:600");
        link.setAttribute("href", `/stations/${encodeURIComponent(s.code)}`);
        m.bindPopup(
          el("div", undefined, "font-family:inherit;min-width:180px", [
            el("div", s.name, "font-weight:700"),
            el("div", s.code, "color:#64748b;font-size:12px"),
            el("div", `${s.stale ? "ข้อมูลเก่า" : s.label} · เทียบตลิ่ง ${s.diffBank === null ? "-" : (s.diffBank > 0 ? "+" : "") + s.diffBank.toFixed(2) + " ม."}`, `margin-top:4px;color:${color(lv)};font-weight:600`),
            ...(s.q !== null ? [el("div", `ปริมาณ ${Math.round(s.q).toLocaleString()} ลบ.ม./วิ`)] : []),
            el("div", `วัดเมื่อ ${fmtTime(s.time)}`, "color:#64748b;font-size:12px"),
            el("div", undefined, "margin-top:4px", [link]),
          ]),
        );
        m.bindTooltip(s.name, { direction: "top", offset: [0, -6] });
        stationLayer.addLayer(m);
      }

      const placeLayer = L.layerGroup();
      for (const p of places) {
        const shape =
          p.kind === "dam"
            ? `<div style="width:18px;height:18px;border-radius:4px;background:${color("accent")};border:3px solid ${surface};box-shadow:0 0 0 1px ${color("accent")}"></div>`
            : p.kind === "home"
              ? `<div style="width:20px;height:20px;border-radius:50%;background:${surface};border:4px solid ${color("orange")}"></div>`
              : `<div style="width:16px;height:16px;border-radius:50%;background:${surface};border:4px solid ${color("river")}"></div>`;
        const icon = L.divIcon({ html: shape, className: "", iconSize: [20, 20], iconAnchor: [10, 10] });
        const kids: Node[] = [el("div", p.name, "font-weight:700")];
        if (p.note) kids.push(el("div", p.note, "color:#64748b;font-size:12px"));
        for (const f of p.facts ?? []) kids.push(el("div", f, "margin-top:2px"));
        if (p.camera) {
          const img = el("img") as HTMLImageElement;
          img.src = p.camera.src;
          img.alt = `ภาพจากกล้อง ${p.camera.name}`;
          img.setAttribute("style", "margin-top:6px;width:220px;border-radius:6px;display:block");
          kids.push(img, el("div", `กล้อง กฟผ.: ${p.camera.name}`, "color:#64748b;font-size:11px"));
        }
        L.marker([p.lat, p.lon], { icon, title: p.name }).bindPopup(el("div", undefined, "font-family:inherit", kids)).addTo(placeLayer);
      }

      stationLayer.addTo(map);
      placeLayer.addTo(map);
      const overlays: Record<string, L.Layer> = { "สถานีวัดน้ำ": stationLayer, "เขื่อนและจุดสำคัญ": placeLayer };

      // เรดาร์ฝนล่าสุดจาก RainViewer (เปิดเองจากปุ่มชั้นข้อมูล หรือเปิดอัตโนมัติเมื่อ showRadar)
      try {
        const rv = await fetch("https://api.rainviewer.com/public/weather-maps.json").then((r) => r.json());
        const frame = rv.radar?.past?.[rv.radar.past.length - 1];
        if (frame) {
          const when = new Date(frame.time * 1000).toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" });
          const radar = L.tileLayer(`${rv.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`, {
            opacity: 0.6,
            maxNativeZoom: 7,
            maxZoom: 18,
            attribution: '<a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a>',
          });
          overlays[`เรดาร์ฝน (${when} น.)`] = radar;
          if (showRadar) radar.addTo(map);
        }
      } catch {
        // ไม่มีเรดาร์ก็ยังใช้แผนที่ได้
      }
      if (cancelled) return;
      L.control.layers(undefined, overlays, { collapsed: !showRadar }).addTo(map);
      const pts = [...stations.map((s) => [s.lat, s.lon] as [number, number]), ...places.map((p) => [p.lat, p.lon] as [number, number])];
      map.fitBounds(L.latLngBounds(pts), { padding: [20, 20] });
      meRef.current = L.layerGroup().addTo(map);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [stations, places, showRadar]);

  // ตำแหน่งของผู้ใช้ใช้ในเครื่องเท่านั้น ไม่ส่งไปที่ใด
  const locate = () => {
    if (!navigator.geolocation) { setNear("เบราว์เซอร์นี้ไม่รองรับการหาตำแหน่ง"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocating(false);
        const me: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        const L = (await import("leaflet")).default;
        meRef.current?.clearLayers();
        L.circleMarker(me, { radius: 8, color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }).bindTooltip("ตำแหน่งของคุณ").addTo(meRef.current!);
        const nearest = [...stations].sort((a, b) => distanceKm(me, [a.lat, a.lon]) - distanceKm(me, [b.lat, b.lon]))[0];
        if (nearest) {
          const d = distanceKm(me, [nearest.lat, nearest.lon]);
          setNear(`สถานีใกล้คุณที่สุด: ${nearest.name} (${nearest.code}) ห่าง ${d.toFixed(1)} กม. · ${nearest.stale ? "ข้อมูลเก่า" : nearest.label}`);
          mapRef.current?.fitBounds(L.latLngBounds([me, [nearest.lat, nearest.lon]]), { padding: [40, 40], maxZoom: 13 });
        }
      },
      () => { setLocating(false); setNear("ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง"); },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={locate}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:text-bg"
          disabled={locating}
        >
          {locating ? "กำลังหาตำแหน่ง…" : "📍 ใกล้ฉัน"}
        </button>
        <span className="text-xs text-muted">ตำแหน่งใช้คำนวณในเครื่องของคุณเท่านั้น ไม่ถูกส่งไปเก็บ</span>
      </div>
      {near && <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm" role="status">{near}</p>}
      <div ref={box} className="h-[70vh] min-h-[420px] w-full overflow-hidden rounded-2xl border border-border" aria-label="แผนที่สถานีวัดน้ำและเขื่อนลุ่มน้ำแม่กลอง" />
    </div>
  );
}
