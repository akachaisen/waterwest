import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { classify, damDerived, STALE_MIN } from "./status";
import type { Alert, RainPoint, Snapshot, Station } from "./types";

// แหล่งข้อมูลของเว็บ:
//  - ตั้งค่า SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY → อ่านจากฐานข้อมูล (ใช้บนเว็บจริง)
//  - ไม่ตั้งค่า → อ่านไฟล์ ../data/latest.json ที่ได้จาก `npm run snapshot` (ใช้ทดสอบในเครื่อง)

type RawStation = {
  code: string; name: string; seg: string; is_key: boolean; lat?: number | null; lon?: number | null; source: string | null; time: string | null;
  wl: number | null; diff_bank: number | null; q: number | null; capacity: number | null; trend: string | null;
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
    trend: r.trend,
    ...classify(diffBank),
  };
}

export async function getSnapshot(): Promise<Snapshot> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  return url && key ? fromSupabase(url.replace(/\/$/, ""), key) : fromFile();
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
      toStation({ code: x.code, name: x.name, seg: x.seg, is_key: !!x.key, lat: x.lat, lon: x.lon, source: x.source, time: x.time, wl: x.wl_msl, diff_bank: x.diff_bank, q: x.q, capacity: x.capacity, trend: x.trend }, now),
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
  const [latest, runs, dams, rain, sea, coords] = await Promise.all([
    get<Any[]>("latest_readings?select=*"),
    get<Any[]>("ingest_runs?select=*&order=started_at.desc&limit=1"),
    get<Any[]>("dam_daily?select=*&order=date.desc&limit=6"),
    get<Any[]>("rain_forecast?select=*&order=issued_on.desc,forecast_date.asc&limit=60"),
    get<Any[]>(`sea_level?select=*&at=gte.${new Date(Date.now() - 3600e3).toISOString()}&order=at.asc&limit=24`),
    get<Any[]>("stations?select=code,lat,lon"),
  ]);
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
      toStation({ code: r.station_code, name: r.name, seg: r.seg, is_key: r.is_key, lat: ll.get(r.station_code)?.lat, lon: ll.get(r.station_code)?.lon, source: r.source, time: r.measured_at, wl: r.wl, diff_bank: r.diff_bank, q: r.q, capacity: r.capacity, trend: r.trend }, now),
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
