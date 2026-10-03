import "server-only";
import riversData from "@/data/rivers.json";
import tambonsData from "@/data/tambons.json";
import { CANAL_STATIONS, KM_FROM_MAEKLONG_DAM, travelHours } from "./route";
import type { Level, Snapshot, Station } from "./types";

// ---------- ข้อมูลพื้นที่ ----------
// ตำบล: UN OCHA COD-AB (อ้างอิงเขตการปกครองของรัฐบาลไทย) · เส้นแม่น้ำ: OpenStreetMap
export type Tambon = { id: string; t: string; te: string; a: string; ae: string; p: string; lat: number; lon: number; km2: number };
export const TAMBONS = tambonsData as Tambon[];

export type Preset = { slug: string; name: string; tambonId: string; lat?: number; lon?: number; note?: string };
export const PRESETS: Preset[] = [
  { slug: "chedihak-moo3", name: "บ้านเจดีย์หัก หมู่ 3", tambonId: "TH700102", lat: 13.543, lon: 99.7984, note: "หมุดที่โบราณสถานเจดีย์หัก" },
  { slug: "ratchaburi-city", name: "ตัวเมืองราชบุรี / ตลาดโคยกี๊", tambonId: "TH700101" },
  { slug: "ban-pong", name: "บ้านโป่ง", tambonId: "TH700501" },
  { slug: "photharam", name: "โพธาราม", tambonId: "TH700701" },
  { slug: "tha-muang", name: "ท่าม่วง", tambonId: "TH710601" },
  { slug: "kanchanaburi-city", name: "เมืองกาญจนบุรี", tambonId: "TH710101" },
  { slug: "bang-khonthi", name: "บางคนที", tambonId: "TH750205" },
  { slug: "amphawa", name: "อัมพวา", tambonId: "TH750301" },
  { slug: "samut-songkhram-city", name: "เมืองสมุทรสงคราม", tambonId: "TH750101" },
  { slug: "damnoen-saduak", name: "ดำเนินสะดวก", tambonId: "TH700401" },
  { slug: "ban-phaeo", name: "บ้านแพ้ว", tambonId: "TH740301" },
];

export type Place = { key: string; name: string; sub: string; lat: number; lon: number; approx?: string; tambon?: Tambon };

// id: preset slug | รหัสตำบล (TH700102) | "pin" + พิกัด (ปัดทศนิยม 2 ตำแหน่ง ≈ 1 กม. เพื่อความเป็นส่วนตัว)
export function resolvePlace(id: string, lat?: string, lon?: string): Place | null {
  const preset = PRESETS.find((p) => p.slug === id);
  if (preset) {
    const t = TAMBONS.find((x) => x.id === preset.tambonId)!;
    return {
      key: preset.slug,
      name: preset.name,
      sub: `ต.${t.t} อ.${t.a} จ.${t.p}`,
      lat: preset.lat ?? t.lat,
      lon: preset.lon ?? t.lon,
      approx: preset.note ?? "ตำแหน่งกลางตำบล",
      tambon: t,
    };
  }
  const t = TAMBONS.find((x) => x.id === id.toUpperCase());
  if (t) return { key: t.id, name: `ต.${t.t}`, sub: `อ.${t.a} จ.${t.p}`, lat: t.lat, lon: t.lon, approx: "ตำแหน่งกลางตำบล", tambon: t };
  if (id === "pin") {
    const la = Number(lat);
    const lo = Number(lon);
    if (!Number.isFinite(la) || !Number.isFinite(lo) || la < 12.5 || la > 16 || lo < 98 || lo > 101) return null;
    const near = nearestTambon(la, lo);
    return {
      key: `pin:${la.toFixed(2)},${lo.toFixed(2)}`,
      name: "จุดที่เลือก",
      sub: near ? `ใกล้ ต.${near.t} อ.${near.a} จ.${near.p}` : "",
      lat: Math.round(la * 100) / 100,
      lon: Math.round(lo * 100) / 100,
      approx: "พิกัดปัดเศษราว 1 กม.",
      tambon: near ?? undefined,
    };
  }
  return null;
}

// ---------- เรขาคณิต ----------
const R = 6371;
export function distKm(a: [number, number], b: [number, number]) {
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// ระยะจากจุดถึงส่วนของเส้น (ประมาณบนระนาบ ใช้ได้ในระยะไม่กี่สิบ กม.) คืน [ระยะ, สัดส่วนตำแหน่งบนส่วนเส้น]
function segment(p: [number, number], a: number[], b: number[]): [number, number] {
  const ky = 111.32;
  const kx = 111.32 * Math.cos((p[0] * Math.PI) / 180);
  const ax = (a[1] - p[1]) * kx, ay = (a[0] - p[0]) * ky;
  const bx = (b[1] - p[1]) * kx, by = (b[0] - p[0]) * ky;
  const dx = bx - ax, dy = by - ay;
  const L = dx * dx + dy * dy;
  const t = L === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L));
  return [Math.hypot(ax + t * dx, ay + t * dy), t];
}

type Rivers = { maeklong: { points: number[][]; km: number[] }; khwaenoi: number[][][]; khwaeyai: number[][][]; maeklong_up: number[][][] };
const RIVERS = riversData as Rivers;

// ตำแหน่งบนแม่น้ำแม่กลอง (ท้ายเขื่อน): ระยะห่าง + กม. ตามลำน้ำจากเขื่อนแม่กลอง
function onMaeklong(p: [number, number]) {
  const { points, km } = RIVERS.maeklong;
  let best = { dist: Infinity, chain: 0 };
  for (let i = 1; i < points.length; i++) {
    const [d, t] = segment(p, points[i - 1], points[i]);
    if (d < best.dist) best = { dist: d, chain: km[i - 1] + t * (km[i] - km[i - 1]) };
  }
  return best;
}

function nearLines(p: [number, number], lines: number[][][]) {
  let best = Infinity;
  for (const line of lines) for (let i = 1; i < line.length; i++) best = Math.min(best, segment(p, line[i - 1], line[i])[0]);
  return best;
}

export function nearestTambon(lat: number, lon: number): Tambon | null {
  let best: Tambon | null = null;
  let bd = Infinity;
  for (const t of TAMBONS) {
    const d = distKm([lat, lon], [t.lat, t.lon]);
    if (d < bd) { bd = d; best = t; }
  }
  return bd < 25 ? best : null;
}

// ---------- วิเคราะห์พื้นที่ ----------
export type RiskType = "riverside" | "near" | "far";
export const RISK_TYPE: Record<RiskType, { title: string; detail: string }> = {
  riverside: { title: "ริมแม่น้ำ", detail: "อยู่ห่างแม่น้ำไม่ถึง 1 กม. — เสี่ยงน้ำล้นตลิ่งเข้าพื้นที่โดยตรง และน้ำดันย้อนทางท่อระบายน้ำ" },
  near: { title: "ใกล้แม่น้ำ (เสี่ยงน้ำในคลองหนุน)", detail: "อยู่ห่างแม่น้ำ 1–5 กม. — เมื่อแม่น้ำสูง คลองระบายลงแม่น้ำไม่ทัน พื้นที่ต่ำอาจมีน้ำขัง โดยเฉพาะเมื่อมีฝนตกหนักพร้อมกัน" },
  far: { title: "ห่างแม่น้ำ", detail: "อยู่ห่างแม่น้ำเกิน 5 กม. — ความเสี่ยงหลักคือฝนตกหนักในพื้นที่และการระบายน้ำของชุมชน" },
};

export type AreaReport = {
  river: { name: string; distKm: number; type: RiskType; chainKm: number | null };
  nearest: { station: Station; distKm: number; canal: boolean }[];
  ref: Station | null; // สถานีบนแม่น้ำสายหลักที่ใช้ประเมินพื้นที่นี้
  eta: { from: Station; hours: number; at: string } | null;
  tide: boolean;
  canalNote: string | null;
  level: Level;
  reasons: string[];
};

const SPECIAL_CANAL: Record<string, string> = {
  ดำเนินสะดวก: "รับน้ำจากแม่น้ำแม่กลองผ่านคลองดำเนินสะดวก (ปตร.บางนกแขวก) — เมื่อแม่กลองสูงและมีน้ำทะเลหนุน ระดับน้ำในคลองจะสูงตาม",
  บ้านแพ้ว: "รับน้ำจากแม่น้ำแม่กลองผ่านคลองดำเนินสะดวกและคลองสาขา — ติดตามระดับแม่กลองช่วงบางคนทีประกอบกับฝนในพื้นที่",
};

const RANK: Record<Level, number> = { unknown: 0, green: 1, yellow: 2, orange: 3, red: 4 };

export function analyze(place: Place, s: Snapshot): AreaReport {
  const p: [number, number] = [place.lat, place.lon];
  const mk = onMaeklong(p);
  const others = [
    { name: "แม่น้ำแควน้อย", d: nearLines(p, RIVERS.khwaenoi) },
    { name: "แม่น้ำแควใหญ่", d: nearLines(p, RIVERS.khwaeyai) },
    { name: "แม่น้ำแม่กลอง (เหนือเขื่อนแม่กลอง)", d: nearLines(p, RIVERS.maeklong_up) },
  ];
  const up = others.reduce((a, b) => (b.d < a.d ? b : a));
  const onLower = mk.dist <= up.d;
  const riverName = onLower ? "แม่น้ำแม่กลอง" : up.name;
  const riverDist = onLower ? mk.dist : up.d;
  const type: RiskType = riverDist <= 1 ? "riverside" : riverDist <= 5 ? "near" : "far";

  const withCoords = s.stations.filter((x) => x.lat !== null && x.lon !== null);
  const nearest = withCoords
    .map((x) => ({ station: x, distKm: distKm(p, [x.lat!, x.lon!]), canal: CANAL_STATIONS.has(x.code) }))
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 3);

  // สถานีอ้างอิง: บนแม่น้ำแม่กลองสายหลัก ใกล้ตำแหน่งตามลำน้ำที่สุด (ถ้าพื้นที่อยู่ช่วงล่าง) ไม่งั้นใช้สถานีใกล้สุดที่ไม่ใช่คลอง
  let ref: Station | null = null;
  if (onLower) {
    const main = s.stations.filter((x) => KM_FROM_MAEKLONG_DAM[x.code] !== undefined && !CANAL_STATIONS.has(x.code) && !x.stale && x.diffBank !== null);
    ref = main.sort((a, b) => Math.abs(KM_FROM_MAEKLONG_DAM[a.code] - mk.chain) - Math.abs(KM_FROM_MAEKLONG_DAM[b.code] - mk.chain))[0] ?? null;
  } else {
    ref = nearest.find((n) => !n.canal && !n.station.stale && n.station.diffBank !== null)?.station ?? null;
  }

  // เวลามวลน้ำ: ใช้บ้านโป่ง (K.55A) เป็นต้นทาง ถ้าพื้นที่อยู่ท้ายบ้านโป่ง · ถ้าอยู่ระหว่างเขื่อน–บ้านโป่ง ใช้ K.11A
  let eta: AreaReport["eta"] = null;
  if (onLower && mk.dist <= 25) {
    const fromCode = mk.chain >= KM_FROM_MAEKLONG_DAM["K.55A"] ? "K.55A" : "K.11A";
    const from = s.stations.find((x) => x.code === fromCode);
    const h = travelHours(mk.chain) - travelHours(KM_FROM_MAEKLONG_DAM[fromCode]);
    if (from?.time && h > 0.5) eta = { from, hours: h, at: new Date(new Date(from.time).getTime() + h * 3600e3).toISOString() };
  }

  const tide = (onLower && mk.chain >= 95) || place.tambon?.p === "สมุทรสงคราม" || place.tambon?.a === "บ้านแพ้ว";
  const canalNote = place.tambon ? SPECIAL_CANAL[place.tambon.a] ?? null : null;

  // ระดับของพื้นที่ — ใช้สถานะแม่น้ำ ปรับตามประเภทพื้นที่
  const reasons: string[] = [];
  let level: Level = "green";
  if (ref) {
    const r = ref.level;
    if (r === "red") {
      // เกณฑ์เดียวกับภาพรวมลุ่มน้ำ: ล้นตลิ่ง = เตือนภัย · วิกฤตเฉพาะเมื่อยังเพิ่มขึ้น (กันพื้นที่ที่ล้นตามน้ำทะเลขึ้นลงทุกวัน)
      const rising = ref.trend === "เพิ่มขึ้น";
      level = type === "riverside" ? (rising ? "red" : "orange") : type === "near" ? (rising ? "orange" : "yellow") : "yellow";
      reasons.push(`${ref.name} (${ref.code}) สูงกว่าตลิ่ง ${ref.diffBank?.toFixed(2)} ม.`);
    } else if (r === "orange") {
      level = type === "riverside" ? "orange" : "yellow";
      reasons.push(`${ref.name} (${ref.code}) ต่ำกว่าตลิ่งไม่ถึง 1 ม. (${ref.diffBank?.toFixed(2)} ม.)`);
    } else if (r === "green") {
      reasons.push(`${ref.name} (${ref.code}) ระดับน้ำปกติ`);
    }
    if (ref.trend === "เพิ่มขึ้น" && RANK[level] >= RANK.yellow) reasons.push("ระดับน้ำที่สถานีอ้างอิงยังเพิ่มขึ้น");
  } else reasons.push("ไม่มีสถานีวัดน้ำที่ใช้ประเมินได้");
  if (tide) reasons.push("พื้นที่ได้รับผลน้ำทะเลหนุน — ระดับน้ำขึ้นลงตามเวลาน้ำขึ้นสูง");

  return { river: { name: riverName, distKm: riverDist, type, chainKm: onLower ? mk.chain : null }, nearest, ref, eta, tide, canalNote, level, reasons };
}

// ---------- ข้อมูลเสริมรายจุด ----------
const UA = { "User-Agent": "WaterWest/0.1 (non-commercial Mae Klong flood monitoring)" };

// ความสูงพื้นดินจากแบบจำลองความสูง (Copernicus DEM 90 ม. ผ่าน Open-Meteo) — คลาดเคลื่อนได้หลายเมตร
export async function getElevation(lat: number, lon: number): Promise<number | null> {
  try {
    const j = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`, { headers: UA, next: { revalidate: 86400 * 30 } }).then((r) => r.json());
    const v = j?.elevation?.[0];
    return typeof v === "number" ? v : null;
  } catch {
    return null;
  }
}

export async function getPointRain(lat: number, lon: number): Promise<{ date: string; mm: number | null; prob: number | null }[]> {
  try {
    const j = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,precipitation_probability_max&timezone=Asia%2FBangkok&forecast_days=7`,
      { headers: UA, next: { revalidate: 3600 } },
    ).then((r) => r.json());
    return j.daily.time.map((d: string, i: number) => ({ date: d, mm: j.daily.precipitation_sum[i], prob: j.daily.precipitation_probability_max[i] }));
  } catch {
    return [];
  }
}
