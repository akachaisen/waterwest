import "server-only";

// ข้อมูลย้อนหลังสำหรับกราฟ
//  - มี Supabase: อ่าน view readings_hourly / ตาราง dam_daily
//  - ไม่มี (ทดสอบในเครื่อง): ดึงสดจาก ThaiWater (สถานี) และ API อ่างเก็บน้ำ กรมชลฯ (เขื่อน)

export type Point = { t: number; v: number | null };
export type StationHistory = { diff: Point[]; q: Point[]; origin: "supabase" | "thaiwater" | "none" };
export type DamDay = { date: string; pct: number; inflowCms: number; outflowCms: number; volume: number };

const UA = { "User-Agent": "WaterWest/0.1 (non-commercial Mae Klong flood monitoring)" };
const num = (v: unknown): number | null => (v === null || v === undefined || v === "" ? null : Number(v));
const cms = (mcmPerDay: number) => Math.round((mcmPerDay * 1e6) / 86400);
const ymd = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

function supabase() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return async <T,>(q: string): Promise<T> => {
    const res = await fetch(`${url}/rest/v1/${q}`, { headers: { apikey: key }, next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Supabase ${q}: HTTP ${res.status}`);
    return res.json() as Promise<T>;
  };
}

// รวมเป็นค่าเฉลี่ยรายชั่วโมง
function hourly(points: { t: number; diff: number | null; q: number | null }[]): { diff: Point[]; q: Point[] } {
  const buckets = new Map<number, { d: number[]; q: number[] }>();
  for (const p of points) {
    const h = Math.floor(p.t / 3600e3) * 3600e3;
    const b = buckets.get(h) ?? { d: [], q: [] };
    if (p.diff !== null) b.d.push(p.diff);
    if (p.q !== null) b.q.push(p.q);
    buckets.set(h, b);
  }
  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const hours = [...buckets.keys()].sort((a, b) => a - b);
  return {
    diff: hours.map((t) => ({ t, v: avg(buckets.get(t)!.d) })),
    q: hours.map((t) => ({ t, v: avg(buckets.get(t)!.q) })),
  };
}

export async function getStationHistory(code: string, days = 7): Promise<StationHistory> {
  const since = new Date(Date.now() - days * 86400e3).toISOString();
  const db = supabase();
  if (db) {
    type Row = { hour: string; diff_bank: number | null; q: number | null };
    const rows = await db<Row[]>(
      `readings_hourly?select=hour,diff_bank,q&station_code=eq.${encodeURIComponent(code)}&hour=gte.${since}&order=hour.asc&limit=2000`,
    );
    return {
      origin: "supabase",
      diff: rows.map((r) => ({ t: new Date(r.hour).getTime(), v: num(r.diff_bank) })),
      q: rows.map((r) => ({ t: new Date(r.hour).getTime(), v: num(r.q) })),
    };
  }
  return thaiwaterHistory(code, days);
}

// รหัสสถานีที่ ThaiWater ใช้ต่างจากของเรา
const TW_ALIAS: Record<string, string> = { "K.54": "MKVKD03" };

async function thaiwaterHistory(code: string, days: number): Promise<StationHistory> {
  const load = await fetch("https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load", {
    headers: UA,
    next: { revalidate: 3600 },
  }).then((r) => r.json());
  type TwRow = { station: { id: number; tele_station_oldcode: string } };
  const want = TW_ALIAS[code] ?? code;
  const st = (load.waterlevel_data.data as TwRow[]).find((r) => r.station.tele_station_oldcode === want)?.station;
  if (!st) return { diff: [], q: [], origin: "none" };
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400e3);
  const j = await fetch(
    `https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_graph?station_type=tele_waterlevel&station_id=${st.id}&start_date=${ymd(start)}&end_date=${ymd(end)}`,
    { headers: UA, next: { revalidate: 900 } },
  ).then((r) => r.json());
  const bank = num(j.data.min_bank);
  type G = { datetime: string; value: number | null; discharge: number | null };
  const pts = (j.data.graph_data as G[])
    .map((p) => {
      const wl = num(p.value);
      return { t: new Date(`${p.datetime.replace(" ", "T")}:00+07:00`).getTime(), diff: wl !== null && bank ? wl - bank : null, q: num(p.discharge) };
    })
    .filter((p) => p.t >= start.getTime() && (p.diff !== null || p.q !== null));
  return { ...hourly(pts), origin: "thaiwater" };
}

export async function getDamHistory(id: string, days = 30): Promise<DamDay[]> {
  const db = supabase();
  if (db) {
    type Row = { date: string; pct: number; inflow_mcm: number; outflow_mcm: number; volume: number };
    const since = ymd(new Date(Date.now() - days * 86400e3));
    const rows = await db<Row[]>(`dam_daily?select=date,pct,inflow_mcm,outflow_mcm,volume&dam_id=eq.${id}&date=gte.${since}&order=date.asc`);
    return rows.map((r) => ({ date: r.date, pct: Number(r.pct), inflowCms: cms(Number(r.inflow_mcm)), outflowCms: cms(Number(r.outflow_mcm)), volume: Number(r.volume) }));
  }
  // ทดสอบในเครื่อง: ดึงรายวันจากกรมชลฯ (cache 12 ชม.)
  const dates = Array.from({ length: days }, (_, i) => ymd(new Date(Date.now() - (days - 1 - i) * 86400e3)));
  const out: DamDay[] = [];
  await Promise.all(
    dates.map(async (date) => {
      try {
        const j = await fetch(`https://app.rid.go.th/reservoir/api/dam/public/${date}`, { headers: UA, next: { revalidate: 43200 } }).then((r) => r.json());
        type D = { id: string; percent_storage: number; inflow: number; outflow: number; volume: number };
        const d = (j.data as { dam: D[] }[]).flatMap((r) => r.dam).find((x) => x.id === id);
        if (d) out.push({ date: j.date, pct: d.percent_storage, inflowCms: cms(d.inflow), outflowCms: cms(d.outflow), volume: d.volume });
      } catch {
        // วันที่ดึงไม่ได้ข้ามไป
      }
    }),
  );
  const seen = new Set<string>();
  return out.sort((a, b) => a.date.localeCompare(b.date)).filter((d) => (seen.has(d.date) ? false : (seen.add(d.date), true)));
}

// ค่าสรุปจากชุดข้อมูล
export function summarize(points: Point[]) {
  const vals = points.filter((p): p is { t: number; v: number } => p.v !== null);
  if (!vals.length) return null;
  const last = vals[vals.length - 1];
  const max = vals.reduce((a, b) => (b.v > a.v ? b : a));
  const dayAgo = vals.find((p) => p.t >= last.t - 24 * 3600e3);
  return { last, max, change24h: dayAgo ? last.v - dayAgo.v : null };
}
