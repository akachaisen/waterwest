// ขั้นที่ 4: เติมข้อมูลย้อนหลังลงฐานข้อมูล (รันครั้งเดียว หรือรันซ้ำได้ — upsert ไม่ซ้ำ)
//  - ระดับน้ำ/ปริมาณ ย้อนหลังจาก ThaiWater (เฉพาะสถานีที่ ThaiWater มี)
//  - เขื่อนรายวัน ย้อนหลังจาก API อ่างเก็บน้ำ กรมชลฯ
// รัน: node ingest/backfill.mjs [จำนวนวันสถานี=7] [จำนวนวันเขื่อน=30]   (ต้องตั้ง SUPABASE_URL / SUPABASE_SECRET_KEY)
//      เพิ่ม --dry-run เพื่อดึงข้อมูลโดยไม่บันทึก

import { STATIONS, DAMS } from './stations.mjs';
import { dbConfig, upsert } from './store.mjs';

const UA = 'WaterWest/0.1 (non-commercial Mae Klong flood monitoring)';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const DRY = process.argv.includes('--dry-run');
const days = (v, def, max) => {
  const n = Number.parseInt(v ?? def, 10);
  if (!Number.isFinite(n) || n < 1 || n > max) throw new Error(`จำนวนวันไม่ถูกต้อง: ${v} (1–${max})`);
  return n;
};
const STATION_DAYS = days(args[0], 7, 31);
const DAM_DAYS = days(args[1], 30, 365);

const getJson = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(90000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
};
const ymd = (d) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

async function stationHistory() {
  // หา id ของสถานีใน ThaiWater จากรหัสเดิม (K.37, RAJ001, MKVKD06 ...)
  const load = await getJson('https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load');
  const ids = new Map(load.waterlevel_data.data.map((r) => [r.station.tele_station_oldcode, r.station.id]));
  const end = new Date();
  const start = new Date(end.getTime() - STATION_DAYS * 86400e3);
  const rows = [];
  const missing = [];
  for (const st of STATIONS) {
    // บางสถานีมีใน ThaiWater เฉพาะรหัส กฟผ. (เช่น K.54 = MKVKD03)
    const id = ids.get(st.code) ?? (st.egat ? ids.get(`MK${st.egat}`) : undefined);
    if (!id) { missing.push(st.code); continue; }
    const j = await getJson(
      `https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_graph?station_type=tele_waterlevel&station_id=${id}&start_date=${ymd(start)}&end_date=${ymd(end)}`,
    );
    const bank = num(j.data.min_bank);
    let n = 0;
    for (const p of j.data.graph_data) {
      const wl = num(p.value);
      if (wl === null) continue;
      const diff = bank ? +(wl - bank).toFixed(3) : null;
      rows.push({
        station_code: st.code,
        source: 'ThaiWater',
        measured_at: `${p.datetime.replace(' ', 'T')}:00+07:00`,
        wl,
        bank,
        diff_bank: diff !== null && Math.abs(diff) < 30 ? diff : null,
        pct_bank: null,
        q: num(p.discharge),
        trend: null,
        qc: 'backfill',
      });
      n++;
    }
    console.log(`  ${st.code.padEnd(8)} ThaiWater id ${id}: ${n} ค่า`);
  }
  if (missing.length) console.log(`  ไม่มีใน ThaiWater (จะสะสมจากการดึงปกติ): ${missing.join(', ')}`);
  return rows;
}

async function damHistory() {
  const rows = [];
  for (let i = 1; i <= DAM_DAYS; i++) {
    const date = ymd(new Date(Date.now() - i * 86400e3));
    try {
      const j = await getJson(`https://app.rid.go.th/reservoir/api/dam/public/${date}`);
      for (const reg of j.data)
        for (const d of reg.dam) {
          if (!DAMS.some((x) => x.id === d.id)) continue;
          rows.push({
            dam_id: d.id, name: d.name, date: j.date, volume: d.volume, normal_storage: d.storage,
            pct: d.percent_storage, inflow_mcm: d.inflow, outflow_mcm: d.outflow, updated_at: new Date().toISOString(),
          });
        }
    } catch (e) {
      console.log(`  เขื่อน ${date}: ${e.message}`);
    }
  }
  console.log(`  เขื่อน: ${rows.length} แถว (${DAM_DAYS} วัน × ${DAMS.length} เขื่อน)`);
  return rows;
}

async function main() {
  const db = dbConfig();
  if (!db && !DRY) throw new Error('ต้องตั้งค่า SUPABASE_URL / SUPABASE_SECRET_KEY (หรือใช้ --dry-run)');
  console.log(`ย้อนหลัง: สถานี ${STATION_DAYS} วัน, เขื่อน ${DAM_DAYS} วัน${DRY ? ' (dry-run)' : ''}`);
  const readings = await stationHistory();
  const dams = await damHistory();
  if (DRY) { console.log(`dry-run: readings ${readings.length}, dam_daily ${dams.length}`); return; }
  // สถานีต้องมีในตาราง stations ก่อน (foreign key) — การดึงปกติสร้างไว้แล้ว
  console.log(`บันทึก readings ${await upsert(db, 'readings', readings)} แถว, dam_daily ${await upsert(db, 'dam_daily', dams)} แถว`);
}

main().catch((e) => { console.error('backfill ล้มเหลว:', e.message); process.exit(1); });
