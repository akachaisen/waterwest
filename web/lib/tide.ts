import { getStationHistory } from "./history";
import { TOWN_TIDE_LAG_H, upcomingHighs, type SeaSeries } from "./forecast";

// น้ำทะเลหนุนจากสถานีวัดจริง: ปรับแบบจำลองให้ตรงกับ MKG006 (สะพานพระรามสอง สมุทรสงคราม) — วิธีเดียวกับ ingest/tide.mjs
// ระดับเทียบตลิ่ง(t) ≈ a × แบบจำลอง(t − lag) + b จาก 72 ชม. ล่าสุด · ทดสอบย้อนหลัง 90 วัน: ยอดน้ำขึ้นคลาด ±0.07 ม. (90% ≤ ±0.18 ม.)

export const TIDE_STATION = { code: "MKG006", name: "สะพานพระรามสอง สมุทรสงคราม" };
export const TYPICAL_ERR_M = 0.2;
const FIT_HOURS = 72;
const MIN_POINTS = 36;
const H = 3600e3;

export type StationTide = {
  lag: number;
  rmse: number;
  n: number;
  observed: [number, number | null][];
  predicted: [number, number | null][];
  highs: { time: string; diff: number }[];
};

export async function getStationTide(sea: SeaSeries | null): Promise<StationTide | null> {
  if (!sea) return null;
  const hist = await getStationHistory(TIDE_STATION.code, 3).catch(() => null);
  if (!hist?.diff.length) return null;
  const hour = (ms: number) => Math.floor(ms / H);
  const model = new Map(sea.points.filter((p): p is [number, number] => p[1] !== null).map(([t, v]) => [hour(t), v]));
  const obs = new Map(hist.diff.filter((p) => p.v !== null).map((p) => [hour(p.t), p.v as number]));
  const now = hour(Date.now());
  const hours = [...obs.keys()].filter((h) => h > now - FIT_HOURS && h <= now);

  let best: { lag: number; a: number; b: number; rmse: number; n: number } | null = null;
  for (let lag = 0; lag <= 3; lag++) {
    let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const h of hours) {
      const x = model.get(h - lag), y = obs.get(h);
      if (x === undefined || y === undefined) continue;
      n++; sx += x; sy += y; sxx += x * x; sxy += x * y;
    }
    if (n < MIN_POINTS || sxx - (sx * sx) / n <= 0) continue;
    const a = (sxy - (sx * sy) / n) / (sxx - (sx * sx) / n);
    const b = (sy - a * sx) / n;
    let se = 0;
    for (const h of hours) {
      const x = model.get(h - lag), y = obs.get(h);
      if (x !== undefined && y !== undefined) se += (a * x + b - y) ** 2;
    }
    const rmse = Math.sqrt(se / n);
    if (!best || rmse < best.rmse) best = { lag, a, b, rmse, n };
  }
  if (!best || best.a < 0.3) return null;

  const fit = best;
  const predicted: [number, number | null][] = [];
  for (let h = now - 24; h <= now + 48; h++) {
    const x = model.get(h - fit.lag);
    if (x !== undefined) predicted.push([h * H, +(fit.a * x + fit.b).toFixed(3)]);
  }
  const highs: StationTide["highs"] = [];
  for (let i = 1; i < predicted.length - 1; i++) {
    const [t, v] = predicted[i];
    const [, a] = predicted[i - 1];
    const [, c] = predicted[i + 1];
    if (v !== null && a !== null && c !== null && t >= now * H && v >= a && v > c) highs.push({ time: new Date(t).toISOString(), diff: v });
  }
  const observed = [...obs].filter(([h]) => h > now - 48).sort((x, y) => x[0] - y[0]).map(([h, v]) => [h * H, v] as [number, number]);
  return { lag: fit.lag, rmse: +fit.rmse.toFixed(2), n: fit.n, observed, predicted, highs: highs.slice(0, 4) };
}

// น้ำขึ้นสูงครั้งถัดไปที่ตัวเมืองสมุทรสงคราม: ใช้ค่าที่ปรับจากสถานีจริงก่อน ถ้าไม่มีใช้แบบจำลองเลื่อนเวลา TOWN_TIDE_LAG_H
export type TownHigh = { time: string; diff: number | null };
export async function townHighs(sea: SeaSeries | null, n = 3): Promise<{ highs: TownHigh[]; fromStation: boolean }> {
  const st = await getStationTide(sea);
  if (st?.highs.length) return { highs: st.highs.slice(0, n), fromStation: true };
  return {
    highs: upcomingHighs(sea, n).map((t) => ({ time: new Date(new Date(t.time).getTime() + TOWN_TIDE_LAG_H * H).toISOString(), diff: null })),
    fromStation: false,
  };
}
