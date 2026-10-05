// ฝนวัดจริง 24 ชม. จากสถานีวัดฝน (ThaiWater rain_24h — รวมหลายหน่วยงาน: กรมอุตุฯ, กรมชลฯ, กฟผ., สสน., ปภ. ฯลฯ)
// ข้อมูลทั้งประเทศมีขนาด ~4–5 MB จึงดึงชั่วโมงละครั้ง แล้วเก็บเฉพาะสถานีในลุ่มน้ำแม่กลองลงตาราง rain_obs (แถวละสถานี)
// สถานีที่ไม่อยู่ในรายการรอบล่าสุด = ฝน 0 มม. (ThaiWater ส่งเฉพาะสถานีที่มีฝน) → ลบออกจากตาราง
// ใช้ร่วมกันระหว่าง Node และ Supabase Edge Function — ห้ามใช้ node:* ในไฟล์นี้

const URL_24H = 'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/rain_24h';
const UA = 'WaterWest/0.1 (non-commercial Mae Klong flood monitoring)';
export const FETCH_EVERY_MIN = 55;
const MAX_AGE_H = 6; // ค่าที่วัดเก่ากว่านี้ไม่ใช้

// กลุ่มพื้นที่จากรหัสลุ่มน้ำสาขาของ ThaiWater (เรียงต้นน้ำ → ปลายน้ำ)
export const RAIN_GROUPS = [
  { id: 'khwaeyai', name: 'แควใหญ่ตอนบน (อุ้มผาง–ศรีสวัสดิ์)', subs: ['1401', '1402', '1403', '1404', '1405', '1406', '1407'], upstream: true },
  { id: 'khwaenoi_up', name: 'แควน้อยตอนบน (สังขละบุรี–ทองผาภูมิ)', subs: ['1410', '1411'], upstream: true },
  { id: 'taphoen', name: 'ลำตะเพิน (ด่านช้าง–บ่อพลอย)', subs: ['1408'] },
  { id: 'khwaenoi_low', name: 'แควน้อยตอนล่าง (ทองผาภูมิ–ไทรโยค)', subs: ['1412', '1413'] },
  { id: 'lower', name: 'กาญจนบุรี–ราชบุรี–สมุทรสงคราม', subs: [] }, // ที่เหลือทั้งหมด
];
export const groupOf = (sub) => (RAIN_GROUPS.find((g) => g.subs.includes(sub)) ?? RAIN_GROUPS[RAIN_GROUPS.length - 1]).id;

export const HEAVY_MM = 35; // ฝนหนัก (เกณฑ์กรมอุตุฯ 35.1–90 มม./24 ชม.)
export const VERY_HEAVY_MM = 90; // ฝนหนักมาก

export async function fetchRainObs(now = new Date()) {
  const res = await fetch(URL_24H, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(90000) });
  if (!res.ok) throw new Error(`ThaiWater rain_24h HTTP ${res.status}`);
  const j = await res.json();
  const rows = [];
  for (const r of j.data ?? []) {
    if (!/แม่กลอง/.test(r.basin?.basin_name?.th ?? '')) continue;
    const at = new Date(`${String(r.rainfall_datetime).replace(' ', 'T')}:00+07:00`);
    if (!(r.rain_24h > 0) || (now - at) / 36e5 > MAX_AGE_H) continue;
    rows.push({
      station_id: r.station.id,
      name: r.station.tele_station_name?.th ?? '',
      amphoe: r.geocode?.amphoe_name?.th ?? '',
      province: r.geocode?.province_name?.th ?? '',
      agency: r.agency?.agency_shortname?.th?.trim() ?? '',
      sub_basin: r.station.sub_basin_id ?? '',
      grp: groupOf(r.station.sub_basin_id ?? ''),
      lat: r.station.tele_station_lat,
      lon: r.station.tele_station_long,
      mm_24h: r.rain_24h,
      measured_at: at.toISOString(),
      checked_at: now.toISOString(),
    });
  }
  return rows;
}

// สรุปรายกลุ่ม: ฝนสูงสุด (สถานี/อำเภอ/เวลา), จำนวนสถานีที่มีฝน, จำนวนสถานีฝนหนัก
export function summarizeRainObs(rows) {
  return RAIN_GROUPS.map((g) => {
    const a = rows.filter((r) => r.grp === g.id).sort((x, y) => y.mm_24h - x.mm_24h);
    return {
      id: g.id, name: g.name, upstream: !!g.upstream,
      stations: a.length,
      heavy: a.filter((r) => r.mm_24h >= HEAVY_MM).length,
      max: a[0] ? { mm: Number(a[0].mm_24h), name: a[0].name, amphoe: a[0].amphoe, at: a[0].measured_at } : null,
    };
  });
}

// แถวพิเศษ station_id = 0 บันทึกเวลาที่ตรวจล่าสุด (แยก "ไม่มีฝนเลย" ออกจาก "ยังไม่เคยตรวจ")
export const MARKER_ID = 0;
const marker = (now) => ({
  station_id: MARKER_ID, name: 'checked', amphoe: '', province: '', agency: '', sub_basin: '', grp: 'meta',
  lat: null, lon: null, mm_24h: 0, measured_at: now.toISOString(), checked_at: now.toISOString(),
});

// เรียกทุกรอบจาก Edge Function: ดึงใหม่เมื่อครบ FETCH_EVERY_MIN นาที ไม่งั้นอ่านจากตาราง → คืนสรุปรายกลุ่ม
export async function syncRainObs(db, now = new Date()) {
  const cur = await fetch(`${db.url}/rest/v1/rain_obs?select=*`, { headers: db.headers }).then((r) => {
    if (!r.ok) throw new Error(`อ่าน rain_obs ไม่สำเร็จ: HTTP ${r.status}`);
    return r.json();
  });
  const m = cur.find((r) => r.station_id === MARKER_ID);
  const stations = cur.filter((r) => r.station_id !== MARKER_ID);
  if (m && (now - new Date(m.checked_at)) / 60000 < FETCH_EVERY_MIN) {
    return { fetched: false, groups: summarizeRainObs(stations), checked_at: m.checked_at };
  }

  const rows = [marker(now), ...(await fetchRainObs(now))];
  const up = await fetch(`${db.url}/rest/v1/rain_obs?on_conflict=station_id`, {
    method: 'POST',
    headers: { ...db.headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!up.ok) throw new Error(`บันทึก rain_obs ไม่สำเร็จ: HTTP ${up.status} ${await up.text()}`);
  // สถานีที่ไม่อยู่ในรอบนี้ = ไม่มีฝนแล้ว
  const del = await fetch(`${db.url}/rest/v1/rain_obs?checked_at=lt.${encodeURIComponent(now.toISOString())}`, { method: 'DELETE', headers: db.headers });
  if (!del.ok) throw new Error(`ลบ rain_obs เก่าไม่สำเร็จ: HTTP ${del.status}`);
  return { fetched: true, groups: summarizeRainObs(rows.slice(1)), checked_at: now.toISOString() };
}
