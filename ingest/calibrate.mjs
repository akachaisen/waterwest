// ปรับเวลาเดินทางของมวลน้ำ: ดึงระดับน้ำย้อนหลังจาก ThaiWater → หายอดน้ำที่ K.11A (ท้ายเขื่อนแม่กลอง)
// → วัดว่ายอดน้ำไปถึงสถานีท้ายน้ำกี่ชั่วโมง → สรุปค่ากลาง (median) และช่วงที่พบบ่อย
// รัน: node ingest/calibrate.mjs [จำนวนวัน=90]   (ไม่ต้องใช้คีย์ — ThaiWater เป็นข้อมูลสาธารณะ)
// ผลใช้ปรับ TRAVEL_ANCHORS ใน web/lib/route.ts (K.2B ราชบุรีไม่มีใน ThaiWater — ใช้ตัวเลขทางการไปก่อน)

const UA = 'WaterWest/0.1 (non-commercial Mae Klong flood monitoring)';
const DAYS = Number(process.argv[2] ?? 90);
const BASE = 'K.11A';
const TARGETS = [['K.55A', 47], ['RAJ002', 45.3], ['RAJ001', 70.9]];
const PROMINENCE_M = 0.4; // ยอดน้ำต้องสูงกว่าจุดต่ำสุดรอบ ๆ ±36 ชม. อย่างน้อยเท่านี้
const WINDOW_H = 48; // หายอดน้ำท้ายน้ำภายในกี่ชั่วโมง

const get = async (u) => {
  const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(120000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${u}`);
  return r.json();
};
const ymd = (d) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
const hourOf = (s) => Math.floor(new Date(`${s.replace(' ', 'T')}:00+07:00`).getTime() / 36e5);

const load = await get('https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load');
const ids = new Map(load.waterlevel_data.data.map((r) => [r.station.tele_station_oldcode, r.station.id]));
const end = new Date();
const start = new Date(end.getTime() - DAYS * 86400e3);

// ค่าเฉลี่ยรายชั่วโมงของแต่ละสถานี
const series = {};
for (const code of [BASE, ...TARGETS.map((t) => t[0])]) {
  const j = await get(`https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_graph?station_type=tele_waterlevel&station_id=${ids.get(code)}&start_date=${ymd(start)}&end_date=${ymd(end)}`);
  const sum = new Map();
  for (const p of j.data.graph_data) {
    if (p.value === null || p.value === '') continue;
    const h = hourOf(p.datetime);
    const [s, n] = sum.get(h) ?? [0, 0];
    sum.set(h, [s + Number(p.value), n + 1]);
  }
  series[code] = new Map([...sum].map(([h, [s, n]]) => [h, s / n]));
}
// ค่าเฉลี่ยเคลื่อนที่ ±2 ชม. ลดสัญญาณรบกวน
const smooth = (code, h) => {
  let s = 0, n = 0;
  for (let k = h - 2; k <= h + 2; k++) { const v = series[code].get(k); if (v != null) { s += v; n++; } }
  return n ? s / n : null;
};

const peaks = [];
for (const h of [...series[BASE].keys()].sort((a, b) => a - b)) {
  const v = smooth(BASE, h);
  if (v == null || peaks.some((p) => Math.abs(p - h) < 36)) continue;
  let isMax = true, low = Infinity;
  for (let k = h - 36; k <= h + 36; k++) {
    const u = smooth(BASE, k);
    if (u == null) continue;
    if (u > v + 1e-9) { isMax = false; break; }
    low = Math.min(low, u);
  }
  if (isMax && v - low > PROMINENCE_M) peaks.push(h);
}

const lags = Object.fromEntries(TARGETS.map(([c]) => [c, []]));
const when = (h) => new Date(h * 36e5).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
console.log(`ยอดน้ำที่ ${BASE} ${peaks.length} ครั้ง ใน ${DAYS} วัน`);
for (const p of peaks) {
  const row = [`${when(p)} ${smooth(BASE, p).toFixed(2)} ม.`];
  for (const [c] of TARGETS) {
    let best = null, at = null;
    for (let k = p; k <= p + WINDOW_H; k++) { const v = smooth(c, k); if (v != null && (best == null || v > best)) { best = v; at = k; } }
    if (at != null) lags[c].push(at - p);
    row.push(`${c} +${at != null ? at - p : '?'} ชม.`);
  }
  console.log('  ' + row.join(' · '));
}
const q = (a, f) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(f * (s.length - 1) + 0.5))]; };
console.log('\nสรุป (ชม. หลังยอดน้ำผ่าน K.11A ซึ่งอยู่ห่างเขื่อนแม่กลอง ~4 กม.):');
for (const [c, km] of TARGETS) {
  const a = lags[c];
  if (a.length) console.log(`  ${c} (${km} กม.): ค่ากลาง ${q(a, 0.5)} · ช่วงที่พบบ่อย ${q(a, 0.25)}–${q(a, 0.75)} · ทั้งหมด ${Math.min(...a)}–${Math.max(...a)} (${a.length} ครั้ง)`);
}
