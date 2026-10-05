// เฝ้าระวังระบบ: แจ้ง LINE ถึงผู้ดูแลคนเดียว (push) เมื่อแหล่งข้อมูลใช้ไม่ได้ต่อเนื่อง ~1 ชม., ข้อมูลสถานีเก่าหลายจุด,
// หรือระบบหยุดดึงข้อมูลไปนาน — และแจ้งอีกครั้งเมื่อกลับมาปกติ
// ไม่ต้องมีตารางเก็บสถานะ: ดูจากประวัติ ingest_runs และแจ้งเฉพาะรอบที่สถานะเปลี่ยน จึงไม่ส่งซ้ำทุก 15 นาที
// ใช้ร่วมกันระหว่าง Node และ Supabase Edge Function — ห้ามใช้ node:* ในไฟล์นี้

export const DOWN_RUNS = 4; // ผิดปกติติดกัน 4 รอบ (≈1 ชม.) จึงแจ้ง
export const GAP_MIN = 60; // รอบก่อนหน้าห่างเกินนี้ = ระบบหยุดไป
export const STALE_LIMIT = 5; // สถานีข้อมูลเก่าพร้อมกันตั้งแต่กี่จุดถือว่าผิดปกติ

const SOURCE_NAME = {
  swoc: 'กรมชลประทาน (ระดับน้ำ)',
  thaiwater: 'ThaiWater (สสน.)',
  ridDams: 'ข้อมูลเขื่อน',
  egat: 'กฟผ. โทรมาตร',
  rain: 'ฝนคาดการณ์',
  sea: 'น้ำทะเลหนุน',
  cctv: 'กล้อง CCTV',
};

const staleCount = (run) => (run.alerts ?? []).filter((a) => a.level === 'info').length;
const fmtGap = (min) => (min >= 120 ? `${(min / 60).toFixed(1)} ชม.` : `${Math.round(min)} นาที`);

// window[0] = รอบนี้, window[1..] = รอบก่อนหน้า (ใหม่ → เก่า) · bad(run) บอกว่ารอบนั้นผิดปกติไหม
function transition(window, bad) {
  if (window.length < DOWN_RUNS + 1) return null;
  const recent = window.slice(0, DOWN_RUNS);
  if (recent.every(bad) && !bad(window[DOWN_RUNS])) return 'down';
  if (!bad(window[0]) && window.slice(1, DOWN_RUNS + 1).every(bad)) return 'up';
  return null;
}

// คืนรายการเหตุที่ต้องแจ้งผู้ดูแลในรอบนี้ [{ kind: 'down'|'up'|'gap', text }]
export function evaluateHealth(snapshot, previous) {
  const current = { started_at: snapshot.generated_at, sources: snapshot.sources, alerts: snapshot.alerts };
  const window = [current, ...previous];
  const notes = [];

  const prevAt = previous[0]?.started_at ? new Date(previous[0].started_at) : null;
  const gapMin = prevAt ? (new Date(snapshot.generated_at) - prevAt) / 60000 : 0;
  if (gapMin > GAP_MIN) notes.push({ kind: 'gap', text: `ระบบหยุดดึงข้อมูลไป ${fmtGap(gapMin)} — กลับมาทำงานแล้ว` });

  for (const [key, status] of Object.entries(snapshot.sources)) {
    const t = transition(window, (r) => r.sources?.[key] !== undefined && r.sources[key] !== 'ok');
    const name = SOURCE_NAME[key] ?? key;
    if (t === 'down') notes.push({ kind: 'down', text: `${name} ใช้ไม่ได้ต่อเนื่อง ~1 ชม. (${String(status).slice(0, 80)})` });
    if (t === 'up') notes.push({ kind: 'up', text: `${name} กลับมาใช้ได้แล้ว` });
  }

  const t = transition(window, (r) => staleCount(r) >= STALE_LIMIT);
  if (t === 'down') notes.push({ kind: 'down', text: `สถานีข้อมูลเก่า (เกิน 3 ชม.) ${staleCount(current)} จุด ต่อเนื่อง ~1 ชม.` });
  if (t === 'up') notes.push({ kind: 'up', text: 'ข้อมูลสถานีกลับมาเป็นปัจจุบันแล้ว' });
  return notes;
}

// อ่านรอบก่อนหน้าจากฐานข้อมูล (ไม่รวมรอบนี้)
export async function checkHealth(db, snapshot) {
  const url = `${db.url}/rest/v1/ingest_runs?select=started_at,sources,alerts&started_at=lt.${encodeURIComponent(snapshot.generated_at)}&order=started_at.desc&limit=${DOWN_RUNS + 1}`;
  const res = await fetch(url, { headers: db.headers });
  if (!res.ok) throw new Error(`อ่าน ingest_runs ไม่สำเร็จ: HTTP ${res.status}`);
  return evaluateHealth(snapshot, await res.json());
}

export function formatHealth(notes, snapshot, webUrl) {
  const t = new Date(snapshot.generated_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const icon = { down: '❌', up: '✅', gap: '⚠️' };
  const L = ['🛠 WaterWest · แจ้งผู้ดูแลระบบ', `${t} น.`, ''];
  for (const n of notes) L.push(`${icon[n.kind]} ${n.text}`);
  if (webUrl) L.push('', `ตรวจสอบ: ${webUrl}`);
  return L.join('\n').slice(0, 4900);
}

// LINE Messaging API — ส่งถึงผู้ใช้คนเดียว (ไม่ใช่ broadcast)
export async function pushLine(token, to, text) {
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, messages: [{ type: 'text', text }] }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`LINE push HTTP ${res.status} ${await res.text()}`);
}
