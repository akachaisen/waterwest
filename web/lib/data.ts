import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { classify, damDerived, STALE_MIN, trendOf } from "./status";
import type { Alert, RainPoint, Snapshot, Station } from "./types";

// แหล่งข้อมูลของเว็บ:
//  - ตั้งค่า SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY → อ่านจากฐานข้อมูล (ใช้บนเว็บจริง)
//  - ไม่ตั้งค่า → อ่านไฟล์ ../data/latest.json ที่ได้จาก `npm run snapshot` (ใช้ทดสอบในเครื่อง)

type RawStation = {
  code: string; name: string; seg: string; is_key: boolean; lat?: number | null; lon?: number | null; source: string | null; time: string | null;
  wl: number | null; diff_bank: number | null; q: number | null; capacity: number | null; trend: string | null;
  sign?: number | null; change1h?: number | null;
};

const num = (v: unknown): number | null => (v === null || v === undefined || v === "" ? null : Number(v));

function toStation(r: RawStation, now: number): Station {
  const ageMin = r.time ? (now - new Date(r.time).getTime()) / 60000 : null;
  const q = num(r.q);
  const capacity = num(r.capacity);
  const diffBank = num(r.diff_bank);
  return {
    code: r.code,
    name: r.name,
    seg: r.seg,
    isKey: r.is_key,
    lat: num(r.lat),
    lon: num(r.lon),
    source: r.source,
    time: r.time,
    ageMin,
    stale: ageMin !== null && ageMin > STALE_MIN,
    wl: num(r.wl),
    diffBank,
    q,
    capacity,
    qPct: q && capacity ? Math.round((q / capacity) * 100) : null,
    // สถานีที่แหล่งข้อมูลไม่บอกแนวโน้ม (เช่น ปภ.) ใช้การเปลี่ยนจากราว 1 ชม.ก่อนแทน
    trend: r.trend ?? trendOf(r.change1h ?? null),
    sign: num(r.sign),
    change1h: r.change1h ?? null,
    ...classify(diffBank),
  };
}

export async function getSnapshot(): Promise<Snapshot> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  try {
    return url && key ? await fromSupabase(url.replace(/\/$/, ""), key) : await fromFile();
  } catch (e) {
    // ไม่มีข้อมูล/ฐานข้อมูลไม่ตอบ — แสดงหน้าว่างแทนการล้มทั้งเว็บ
    console.error("getSnapshot:", e);
    return emptySnapshot();
  }
}

function emptySnapshot(): Snapshot {
  return { origin: "file", generatedAt: new Date(0).toISOString(), stations: [], dams: [], maeklongQ: null, alerts: [], rain: [], seaPeak: null, sources: {} };
}

async function fromFile(): Promise<Snapshot> {
  const file = process.env.SNAPSHOT_FILE ?? path.join(process.cwd(), "..", "data", "latest.json");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s: any = JSON.parse(await readFile(/*turbopackIgnore: true*/ file, "utf8"));
  const now = Date.now();
  return {
    origin: "file",
    generatedAt: s.generated_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stations: s.stations.filter((x: any) => !x.missing).map((x: any) =>
      toStation({ code: x.code, name: x.name, seg: x.seg, is_key: !!x.key, lat: x.lat, lon: x.lon, source: x.source, time: x.time, wl: x.wl_msl, diff_bank: x.diff_bank, q: x.q, capacity: x.capacity, trend: x.trend, sign: x.ddpm_sign }, now),
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dams: s.dams.filter((d: any) => !d.missing).map((d: any) =>
      damDerived({ id: d.id, name: d.name, date: d.date, volume: d.volume, normal_storage: d.normal_storage, pct: d.pct, inflow_mcm: d.inflow_mcm_day, outflow_mcm: d.outflow_mcm_day }),
    ),
    maeklongQ: s.maeklong_release_proxy ? { q: s.maeklong_release_proxy.q, time: s.maeklong_release_proxy.time } : null,
    alerts: s.alerts as Alert[],
    rain: (s.rain ?? []) as RainPoint[],
    seaPeak: s.sea?.peak ?? null,
    sources: s.sources,
  };
}

async function fromSupabase(url: string, key: string): Promise<Snapshot> {
  const get = async <T,>(q: string): Promise<T> => {
    const res = await fetch(`${url}/rest/v1/${q}`, { headers: { apikey: key }, next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Supabase ${q}: HTTP ${res.status}`);
    return res.json() as Promise<T>;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Any = any;
  const since = new Date(Date.now() - 5 * 3600e3).toISOString();
  const [latest, runs, dams, rain, sea, coords, recent] = await Promise.all([
    get<Any[]>("latest_readings?select=*"),
    get<Any[]>("ingest_runs?select=*&order=started_at.desc&limit=1"),
    get<Any[]>("dam_daily?select=*&order=date.desc&limit=6"),
    get<Any[]>("rain_forecast?select=*&order=issued_on.desc,forecast_date.asc&limit=60"),
    get<Any[]>(`sea_level?select=*&at=gte.${new Date(Date.now() - 3600e3).toISOString()}&order=at.asc&limit=24`),
    get<Any[]>("stations?select=code,lat,lon"),
    // ค่าย้อนหลัง 5 ชม. ไว้เทียบกับราว 1 ชม.ก่อน
    get<Any[]>(`readings?select=station_code,source,measured_at,diff_bank&measured_at=gte.${since}&diff_bank=not.is.null&order=measured_at.asc&limit=3000`).catch(() => []),
  ]);
  const hist = new Map<string, { t: number; v: number }[]>();
  for (const r of recent) {
    const k = `${r.station_code}|${r.source}`; // เทียบเฉพาะแหล่งเดียวกัน (แต่ละแหล่งอาจอ้างตลิ่งต่างกันเล็กน้อย)
    const a = hist.get(k) ?? [];
    a.push({ t: new Date(r.measured_at).getTime(), v: Number(r.diff_bank) });
    hist.set(k, a);
  }
  const ll = new Map(coords.map((c) => [c.code, c]));
  const now = Date.now();
  const run = runs[0];

  const seenDam = new Set<string>();
  const damRows = dams.filter((d) => (seenDam.has(d.dam_id) ? false : (seenDam.add(d.dam_id), true)));

  const issued = rain[0]?.issued_on;
  const names: Record<string, string> = { vrk: "เหนืออ่างวชิราลงกรณ", snr: "เหนืออ่างศรีนครินทร์", rbr: "ตัวเมืองราชบุรี / เจดีย์หัก" };
  const rainPoints: RainPoint[] = Object.keys(names).map((id) => ({
    id,
    name: names[id],
    days: rain.filter((r) => r.issued_on === issued && r.point_id === id).map((r) => ({ date: r.forecast_date, mm: num(r.mm), prob: num(r.prob) })),
  }));
  const peak = sea.reduce<Any>((a, b) => (!a || Number(b.m) > Number(a.m) ? b : a), null);

  return {
    origin: "supabase",
    generatedAt: run?.started_at ?? new Date().toISOString(),
    stations: latest.map((r) =>
      toStation({ code: r.station_code, name: r.name, seg: r.seg, is_key: r.is_key, lat: ll.get(r.station_code)?.lat, lon: ll.get(r.station_code)?.lon, source: r.source, time: r.measured_at, wl: r.wl, diff_bank: r.diff_bank, q: r.q, capacity: r.capacity, trend: r.trend, sign: r.sign, change1h: change1h(hist.get(`${r.station_code}|${r.source}`), r.measured_at, r.diff_bank) }, now),
    ),
    dams: damRows.map((d) =>
      damDerived({ id: d.dam_id, name: d.name, date: d.date, volume: Number(d.volume), normal_storage: Number(d.normal_storage), pct: Number(d.pct), inflow_mcm: Number(d.inflow_mcm), outflow_mcm: Number(d.outflow_mcm) }),
    ),
    maeklongQ: run?.maeklong_q ? { q: Number(run.maeklong_q), time: latest.find((r) => r.station_code === "K.55A")?.measured_at ?? null } : null,
    alerts: (run?.alerts ?? []) as Alert[],
    rain: rainPoints,
    seaPeak: peak ? { m: Number(peak.m), time: peak.at } : null,
    sources: run?.sources ?? {},
  };
}

// ระดับเปลี่ยนจากค่าที่ใกล้ "1 ชม.ก่อนเวลาวัดล่าสุด" ที่สุด (ยอมคลาด ±25 นาที) · ไม่มีค่าให้เทียบ = null
function change1h(rows: { t: number; v: number }[] | undefined, time: string | null, diff: unknown): number | null {
  const v = num(diff);
  if (!rows?.length || !time || v === null) return null;
  const target = new Date(time).getTime() - 3600e3;
  let best: { t: number; v: number } | null = null;
  for (const r of rows) if (!best || Math.abs(r.t - target) < Math.abs(best.t - target)) best = r;
  return best && Math.abs(best.t - target) <= 25 * 60e3 ? Math.round((v - best.v) * 1000) / 1000 : null;
}
