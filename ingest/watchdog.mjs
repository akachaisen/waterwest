// ตัวเฝ้าจากภายนอก (GitHub Actions): ถ้า Supabase หยุดทั้งระบบ (เช่น โปรเจกต์ถูกพัก / Cron ไม่ทำงาน)
// Edge Function จะแจ้งตัวเองไม่ได้ — สคริปต์นี้ตรวจว่ารอบล่าสุดเก่าเกิน 1 ชม. แล้ว push LINE ถึงผู้ดูแล
// ต้องตั้ง Secrets ใน GitHub: SUPABASE_URL, SUPABASE_SECRET_KEY, LINE_CHANNEL_ACCESS_TOKEN, LINE_ADMIN_USER_ID

import { dbConfig } from './store.mjs';
import { GAP_MIN, pushLine } from './health.mjs';

const db = dbConfig();
const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const adminId = process.env.LINE_ADMIN_USER_ID;
if (!db || !token || !adminId) {
  console.log('ข้าม: ยังตั้ง Secrets ไม่ครบ (SUPABASE_URL, SUPABASE_SECRET_KEY, LINE_CHANNEL_ACCESS_TOKEN, LINE_ADMIN_USER_ID)');
  process.exit(0);
}

let ageMin = Infinity;
let problem = '';
try {
  const res = await fetch(`${db.url}/rest/v1/ingest_runs?select=started_at&order=started_at.desc&limit=1`, { headers: db.headers, signal: AbortSignal.timeout(20000) });
  if (!res.ok) problem = `เรียกฐานข้อมูลไม่ได้ (HTTP ${res.status}) — โปรเจกต์ Supabase อาจถูกพัก`;
  else {
    const [last] = await res.json();
    if (last) ageMin = (Date.now() - new Date(last.started_at)) / 60000;
  }
} catch (e) {
  problem = `เชื่อมต่อฐานข้อมูลไม่ได้ (${e.message}) — โปรเจกต์ Supabase อาจถูกพัก`;
}

if (!problem && ageMin > GAP_MIN) problem = `ไม่มีข้อมูลใหม่มา ${ageMin >= 120 ? (ageMin / 60).toFixed(1) + ' ชม.' : Math.round(ageMin) + ' นาที'} — Supabase Cron หรือ Edge Function อาจหยุดทำงาน`;
if (!problem) {
  console.log(`ปกติ: รอบล่าสุดเมื่อ ${Math.round(ageMin)} นาทีก่อน`);
  process.exit(0);
}
// หยุดนานเกิน 1 วันแล้ว เตือนวันละครั้ง (ช่วง 08:00 น.) ไม่ให้ส่งถี่
if (ageMin > 24 * 60 && new Date().getUTCHours() !== 1) {
  console.log(`ยังผิดปกติ (${problem}) — เตือนวันละครั้งตอน 08:00 น.`);
  process.exit(0);
}
const t = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
await pushLine(token, adminId, `🛠 WaterWest · แจ้งผู้ดูแลระบบ\n${t} น.\n\n⚠️ ${problem}\n\nตรวจสอบ: https://supabase.com/dashboard/project/jvwxhxrtckfvflzrrsxe`);
console.log(`แจ้งแล้ว: ${problem}`);
