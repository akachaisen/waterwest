// โควตาข้อความ LINE: อ่านโควตา/ยอดใช้/จำนวนผู้รับจาก LINE API → บันทึกตาราง line_quota (1 แถวต่อเดือน)
// → แจ้งผู้ดูแลคนเดียวเมื่อใช้ถึง 80% / 95% / เหลือไม่พอส่งแจ้งเตือนอีก 1 ครั้ง (แจ้งแต่ละระดับครั้งเดียวต่อเดือน)
// การส่ง broadcast 1 ครั้ง ใช้โควตาเท่ากับจำนวนเพื่อนที่ส่งถึงได้ · การอ่านข้อมูลเหล่านี้ไม่ใช้โควตา
// ใช้ร่วมกันระหว่าง Node และ Supabase Edge Function — ห้ามใช้ node:* ในไฟล์นี้

import { pushLine } from './health.mjs';

const API = 'https://api.line.me/v2/bot';

async function lineGet(token, path) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`LINE ${path} HTTP ${res.status}`);
  return res.json();
}

// วันที่ตามเวลาญี่ปุ่น (LINE Insight ใช้ JST) รูปแบบ YYYYMMDD
const jstDate = (d) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
// เดือนตามเวลาไทย YYYY-MM
export const thaiMonth = (d) => new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 7);

export async function fetchQuota(token, now = new Date()) {
  const [quota, usage] = await Promise.all([lineGet(token, '/message/quota'), lineGet(token, '/message/quota/consumption')]);
  // จำนวนผู้รับ broadcast: ข้อมูลของ "เมื่อวาน" (ของวันนี้ยังไม่พร้อม) — ถ้ายังไม่พร้อมให้เป็น null แล้วใช้ค่าเดิม
  let reach = null;
  let followers = null;
  try {
    const f = await lineGet(token, `/insight/followers?date=${jstDate(new Date(now.getTime() - 86400e3))}`);
    if (f.status === 'ready') {
      followers = f.followers ?? null;
      reach = f.targetedReaches ?? (f.followers != null ? f.followers - (f.blocks ?? 0) : null);
    }
  } catch {
    // ไม่มีข้อมูลเพื่อน ไม่เป็นไร
  }
  return { limit: quota.type === 'limited' ? quota.value : null, used: usage.totalUsage, reach, followers };
}

// ระดับเตือน: 0 ปกติ · 80 ใช้ ≥80% · 95 ใช้ ≥95% หรือเหลือส่งได้ไม่ถึง 2 ครั้ง · 100 เหลือไม่พอส่งอีก 1 ครั้ง
export function quotaLevel({ limit, used, reach }) {
  if (limit == null) return 0;
  const left = limit - used;
  const per = Math.max(1, reach ?? 1);
  if (left < per) return 100;
  if (used / limit >= 0.95 || left < 2 * per) return 95;
  if (used / limit >= 0.8) return 80;
  return 0;
}

export function formatQuota(q, level) {
  const per = Math.max(1, q.reach ?? 1);
  const left = q.limit - q.used;
  const head = { 80: '🟡 ใช้โควตาไปแล้ว 80%', 95: '🟠 โควตาใกล้หมด', 100: '🔴 โควตาไม่พอส่งแจ้งเตือนครั้งถัดไป' }[level];
  return [
    '📊 WaterWest · โควตาข้อความ LINE',
    head,
    '',
    `เดือนนี้ใช้ไป ${q.used.toLocaleString('en-US')} / ${q.limit.toLocaleString('en-US')} ข้อความ (${Math.round((q.used / q.limit) * 100)}%)`,
    `ผู้รับ ${q.reach ?? '?'} คน → แจ้งเตือน 1 ครั้งใช้ ~${per} ข้อความ`,
    `ส่งแจ้งเตือนได้อีกประมาณ ${Math.max(0, Math.floor(left / per))} ครั้ง`,
    '',
    level >= 95
      ? 'ถ้าเป็นช่วงน้ำมา พิจารณาเปลี่ยนแพ็กเกจใน LINE OA Manager → Settings → Monthly plan (โควตารีเซ็ตต้นเดือน)'
      : 'โควตารีเซ็ตต้นเดือน',
  ].join('\n');
}

// เรียกทุกรอบจาก Edge Function: บันทึกตัวเลข + แจ้งผู้ดูแลเมื่อถึงระดับใหม่ของเดือนนี้
export async function syncQuota(db, token, adminId, now = new Date()) {
  const month = thaiMonth(now);
  const q = await fetchQuota(token, now);
  const prev = await fetch(`${db.url}/rest/v1/line_quota?select=*&month=eq.${month}`, { headers: db.headers }).then((r) => {
    if (!r.ok) throw new Error(`อ่าน line_quota ไม่สำเร็จ: HTTP ${r.status}`);
    return r.json();
  });
  const old = prev[0];
  const row = {
    month,
    quota: q.limit,
    used: q.used,
    reach: q.reach ?? old?.reach ?? null,
    followers: q.followers ?? old?.followers ?? null,
    warned: old?.warned ?? 0,
    checked_at: now.toISOString(),
  };
  const level = quotaLevel({ limit: row.quota, used: row.used, reach: row.reach });
  let sent = false;
  if (level > row.warned && adminId) {
    await pushLine(token, adminId, formatQuota({ limit: row.quota, used: row.used, reach: row.reach }, level));
    row.warned = level;
    sent = true;
  }
  const res = await fetch(`${db.url}/rest/v1/line_quota?on_conflict=month`, {
    method: 'POST',
    headers: { ...db.headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`บันทึก line_quota ไม่สำเร็จ: HTTP ${res.status} ${await res.text()}`);
  return { used: row.used, limit: row.quota, reach: row.reach, level, sent };
}
