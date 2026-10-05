// น้ำทะเลหนุนจากสถานีวัดจริง: ปรับแบบจำลอง Open-Meteo ให้ตรงกับสถานี MKG006 (สะพานพระรามสอง สมุทรสงคราม ~5 กม. จากปากแม่น้ำ)
// ทุกรอบ: หาความสัมพันธ์ ระดับเทียบตลิ่ง(t) ≈ a × แบบจำลอง(t − lag) + b จาก 72 ชม. ล่าสุด แล้วใช้คาดน้ำขึ้นสูงครั้งถัดไปที่สถานีจริง
// ทดสอบย้อนหลัง 90 วัน (5 ต.ค. 2569): lag ~1 ชม., ยอดน้ำขึ้นรายวันคลาดเคลื่อนปกติ ±0.07 ม. (90% ไม่เกิน ±0.18 ม.), เวลา ±1 ชม.
// ใช้ร่วมกันระหว่าง Node และ Supabase Edge Function — ห้ามใช้ node:* ในไฟล์นี้

export const TIDE_STATION = { code: 'MKG006', name: 'สะพานพระรามสอง สมุทรสงคราม' };
export const FIT_HOURS = 72;
export const TYPICAL_ERR_M = 0.2; // ใช้แสดง ± (ค่า p90 จากการทดสอบย้อนหลัง)
const MIN_POINTS = 36;
const UA = 'WaterWest/0.1 (non-commercial Mae Klong flood monitoring)';
const MODEL_URL = 'https://marine-api.open-meteo.com/v1/marine?latitude=13.36&longitude=100.0&hourly=sea_level_height_msl&timezone=GMT&past_days=3&forecast_days=2';

const hourOf = (ms) => Math.floor(ms / 36e5);

// model, obs: Map<ชั่วโมง(epoch/3600), ค่า> → ผลปรับที่ดีที่สุด (lag 0–3 ชม.) หรือ null ถ้าข้อมูลไม่พอ
export function fitTide(model, obs, nowMs = Date.now()) {
  const now = hourOf(nowMs);
  const hours = [...obs.keys()].filter((h) => h > now - FIT_HOURS && h <= now);
  let best = null;
  for (let lag = 0; lag <= 3; lag++) {
    let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const h of hours) {
      const x = model.get(h - lag), y = obs.get(h);
      if (x == null || y == null) continue;
      n++; sx += x; sy += y; sxx += x * x; sxy += x * y;
    }
    if (n < MIN_POINTS || sxx - (sx * sx) / n <= 0) continue;
    const a = (sxy - (sx * sy) / n) / (sxx - (sx * sx) / n);
    const b = (sy - a * sx) / n;
    let se = 0;
    for (const h of hours) {
      const x = model.get(h - lag), y = obs.get(h);
      if (x != null && y != null) se += (a * x + b - y) ** 2;
    }
    const rmse = Math.sqrt(se / n);
    if (!best || rmse < best.rmse) best = { lag, a, b, rmse, n };
  }
  if (!best || best.a < 0.3) return null; // ความสัมพันธ์ผิดปกติ (เช่น เซนเซอร์เสีย) — ไม่ใช้
  // คาดการณ์ 48 ชม. ข้างหน้าที่สถานีจริง + หาน้ำขึ้นสูง
  const pred = [];
  for (let h = now - 24; h <= now + 48; h++) {
    const x = model.get(h - best.lag);
    if (x != null) pred.push([h, +(best.a * x + best.b).toFixed(3)]);
  }
  const highs = [];
  for (let i = 1; i < pred.length - 1; i++) {
    const [h, v] = pred[i];
    if (h >= now && v >= pred[i - 1][1] && v > pred[i + 1][1]) highs.push({ time: new Date(h * 36e5).toISOString(), diff: v });
  }
  return { ...best, rmse: +best.rmse.toFixed(3), pred: pred.map(([h, v]) => [h * 36e5, v]), highs };
}

export async function fetchModel() {
  const res = await fetch(MODEL_URL, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Open-Meteo marine HTTP ${res.status}`);
  const j = await res.json();
  return new Map(j.hourly.time.map((t, i) => [hourOf(new Date(`${t}:00Z`).getTime()), j.hourly.sea_level_height_msl[i]]).filter(([, v]) => v != null));
}

// ค่าเทียบตลิ่งรายชั่วโมงของ MKG006 จากตาราง readings
export async function fetchObs(db, nowMs = Date.now()) {
  const since = new Date(nowMs - (FIT_HOURS + 2) * 36e5).toISOString();
  const res = await fetch(`${db.url}/rest/v1/readings?select=measured_at,diff_bank&station_code=eq.${TIDE_STATION.code}&measured_at=gte.${since}&diff_bank=not.is.null&order=measured_at.asc&limit=2000`, { headers: db.headers });
  if (!res.ok) throw new Error(`อ่าน readings ${TIDE_STATION.code} ไม่สำเร็จ: HTTP ${res.status}`);
  const sum = new Map();
  for (const r of await res.json()) {
    const h = hourOf(new Date(r.measured_at).getTime());
    const [s, n] = sum.get(h) ?? [0, 0];
    sum.set(h, [s + Number(r.diff_bank), n + 1]);
  }
  return new Map([...sum].map(([h, [s, n]]) => [h, s / n]));
}

// สรุปสำหรับ snapshot (เก็บเฉพาะที่ใช้: น้ำขึ้นสูง 4 ครั้งถัดไป)
export async function tideFromStation(db, nowMs = Date.now()) {
  const [model, obs] = await Promise.all([fetchModel(), fetchObs(db, nowMs)]);
  const f = fitTide(model, obs, nowMs);
  if (!f) return null;
  return { station: TIDE_STATION, lag_h: f.lag, rmse: f.rmse, n: f.n, highs: f.highs.slice(0, 4), fitted_at: new Date(nowMs).toISOString() };
}
