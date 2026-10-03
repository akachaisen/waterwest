import "server-only";
import { KM_FROM_MAEKLONG_DAM, MOUTH_KM, travelHours } from "./route";
import type { Snapshot, Station } from "./types";

const UA = { "User-Agent": "WaterWest/0.1 (non-commercial Mae Klong flood monitoring)" };
const TZ_OFFSET = "+07:00";

// ---------- มวลน้ำกำลังเดินทาง ----------
// ใช้สถานี K.55A บ้านโป่ง เป็นจุดตั้งต้น (มีข้อมูลต่อเนื่องและอยู่ต้นช่วงที่มีชุมชนหนาแน่น)
export type Eta = { code: string; name: string; km: number; hoursFromBase: number; eta: string; station?: Station };

export const BASE_CODE = "K.55A";
const DOWNSTREAM = [
  { code: "K.56A", name: "โพธาราม (บ้านหม้อ)" },
  { code: "K.2B", name: "ตัวเมืองราชบุรี / เจดีย์หัก" },
  { code: "K.57", name: "บางคนที (บ้านกระดังงา)" },
  { code: "TK.74", name: "เมืองสมุทรสงคราม" },
  { code: "MOUTH", name: "ปากแม่น้ำแม่กลอง · อ่าวไทย" },
];

export function travelPlan(s: Snapshot): { base: Station | undefined; rows: Eta[] } {
  const base = s.stations.find((x) => x.code === BASE_CODE);
  if (!base?.time) return { base, rows: [] };
  const t0 = new Date(base.time).getTime();
  const h0 = travelHours(KM_FROM_MAEKLONG_DAM[BASE_CODE]);
  const rows = DOWNSTREAM.map((d) => {
    const km = d.code === "MOUTH" ? MOUTH_KM : KM_FROM_MAEKLONG_DAM[d.code];
    const h = travelHours(km) - h0;
    return { code: d.code, name: d.name, km, hoursFromBase: h, eta: new Date(t0 + h * 3600e3).toISOString(), station: s.stations.find((x) => x.code === d.code) };
  });
  return { base, rows };
}

// ---------- น้ำทะเลหนุน (Open-Meteo Marine — แบบจำลอง) ----------
export type Tide = { time: string; m: number; kind: "high" | "low" };
export type SeaSeries = { points: [number, number | null][]; tides: Tide[] };

export async function getSea(): Promise<SeaSeries> {
  const url =
    "https://marine-api.open-meteo.com/v1/marine?latitude=13.36&longitude=100.0&hourly=sea_level_height_msl&timezone=Asia%2FBangkok&past_days=1&forecast_days=3";
  const j = await fetch(url, { headers: UA, next: { revalidate: 3600 } }).then((r) => r.json());
  const t: string[] = j.hourly.time;
  const v: (number | null)[] = j.hourly.sea_level_height_msl;
  const ms = t.map((x) => new Date(`${x}:00${TZ_OFFSET}`).getTime());
  const tides: Tide[] = [];
  for (let i = 1; i < v.length - 1; i++) {
    const [a, b, c] = [v[i - 1], v[i], v[i + 1]];
    if (a === null || b === null || c === null) continue;
    if (b >= a && b > c) tides.push({ time: new Date(ms[i]).toISOString(), m: b, kind: "high" });
    if (b <= a && b < c) tides.push({ time: new Date(ms[i]).toISOString(), m: b, kind: "low" });
  }
  return { points: ms.map((x, i) => [x, v[i]]), tides };
}

// น้ำขึ้นสูงครั้งถัดไป (นับจาก 1 ชม. ก่อนตอนนี้)
export function upcomingHighs(sea: SeaSeries | null, n = 4): Tide[] {
  const from = Date.now() - 3600e3;
  return (sea?.tides ?? []).filter((t) => t.kind === "high" && new Date(t.time).getTime() > from).slice(0, n);
}

// ช่วงที่มวลน้ำจากต้นน้ำถึงสมุทรสงครามใกล้กับเวลาน้ำขึ้นสูง (±3 ชม.) — เสี่ยงน้ำเอ่อสูงกว่าปกติ
// แบบจำลองบอกเวลาที่ทะเลหน้าอ่าว ตัวเมืองสมุทรสงครามช้ากว่าราว 1 ชม. (เทียบกับ MKG006)
export const TOWN_TIDE_LAG_H = 1;

export function tideClash(arrivalIso: string, tides: Tide[]): Tide | undefined {
  const a = new Date(arrivalIso).getTime();
  return tides
    .filter((t) => t.kind === "high")
    .map((t) => ({ ...t, at: new Date(t.time).getTime() + TOWN_TIDE_LAG_H * 3600e3 }))
    .find((t) => Math.abs(t.at - a) <= 3 * 3600e3);
}

// ---------- ฝน 7 วัน (Open-Meteo) ----------
export type RainDay = { date: string; mm: number | null; prob: number | null };
export type RainArea = { id: string; name: string; days: RainDay[] };

const RAIN_POINTS = [
  { id: "vrk", name: "เหนืออ่างวชิราลงกรณ", lat: 14.95, lon: 98.55 },
  { id: "snr", name: "เหนืออ่างศรีนครินทร์", lat: 14.85, lon: 98.95 },
  { id: "kan", name: "กาญจนบุรี (จุดรวมแม่น้ำ)", lat: 14.02, lon: 99.53 },
  { id: "rbr", name: "ราชบุรี / เจดีย์หัก", lat: 13.54, lon: 99.8 },
];

export async function getRain7(): Promise<RainArea[]> {
  const lat = RAIN_POINTS.map((p) => p.lat).join(",");
  const lon = RAIN_POINTS.map((p) => p.lon).join(",");
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,precipitation_probability_max&timezone=Asia%2FBangkok&forecast_days=7`;
  const j = await fetch(url, { headers: UA, next: { revalidate: 3600 } }).then((r) => r.json());
  const arr = Array.isArray(j) ? j : [j];
  return RAIN_POINTS.map((p, i) => ({
    id: p.id,
    name: p.name,
    days: arr[i].daily.time.map((d: string, k: number) => ({ date: d, mm: arr[i].daily.precipitation_sum[k], prob: arr[i].daily.precipitation_probability_max[k] })),
  }));
}
