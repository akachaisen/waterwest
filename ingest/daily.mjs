// สรุปสถานการณ์รายวัน: broadcast ทาง LINE ทุกเช้า 06:00 น. (รอบดึงข้อมูลแรกหลัง 06:00 — ปกติ 06:02 น.)
// ส่งวันละครั้ง (บันทึกในตาราง daily_summary) · ถ้าส่งไม่สำเร็จจะลองรอบถัดไปจนถึง 09:00 น.
// ข้ามเมื่อโควตาข้อความใกล้หมด เพื่อเก็บไว้ส่งแจ้งเตือนภัยจริง · ปิดได้ด้วย secret DAILY_SUMMARY=off
// ใช้ร่วมกันระหว่าง Node และ Supabase Edge Function — ห้ามใช้ node:* ในไฟล์นี้

import { sendLine } from './alerts.mjs';
import { thaiMonth } from './quota.mjs';

export const SEND_FROM_H = 6;
export const SEND_UNTIL_H = 9;
const RESERVE_ALERTS = 3; // เหลือโควตาไว้ส่งแจ้งเตือนภัยอย่างน้อยกี่ครั้ง

const LEVEL = { red: '🔴 วิกฤต', orange: '🟠 เตือนภัย', yellow: '🟡 เฝ้าระวัง' };
const RANK = { yellow: 1, orange: 2, red: 3 };
const KEY_STATIONS = [
  ['K.37', 'แควน้อย บ้านวังเย็น'],
  ['K.35A', 'แควใหญ่ บ้านหนองบัว'],
  ['K.55A', 'บ้านโป่ง'],
  ['RAJ001', 'โพธาราม'],
  ['K.2B', 'ตัวเมืองราชบุรี'],
  ['K.57', 'บางคนที'],
];

// ลำน้ำสาขา: แสดงจุดที่น้ำสูงสุดเทียบตลิ่งของแต่ละสาย (บรรทัดเดียว)
const TRIBUTARIES = [
  ['ลำภาชี', ['K.25A', 'K.64', 'K.61', 'K.62', 'KRI04']],
  ['ลำตะเพิน', ['K.49', 'KRI09', 'K.12']],
];

const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const thai = (d) => new Date(d.getTime() + 7 * 3600e3); // ใช้ getUTC* อ่านเป็นเวลาไทย
export const thaiDate = (d) => thai(d).toISOString().slice(0, 10);
const hm = (iso, now) => {
  if (!iso) return '-';
  const d = new Date(iso);
  const t = d.toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' });
  return thaiDate(d) === thaiDate(now) ? `${t} น.` : `${d.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short' })} ${t} น.`;
};
const bankText = (d) => (d > 0 ? `สูงกว่าตลิ่ง ${fmt(d, 2)} ม.` : `ต่ำกว่าตลิ่ง ${fmt(-d, 2)} ม.`);
const arrow = (trend) => (trend === 'เพิ่มขึ้น' ? ' ↑' : trend === 'ลดลง' ? ' ↓' : trend === 'ทรงตัว' || trend === 'คงที่' ? ' →' : '');

// ข้อความสรุป — ทุกหัวข้อระบุเวลาของข้อมูล
export function formatDaily(snapshot, active, webUrl, now = new Date(snapshot.generated_at)) {
  const day = now.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const worst = active.reduce((w, a) => (RANK[a.level] > (RANK[w] ?? 0) ? a.level : w), null);
  const watch = active.filter((a) => RANK[a.level] >= RANK.orange).length;
  const L = [`🌅 WaterWest · สรุปเช้า ${day}`, `ภาพรวมลุ่มน้ำแม่กลอง: ${worst ? `${LEVEL[worst]}${watch ? ` (${watch} จุด)` : ''}` : '🟢 ปกติ'}`];

  const by = Object.fromEntries(snapshot.stations.map((s) => [s.code, s]));
  L.push('', '💧 ระดับน้ำ (เวลาที่วัด)');
  for (const [code, name] of KEY_STATIONS) {
    const s = by[code];
    if (!s || s.missing) { L.push(`• ${name}: ไม่มีข้อมูล`); continue; }
    const bank = s.diff_bank == null ? '' : bankText(s.diff_bank);
    const q = s.q ? ` · ${fmt(s.q)} ลบ.ม./วิ` : '';
    L.push(`• ${name}: ${bank || 'ไม่มีค่าเทียบตลิ่ง'}${q}${arrow(s.trend)} (${hm(s.time, now)}${s.stale ? ' ⚠️ข้อมูลเก่า' : ''})`);
  }

  const tribs = TRIBUTARIES.map(([river, codes]) => {
    const live = codes.map((c) => by[c]).filter((s) => s && !s.missing && !s.stale && s.diff_bank != null);
    return [river, live.reduce((w, s) => (!w || s.diff_bank > w.diff_bank ? s : w), null), live.length];
  });
  if (tribs.some(([, s]) => s)) {
    L.push('', '〰️ ลำน้ำสาขา (จุดน้ำสูงสุดเทียบตลิ่ง)');
    for (const [river, s, n] of tribs) {
      if (!s) { L.push(`• ${river}: ไม่มีข้อมูล`); continue; }
      const place = s.name.replace(/\s*\((ต้น)?(ลำภาชี|ลำตะเพิน)\)|\s*(ลำภาชี|ลำตะเพิน)\s*/g, ' ').trim();
      L.push(`• ${river}: ${bankText(s.diff_bank)}${arrow(s.trend)} ที่${place} (${hm(s.time, now)} · ${n} สถานี)`);
    }
  }

  const dams = (snapshot.dams ?? []).filter((d) => !d.missing);
  if (dams.length) {
    const dDate = dams[0].date ? new Date(`${dams[0].date}T00:00:00+07:00`).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short' }) : '-';
    L.push('', `🏞 เขื่อน (ข้อมูลวันที่ ${dDate})`);
    for (const d of dams) L.push(`• ${d.name.replace('เขื่อน', '')} ${fmt(d.pct, 1)}% · เข้า ${fmt(d.inflow_cms)} / ระบาย ${fmt(d.outflow_cms)} ลบ.ม./วิ`);
  }

  const obs = (snapshot.rain_obs ?? []).filter((g) => g.max);
  if (snapshot.rain_obs) {
    L.push('', `🌧 ฝนวัดได้จริง 24 ชม. (สถานีวัดฝน ณ ${hm(snapshot.rain_obs_at, now)})`);
    if (!obs.length) L.push('• ไม่มีสถานีในลุ่มน้ำแม่กลองวัดฝนได้');
    for (const g of obs) L.push(`• ${g.name}: สูงสุด ${fmt(g.max.mm, 1)} มม. (อ.${g.max.amphoe})${g.heavy ? ` · ฝนหนัก ${g.heavy} สถานี` : ''}`);
  }

  const rain = (snapshot.rain ?? []).filter((p) => p.days?.length);
  if (rain.length) {
    L.push('', `🌦 ฝนคาดการณ์ 3 วัน (Open-Meteo ณ ${hm(snapshot.generated_at, now)})`);
    for (const p of rain) L.push(`• ${p.name}: ${fmt(p.days.slice(1, 4).reduce((a, b) => a + (b.mm ?? 0), 0))} มม.`);
  }

  const tide = snapshot.tide;
  const bank = (d) => (d >= 0 ? `สูงกว่าตลิ่ง ${fmt(d, 2)} ม.` : `ต่ำกว่าตลิ่ง ${fmt(-d, 2)} ม.`);
  if (tide?.highs?.length) {
    L.push('', `🌊 น้ำทะเลหนุน ${tide.station.name} (คาดจากค่าวัดจริง ±0.2 ม.)`);
    for (const h of tide.highs.slice(0, 2)) L.push(`• ${hm(h.time, now)} ${bank(h.diff)}`);
  } else {
    const sea = snapshot.sea?.next24h ?? [];
    const highs = sea.filter((r, i) => i > 0 && i < sea.length - 1 && r.m >= sea[i - 1].m && r.m > sea[i + 1].m);
    if (highs.length) L.push('', `🌊 น้ำทะเลขึ้นสูงที่ปากแม่กลอง (แบบจำลอง): ${highs.slice(0, 2).map((r) => `${hm(r.time, now)} ${fmt(r.m, 2)} ม.`).join(', ')}`);
  }

  const top = [...active].filter((a) => RANK[a.level] >= RANK.orange).sort((a, b) => RANK[b.level] - RANK[a.level]).slice(0, 3);
  if (top.length) {
    L.push('', '⚠️ จุดที่ต้องระวัง');
    for (const a of top) L.push(`• ${LEVEL[a.level]}: ${a.text}`);
  }

  if (webUrl) L.push('', `ดูรายละเอียด: ${webUrl}`);
  L.push('ข้อมูลประกอบการติดตาม ไม่ใช่ประกาศทางการ · ฉุกเฉินโทร 1784');
  L.push(`อัปเดต ${hm(snapshot.generated_at, now)} · Hoysang Naja`);
  return L.join('\n').slice(0, 4900);
}

async function rest(db, path, init) {
  const res = await fetch(`${db.url}/rest/v1/${path}`, { ...init, headers: { ...db.headers, ...(init?.headers ?? {}) } });
  if (!res.ok) throw new Error(`${path.split('?')[0]} HTTP ${res.status} ${await res.text()}`);
  return init?.method === 'POST' ? null : res.json();
}

// เรียกทุกรอบจาก Edge Function — ทำงานจริงเฉพาะช่วง 06:00–09:00 น. และยังไม่ได้ส่งของวันนี้
export async function maybeSendDaily(db, snapshot, active, { token, webUrl, enabled = true }) {
  const now = new Date(snapshot.generated_at);
  const h = thai(now).getUTCHours();
  if (!enabled) return { status: 'ปิดอยู่ (DAILY_SUMMARY=off)' };
  if (h < SEND_FROM_H || h >= SEND_UNTIL_H) return { status: 'ไม่ใช่ช่วงเวลาส่ง' };
  const date = thaiDate(now);
  const done = await rest(db, `daily_summary?select=status&date=eq.${date}`);
  if (done.length) return { status: `วันนี้${done[0].status === 'sent' ? 'ส่งแล้ว' : 'ข้ามแล้ว'}` };
  if (!token) return { status: 'ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN' };

  const save = (row) => rest(db, 'daily_summary?on_conflict=date', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ date, ...row }),
  });

  // กันโควตา: ข้ามถ้าเตือนโควตาแล้ว (≥80%) หรือส่งแล้วจะเหลือไม่พอแจ้งเตือนภัยอีก RESERVE_ALERTS ครั้ง
  const [q] = await rest(db, `line_quota?select=*&month=eq.${thaiMonth(now)}`);
  if (q?.quota != null) {
    const per = Math.max(1, q.reach ?? 1);
    if (q.warned >= 80 || q.quota - q.used - per < per * RESERVE_ALERTS) {
      const note = `โควตาเหลือ ${q.quota - q.used} ข้อความ (ผู้รับ ${per} คน) — เก็บไว้ส่งแจ้งเตือนภัย`;
      await save({ status: 'skipped', note });
      return { status: 'ข้าม', note };
    }
  }

  const text = formatDaily(snapshot, active, webUrl, now);
  await sendLine(token, text); // ถ้าส่งไม่สำเร็จจะ throw → ไม่บันทึก → ลองใหม่รอบถัดไป
  await save({ status: 'sent', sent_at: now.toISOString(), text });
  return { status: 'ส่งแล้ว' };
}
