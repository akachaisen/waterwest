// รวบรวมข้อมูลทุกแหล่ง → สถานะเส้นทางน้ำแม่กลอง
// ใช้ร่วมกันระหว่าง Node (snapshot.mjs) และ Supabase Edge Function — ห้ามใช้ node:* ในไฟล์นี้

import { STATIONS, SEGMENTS, DAMS, RAIN_POINTS, SEA_POINT, CCTV } from './stations.mjs';
import { fetchThaiWater, fetchSwoc, fetchEgat, fetchRidDams, fetchRain, fetchSeaLevel, checkCctv } from './sources.mjs';

const STALE_HOURS = 3;

const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
const fmt = (n, d = 0) => (n === null || n === undefined ? '-' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d }));
const ageHours = (iso) => (iso ? (Date.now() - new Date(iso).getTime()) / 3600e3 : null);

function classify(diff) {
  if (diff === null) return { level: 'unknown', label: 'ไม่มีข้อมูลตลิ่ง' };
  if (diff > 0) return { level: 'red', label: 'ล้นตลิ่ง' };
  if (diff > -1) return { level: 'orange', label: 'ใกล้ตลิ่ง' };
  return { level: 'green', label: 'ปกติ' };
}

export async function collect() {
  const started = new Date();
  const jobs = {
    thaiwater: fetchThaiWater(),
    swoc: fetchSwoc(),
    egat: fetchEgat(),
    ridDams: fetchRidDams(DAMS),
    rain: fetchRain(RAIN_POINTS),
    sea: fetchSeaLevel(SEA_POINT),
    cctv: checkCctv(CCTV),
  };
  const keys = Object.keys(jobs);
  const settled = await Promise.allSettled(Object.values(jobs));
  const src = {};
  const sourceStatus = {};
  settled.forEach((r, i) => {
    src[keys[i]] = r.status === 'fulfilled' ? r.value : null;
    sourceStatus[keys[i]] = r.status === 'fulfilled' ? 'ok' : `error: ${r.reason?.message ?? r.reason}`;
  });

  // --- สถานีวัดน้ำ ---
  const stations = STATIONS.map((st) => {
    const primary = st.src === 'swoc' ? src.swoc : src.thaiwater;
    const fallback = st.src === 'swoc' ? src.thaiwater : src.swoc;
    let rec = primary?.get(st.code) ?? fallback?.get(st.code) ?? null;
    const egat = st.egat ? src.egat?.get(st.egat) : null;
    if (!rec && egat) rec = { source: 'EGAT', time: egat.time, wl_msl: egat.wl_msl, q: egat.q, diff_bank: null };
    if (!rec) return { ...st, missing: true, status: { level: 'unknown', label: 'ไม่พบข้อมูล' } };

    // ตรวจคุณภาพข้อมูล: ตัดค่าที่เป็นไปไม่ได้ และบันทึกเหตุผลไว้ใน qc
    const qc = [];
    let diff = rec.diff_bank;
    if (diff !== null && Math.abs(diff) >= 30) { qc.push(`ตัดค่าเทียบตลิ่ง ${diff} (ไม่มีระดับตลิ่งที่ถูกต้อง)`); diff = null; }
    let q = rec.q;
    if (q !== null && (q < 0 || q > 20000)) { qc.push(`ตัดค่าปริมาณ ${q}`); q = null; }
    if (q === 0 && egat?.q > 10) { qc.push(`ปริมาณ 0 ขัดกับ กฟผ. (${egat.q}) → ใช้ค่า กฟผ.`); q = egat.q; }
    else if (q === 0 && egat && !egat.q) { qc.push('ปริมาณ 0 แต่ กฟผ. ไม่มีค่า → ถือว่าไม่มีข้อมูล'); q = null; }
    else if (q !== null && egat?.q && Math.abs(q - egat.q) / egat.q > 0.2) qc.push(`ปริมาณต่างจาก กฟผ. เกิน 20% (${q} vs ${egat.q})`);
    const age = ageHours(rec.time);
    if (age !== null && age < -1) qc.push('เวลาวัดอยู่ในอนาคต');
    const capacity = egat?.capacity ?? rec.q_max ?? null;
    const capacitySource = egat?.capacity ? 'กฟผ.' : rec.q_max ? 'ชป./สสน.' : null;
    return {
      ...st,
      source: rec.source,
      river: rec.river,
      province: rec.province,
      lat: rec.lat, lon: rec.lon,
      time: rec.time,
      age_h: age !== null ? +age.toFixed(1) : null,
      stale: age !== null && age > STALE_HOURS,
      wl_msl: rec.wl_msl,
      bank_msl: rec.bank_msl,
      diff_bank: diff,
      pct_bank: rec.pct_bank,
      trend: rec.trend,
      q,
      capacity,
      capacity_source: capacitySource,
      q_pct: q && capacity ? +((q / capacity) * 100).toFixed(0) : null,
      egat_q: egat?.q ?? null,
      qc,
      status: classify(diff),
    };
  });

  // --- เขื่อน ---
  const dams = DAMS.map((d) => {
    const r = src.ridDams?.get(d.id);
    if (!r) return { ...d, missing: true };
    const free = r.storage - r.volume; // ที่ว่างถึงระดับเก็บกักปกติ (ล้าน ลบ.ม.)
    const net = r.inflow - r.outflow; // สุทธิ ล้าน ลบ.ม./วัน
    return {
      ...d,
      date: r.date,
      volume: r.volume,
      normal_storage: r.storage,
      pct: r.percent_storage,
      inflow_mcm_day: r.inflow,
      outflow_mcm_day: r.outflow,
      inflow_cms: +((r.inflow * 1e6) / 86400).toFixed(0),
      outflow_cms: +((r.outflow * 1e6) / 86400).toFixed(0),
      free_mcm: +free.toFixed(1),
      net_mcm_day: +net.toFixed(2),
      days_to_full: net > 0 ? +(free / net).toFixed(1) : null,
    };
  });
  const maeklongDam = src.egat?.get('SND04') ?? null;

  // --- เตือนภัย (กฎต้นแบบ) ---
  const alerts = [];
  const byCode = Object.fromEntries(stations.map((s) => [s.code, s]));
  const k37 = byCode['K.37'];
  if (k37?.q && k37.capacity && k37.q > k37.capacity)
    alerts.push({ level: 'red', text: `K.37 แควน้อย ${fmt(k37.q)} เกินความจุลำน้ำ ${fmt(k37.capacity)} ลบ.ม./วิ` });
  const k55 = byCode['K.55A'];
  if (k55?.q > 3000) alerts.push({ level: 'red', text: `K.55A บ้านโป่ง ${fmt(k55.q)} ลบ.ม./วิ เกิน 3,000` });
  else if (k55?.q > 2500) alerts.push({ level: 'orange', text: `K.55A บ้านโป่ง ${fmt(k55.q)} ลบ.ม./วิ เกิน 2,500` });
  for (const s of stations.filter((s) => s.status.level === 'red'))
    alerts.push({ level: s.key ? 'red' : 'orange', text: `${s.code} ${s.name} สูงกว่าตลิ่ง ${fmt(s.diff_bank, 2)} ม.` });
  for (const d of dams.filter((d) => !d.missing)) {
    if (d.pct >= 98 && d.net_mcm_day > 0)
      alerts.push({ level: 'orange', text: `${d.name} ${fmt(d.pct, 1)}% น้ำเข้ามากกว่าระบาย อีกราว ${fmt(d.days_to_full, 1)} วันจะถึงระดับเก็บกัก → อาจต้องระบายเพิ่ม` });
  }
  for (const p of src.rain ?? []) {
    if (p.id === 'rbr') continue;
    const next3 = p.days.slice(1, 4).reduce((a, b) => a + (b.mm ?? 0), 0);
    if (next3 >= 50) alerts.push({ level: 'orange', text: `ฝนคาดการณ์ ${p.name} 3 วันรวม ${fmt(next3, 0)} มม.` });
  }
  for (const s of stations.filter((s) => s.stale))
    alerts.push({ level: 'info', text: `${s.code} ข้อมูลเก่า ${fmt(s.age_h, 1)} ชม. (ไม่ใช้ประเมิน)` });

  const snapshot = {
    generated_at: started.toISOString(),
    sources: sourceStatus,
    segments: SEGMENTS,
    stations,
    dams,
    maeklong_dam: maeklongDam,
    maeklong_release_proxy: k55?.q ? { station: 'K.55A', q: k55.q, time: k55.time, note: 'ใช้ปริมาณน้ำที่ K.55A แทนการระบายเขื่อนแม่กลอง (ไม่มี API ทางการ)' } : null,
    rain: src.rain,
    sea: src.sea,
    cctv: src.cctv,
    alerts,
  };
  return snapshot;
}

export function renderMarkdown(s) {
  const icon = { red: '🔴', orange: '🟠', green: '🟢', unknown: '⚪', info: 'ℹ️' };
  const L = [];
  L.push(`# WaterWest — สถานะเส้นทางน้ำแม่กลอง`);
  L.push(`ดึงข้อมูลเมื่อ ${fmtTime(s.generated_at)} น. · ข้อมูลแต่ละสถานีระบุเวลาวัดของตัวเอง\n`);

  L.push(`## แหล่งข้อมูล`);
  for (const [k, v] of Object.entries(s.sources)) L.push(`- ${k}: ${v === 'ok' ? '✅' : '❌ ' + v}`);

  L.push(`\n## สัญญาณเตือน (${s.alerts.length})`);
  if (!s.alerts.length) L.push('- ไม่มี');
  for (const a of s.alerts) L.push(`- ${icon[a.level] ?? ''} ${a.text}`);

  L.push(`\n## เขื่อน`);
  L.push(`| เขื่อน | % | ปริมาตร (ล้าน ลบ.ม.) | ไหลเข้า | ระบาย | ที่ว่าง (ล้าน ลบ.ม.) | ถึงระดับเก็บกักใน | ข้อมูลวันที่ |`);
  L.push(`|---|---|---|---|---|---|---|---|`);
  for (const d of s.dams) {
    if (d.missing) { L.push(`| ${d.name} | ไม่พบข้อมูล |||||||`); continue; }
    L.push(`| ${d.name} | ${fmt(d.pct, 1)} | ${fmt(d.volume)} / ${fmt(d.normal_storage)} | ${fmt(d.inflow_mcm_day, 2)} ล้าน/วัน (≈${fmt(d.inflow_cms)} ลบ.ม./วิ) | ${fmt(d.outflow_mcm_day, 2)} ล้าน/วัน (≈${fmt(d.outflow_cms)} ลบ.ม./วิ) | ${fmt(d.free_mcm)} | ${d.days_to_full ? fmt(d.days_to_full, 1) + ' วัน' : 'ไม่เพิ่ม'} | ${d.date} |`);
  }
  if (s.maeklong_dam) L.push(`\nเขื่อนแม่กลอง (กฟผ. SND04): ระดับ ${fmt(s.maeklong_dam.wl_msl, 2)} ม.รทก. ณ ${fmtTime(s.maeklong_dam.time)}`);
  if (s.maeklong_release_proxy) L.push(`ปริมาณน้ำท้ายเขื่อนแม่กลอง (แทนด้วย K.55A บ้านโป่ง): **${fmt(s.maeklong_release_proxy.q)} ลบ.ม./วิ** ณ ${fmtTime(s.maeklong_release_proxy.time)}`);

  for (const seg of s.segments) {
    const rows = s.stations.filter((x) => x.seg === seg.id);
    if (!rows.length) continue;
    L.push(`\n## ${seg.id}. ${seg.name}`);
    L.push(`| | สถานี | ระดับน้ำ (ม.)* | เทียบตลิ่ง (ม.) | แนวโน้ม | ปริมาณ (ลบ.ม./วิ) | ความจุลำน้ำ | เวลาวัด | แหล่ง |`);
    L.push(`|---|---|---|---|---|---|---|---|---|`);
    for (const x of rows) {
      if (x.missing) { L.push(`| ⚪ | ${x.code} ${x.name} | ไม่พบข้อมูล ||||||| |`); continue; }
      const diff = x.diff_bank === null ? '-' : (x.diff_bank > 0 ? '+' : '') + fmt(x.diff_bank, 2);
      const cap = x.capacity ? `${fmt(x.capacity)}${x.q_pct ? ` (${x.q_pct}%)` : ''}` : '-';
      L.push(`| ${icon[x.status.level]} | ${x.key ? '**' : ''}${x.code} ${x.name}${x.key ? '**' : ''} | ${fmt(x.wl_msl, 2)} | ${diff} ${x.status.label} | ${x.trend ?? '-'} | ${fmt(x.q)} | ${cap} | ${fmtTime(x.time)}${x.stale ? ' ⚠️เก่า' : ''} | ${x.source} |`);
    }
  }
  L.push(`\n\\* ระดับน้ำ: ส่วนใหญ่เป็น ม.รทก. แต่บางสถานีของ ชป. ใช้ระดับอ้างอิงของสถานีเอง ให้ดูช่อง "เทียบตลิ่ง" เป็นหลัก`);

  L.push(`\n## ฝน (Open-Meteo, มม.)`);
  if (s.rain) {
    const dates = s.rain[0].days.map((d) => d.date.slice(5));
    L.push(`| จุด | ${dates.join(' | ')} |`);
    L.push(`|---|${dates.map(() => '---').join('|')}|`);
    for (const p of s.rain) L.push(`| ${p.name} | ${p.days.map((d) => `${fmt(d.mm, 1)} (${d.prob ?? '-'}%)`).join(' | ')} |`);
    L.push(`คอลัมน์แรก = เมื่อวาน (ค่าจริงโดยประมาณ) ที่เหลือ = พยากรณ์ · (%) = โอกาสฝนสูงสุด`);
  } else L.push('- ดึงไม่ได้');

  L.push(`\n## น้ำทะเล ${SEA_POINT.name} (แบบจำลอง Open-Meteo ไม่ใช่ตารางน้ำทางการ)`);
  if (s.sea?.peak) L.push(`- สูงสุดใน 24 ชม.: ${fmt(s.sea.peak.m, 2)} ม. (เทียบ MSL ของแบบจำลอง) เวลา ${fmtTime(s.sea.peak.time)}`);
  else L.push('- ดึงไม่ได้');

  const qcRows = s.stations.filter((x) => x.qc?.length);
  if (qcRows.length) {
    L.push(`\n## ตรวจคุณภาพข้อมูล`);
    for (const x of qcRows) L.push(`- ${x.code}: ${x.qc.join('; ')}`);
  }

  L.push(`\n## CCTV`);
  for (const c of s.cctv ?? []) L.push(`- ${c.ok ? '✅' : '❌'} ${c.name} — ${c.ok ? `${c.contentType}, ${fmt(c.bytes / 1024)} KB` : c.error}`);

  L.push(`\n---\nข้อมูล: กรมชลประทาน (SWOC, อ่างเก็บน้ำ) · คลังข้อมูลน้ำแห่งชาติ สสน. · กฟผ. · Open-Meteo — ใช้ประกอบการติดตาม ไม่ใช่ประกาศทางการ`);
  return L.join('\n');
}
