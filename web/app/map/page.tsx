import type { Metadata } from "next";
import { getSnapshot } from "@/lib/data";
import { fmt, fmtTime } from "@/lib/status";
import { CAMERAS, PLACES } from "@/lib/places";
import { levelDot } from "@/components/ui";
import type { MapPlace, MapStation } from "@/components/RiverMap";
import { MapExplorer } from "@/components/MapExplorer";

export const revalidate = 300;
export const metadata: Metadata = { title: "แผนที่" };

type Props = { searchParams: Promise<{ radar?: string; s?: string }> };

export default async function MapPage({ searchParams }: Props) {
  const { radar, s: focus } = await searchParams;
  const s = await getSnapshot();
  const stations: MapStation[] = s.stations
    .filter((x) => x.lat !== null && x.lon !== null)
    .map((x) => ({
      code: x.code, name: x.name, lat: x.lat!, lon: x.lon!, level: x.level, label: x.label,
      diffBank: x.diffBank, q: x.q, time: x.time, isKey: x.isKey, stale: x.stale,
      wl: x.wl, change1h: x.change1h, change24h: x.change24h, ageMin: x.ageMin, sign: x.sign, source: x.source,
    }));
  const places: MapPlace[] = PLACES.map((p) => {
    const dam = p.damId ? s.dams.find((d) => d.id === p.damId) : undefined;
    const facts = dam
      ? [`ความจุ ${fmt(dam.pct, 1)}% · เข้า ≈${fmt(dam.inflowCms)} · ระบาย ≈${fmt(dam.outflowCms)} ลบ.ม./วิ`]
      : p.id === "mk" && s.maeklongQ
        ? [`น้ำท้ายเขื่อน ≈${fmt(s.maeklongQ.q)} ลบ.ม./วิ (วัดที่ K.55A)`]
        : p.kind === "mouth" && s.seaPeak
          ? [`น้ำทะเลสูงสุด 24 ชม. ${fmt(s.seaPeak.m, 2)} ม. (แบบจำลอง)`]
          : [];
    const cam = p.id === "vrk" ? CAMERAS.find((c) => c.id === "vrk-spill") : p.id === "snr" ? CAMERAS.find((c) => c.id === "snr-gauge") : undefined;
    return { id: p.id, name: p.name, lat: p.lat, lon: p.lon, kind: p.kind, note: p.note, facts, camera: cam ? { src: cam.src, name: cam.name } : undefined };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">แผนที่ลุ่มน้ำแม่กลอง</h1>
        <p className="mt-1 text-sm text-muted">
          {stations.length} สถานีวัดน้ำ · เขื่อน 4 แห่ง · แตะจุดเพื่อดูรายละเอียด · ดึงข้อมูล {fmtTime(s.generatedAt)}
        </p>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {([["red", "ล้นตลิ่ง"], ["orange", "ใกล้ตลิ่ง (ไม่ถึง 1 ม.)"], ["green", "ปกติ"], ["unknown", "ไม่มีข้อมูล / ข้อมูลเก่า"]] as const).map(([l, t]) => (
          <li key={l} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${levelDot(l)}`} aria-hidden />
            {t}
          </li>
        ))}
        <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-accent" aria-hidden />เขื่อน</li>
        <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full border-2 border-orange" aria-hidden />พื้นที่ที่ติดตาม</li>
      </ul>
      <MapExplorer stations={stations} places={places} showRadar={radar === "1"} initial={focus ?? null} />
      <p className="text-xs text-muted">
        แผนที่ © ผู้ร่วมพัฒนา OpenStreetMap · ตำแหน่งสถานีจาก ThaiWater / กรมชลประทาน · หมุดเจดีย์หักอยู่ที่โบราณสถานเจดีย์หัก ไม่ใช่บ้านเลขที่
      </p>
    </div>
  );
}
