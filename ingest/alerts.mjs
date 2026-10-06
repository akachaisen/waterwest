// ขั้นที่ 6: ระบบเตือนภัย — ประเมินกฎ → จดจำสถานะ (alert_state) → แจ้ง LINE เฉพาะเมื่อมีเหตุใหม่/รุนแรงขึ้น/คลี่คลาย
// ใช้ร่วมกันระหว่าง Node และ Supabase Edge Function — ห้ามใช้ node:* ในไฟล์นี้

const RANK = { yellow: 1, orange: 2, red: 3 };
const LABEL = { red: '🔴 วิกฤต', orange: '🟠 เตือนภัย', yellow: '🟡 เฝ้าระวัง' };
export const CLEAR_AFTER_MIN = 25; // ไม่พบซ้ำ 2 รอบ (15 นาที/รอบ) จึงถือว่าคลี่คลาย
const BANK_CLEAR_M = -0.15; // สถานีที่ล้นตลิ่งอยู่แล้ว ต้องลดต่ำกว่าตลิ่ง 15 ซม. จึงเลิกเตือน (กันการแกว่ง)
const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

// น้ำขึ้นเร็ว: ระดับขึ้นเกิน RISE_M ใน 6 ชม. — เฉพาะลำน้ำสาขาและแม่กลองท้ายเขื่อนแม่กลอง
// (ไม่รวมสถานีใต้เขื่อนที่ขึ้นลงตามการปล่อยน้ำทุกวัน และสถานีปากแม่น้ำที่ขึ้นลงตามน้ำทะเล — ปรับจากข้อมูล ก.ย.–ต.ค. 2569)
export const RISE_M = 0.8;
const RISE_CLEAR_M = 0.5;
export const RISE_STATIONS = ['K.25A', 'K.64', 'K.61', 'K.62', 'KRI04', 'K.49', 'KRI09', 'K.12', 'K.31', 'K.11A', 'K.63', 'K.55A', 'K.56A'];

// แหล่งข้อมูลกรมชลฯ (SWOC กับค่ารายชั่วโมง hyd-app) อ้างอิงศูนย์ไม้วัดเดียวกัน → นับเป็นแหล่งเดียว
const family = (src) => (String(src ?? '').startsWith('RID') ? 'RID' : src);

// ใส่ค่าที่ต้องเทียบย้อนหลังจาก readings (แหล่งเดียวกัน):
//  - rise_6h (ม.) ของ RISE_STATIONS: เทียบค่าที่ใกล้ "6 ชม.ก่อนเวลาวัดล่าสุด" (ยอมคลาด ±45 นาที)
//  - trend ของสถานีที่แหล่งข้อมูลไม่บอกแนวโน้ม (เช่น ปภ.): เทียบค่าราว 1 ชม.ก่อน (±25 นาที) เกิน ±2 ซม. = ขึ้น/ลง
export async function attachHistory(db, snapshot) {
  const live = snapshot.stations.filter((s) => !s.missing && !s.stale && s.wl_msl != null && s.time);
  const want = live.filter((s) => RISE_STATIONS.includes(s.code) || !s.trend);
  if (!want.length) return;
  const since = new Date(new Date(snapshot.generated_at).getTime() - 8 * 36e5).toISOString();
  const codes = want.map((s) => `"${s.code}"`).join(',');
  const res = await fetch(`${db.url}/rest/v1/readings?select=station_code,source,measured_at,wl&station_code=in.(${encodeURIComponent(codes)})&measured_at=gte.${since}&wl=not.is.null&order=measured_at.desc&limit=5000`, { headers: db.headers });
  if (!res.ok) throw new Error(`อ่าน readings ไม่สำเร็จ: HTTP ${res.status}`);
  const rows = await res.json();
  const near = (s, hoursBack, tolMin) => {
    const target = new Date(s.time).getTime() - hoursBack * 36e5;
    let best = null;
    for (const r of rows) {
      if (r.station_code !== s.code || family(r.source) !== family(s.source)) continue;
      const dt = Math.abs(new Date(r.measured_at).getTime() - target);
      if (dt <= tolMin * 60e3 && (!best || dt < best.dt)) best = { dt, wl: Number(r.wl) };
    }
    return best;
  };
  for (const s of want) {
    if (RISE_STATIONS.includes(s.code)) {
      const b = near(s, 6, 45);
      if (b) s.rise_6h = +(s.wl_msl - b.wl).toFixed(2);
    }
    if (!s.trend) {
      const b = near(s, 1, 25);
      if (b) {
        const ch = s.wl_msl - b.wl;
        s.trend = ch > 0.02 ? 'เพิ่มขึ้น' : ch < -0.02 ? 'ลดลง' : 'ทรงตัว';
      }
    }
  }
}

// กฎเตือนภัย → [{ key, level, text }]  (activeKeys = เหตุที่ยังเปิดอยู่จากรอบก่อน ใช้ทำ hysteresis)
export function evaluate(snapshot, activeKeys = new Set()) {
  const out = [];
  const by = Object.fromEntries(snapshot.stations.map((s) => [s.code, s]));

  for (const s of snapshot.stations) {
    if (s.missing || s.stale || s.diff_bank === null || s.diff_bank === undefined) continue;
    const key = `bank:${s.code}`;
    const over = s.diff_bank > 0 || (activeKeys.has(key) && s.diff_bank > BANK_CLEAR_M);
    if (!over) continue;
    const rising = s.trend === 'เพิ่มขึ้น';
    const level = s.key ? (rising ? 'red' : 'orange') : 'yellow';
    const where = s.diff_bank > 0 ? `สูงกว่าตลิ่ง ${fmt(s.diff_bank, 2)} ม.` : `เพิ่งลดลงต่ำกว่าตลิ่ง (${fmt(s.diff_bank, 2)} ม.)`;
    out.push({ key, level, text: `${s.name} (${s.code}) ${where}${rising ? ' และยังเพิ่มขึ้น' : ''}` });
  }

  // น้ำขึ้นเร็ว (ยังไม่ล้นตลิ่ง — ถ้าล้นแล้วมีเตือนล้นตลิ่งอยู่แล้ว)
  for (const s of snapshot.stations) {
    if (s.rise_6h == null || s.stale) continue;
    const key = `rise:${s.code}`;
    if (out.some((o) => o.key === `bank:${s.code}`)) continue;
    if (s.rise_6h < RISE_M && !(activeKeys.has(key) && s.rise_6h >= RISE_CLEAR_M)) continue;
    const bank = s.diff_bank == null ? '' : s.diff_bank > 0 ? ` · สูงกว่าตลิ่ง ${fmt(s.diff_bank, 2)} ม.` : ` · ยังต่ำกว่าตลิ่ง ${fmt(-s.diff_bank, 2)} ม.`;
    out.push({ key, level: 'yellow', text: `น้ำขึ้นเร็ว ${s.name} (${s.code}) ขึ้น ${fmt(s.rise_6h, 2)} ม. ใน 6 ชม.${bank}` });
  }

  const k37 = by['K.37'];
  if (k37?.q && k37.capacity && k37.q > k37.capacity && !k37.stale)
    out.push({ key: 'flow:K.37', level: 'orange', text: `แควน้อย K.37 ปริมาณ ${fmt(k37.q)} เกินความจุลำน้ำ ${fmt(k37.capacity)} ลบ.ม./วิ` });

  const mk = snapshot.maeklong_release_proxy;
  if (mk?.q > 3000) out.push({ key: 'flow:maeklong', level: 'red', text: `น้ำท้ายเขื่อนแม่กลอง (K.55A) ${fmt(mk.q)} ลบ.ม./วิ เกิน 3,000` });
  else if (mk?.q > 2500) out.push({ key: 'flow:maeklong', level: 'orange', text: `น้ำท้ายเขื่อนแม่กลอง (K.55A) ${fmt(mk.q)} ลบ.ม./วิ เกิน 2,500` });

  for (const d of snapshot.dams ?? []) {
    if (d.missing) continue;
    if (d.pct >= 100) out.push({ key: `dam:${d.id}`, level: 'red', text: `${d.name} เต็มระดับเก็บกัก (${fmt(d.pct, 1)}%) ต้องระบายเพิ่ม` });
    else if (d.pct >= 98 && d.net_mcm_day > 0)
      out.push({ key: `dam:${d.id}`, level: 'orange', text: `${d.name} ${fmt(d.pct, 1)}% น้ำเข้ามากกว่าระบาย ราว ${fmt(d.days_to_full ?? 0, 1)} วันจะเต็ม → อาจระบายเพิ่ม` });
  }

  // ฝนวัดจริง 24 ชม. ตอนบนเหนืออ่าง: ฝนหนักมาก (≥90 มม.) หรือฝนหนัก (≥35 มม.) ตั้งแต่ 3 สถานี
  for (const g of snapshot.rain_obs ?? []) {
    if (!g.upstream || !g.max) continue;
    if (g.max.mm >= 90) out.push({ key: `rainobs:${g.id}`, level: 'yellow', text: `ฝนวัดได้ 24 ชม. ${g.name} สูงสุด ${fmt(g.max.mm)} มม. (${g.max.name} อ.${g.max.amphoe})` });
    else if (g.heavy >= 3) out.push({ key: `rainobs:${g.id}`, level: 'yellow', text: `ฝนหนัก 24 ชม. ${g.name} ${g.heavy} สถานี สูงสุด ${fmt(g.max.mm)} มม. (อ.${g.max.amphoe})` });
  }

  // น้ำทะเลหนุน: คาดว่าน้ำขึ้นสูงภายใน 24 ชม. ที่สมุทรสงคราม (MKG006) ถึงระดับตลิ่ง
  const t0 = new Date(snapshot.generated_at).getTime();
  const hi = (snapshot.tide?.highs ?? []).find((h) => h.diff >= 0 && new Date(h.time).getTime() - t0 <= 24 * 36e5);
  if (hi) {
    const at = new Date(hi.time).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    out.push({ key: 'tide:MKG006', level: 'yellow', text: `น้ำทะเลหนุนสูง: คาดระดับน้ำที่${snapshot.tide.station.name} สูงกว่าตลิ่ง ${fmt(hi.diff, 2)} ม. ราว ${at} น.` });
  }

  for (const p of snapshot.rain ?? []) {
    if (p.id === 'rbr') continue;
    const next3 = p.days.slice(1, 4).reduce((a, b) => a + (b.mm ?? 0), 0);
    if (next3 >= 50) out.push({ key: `rain:${p.id}`, level: 'yellow', text: `ฝนคาดการณ์${p.name} 3 วันรวม ${fmt(next3)} มม.` });
  }
  return out;
}

// อ่านสถานะเดิม → อัปเดต → คืนรายการที่ต้องแจ้ง
export async function syncAlerts(db, snapshot, { lineReady }) {
  const now = new Date(snapshot.generated_at);
  const prev = await fetch(`${db.url}/rest/v1/alert_state?select=*&or=(active.eq.true,clear_notified.eq.false)`, { headers: db.headers }).then((r) => {
    if (!r.ok) throw new Error(`อ่าน alert_state ไม่สำเร็จ: HTTP ${r.status}`);
    return r.json();
  });
  const prevBy = new Map(prev.map((a) => [a.key, a]));
  const activeKeys = new Set(prev.filter((a) => a.active).map((a) => a.key));
  try {
    await attachHistory(db, snapshot);
  } catch {
    // อ่านค่าย้อนหลังไม่ได้ — ข้ามกฎน้ำขึ้นเร็ว/แนวโน้ม ปภ. รอบนี้
  }
  const current = evaluate(snapshot, activeKeys);
  const curKeys = new Set(current.map((c) => c.key));

  const rows = [];
  const raised = [];
  const cleared = [];

  for (const c of current) {
    const p = prevBy.get(c.key);
    const fresh = !p || !p.active;
    const row = {
      key: c.key, level: c.level, text: c.text,
      first_seen: fresh ? now.toISOString() : p.first_seen,
      last_seen: now.toISOString(), active: true, cleared_at: null,
      notified_level: fresh ? null : p.notified_level, notified_at: fresh ? null : p.notified_at,
      clear_notified: fresh ? true : p.clear_notified,
    };
    // แจ้งเมื่อระดับเตือนภัยขึ้นไป (ส้ม/แดง) และยังไม่เคยแจ้งที่ระดับนี้หรือสูงกว่า
    if (RANK[c.level] >= RANK.orange && (!row.notified_level || RANK[c.level] > RANK[row.notified_level])) {
      raised.push({ ...c, escalated: !!row.notified_level });
      if (lineReady) { row.notified_level = c.level; row.notified_at = now.toISOString(); row.clear_notified = false; }
    }
    rows.push(row);
  }

  for (const p of prev) {
    if (curKeys.has(p.key)) continue;
    if (p.active) {
      const goneMin = (now - new Date(p.last_seen)) / 60000;
      if (goneMin < CLEAR_AFTER_MIN) continue; // ยังไม่นานพอ — รอรอบหน้า
      const row = { ...p, active: false, cleared_at: now.toISOString() };
      if (p.notified_level) {
        cleared.push(p);
        if (lineReady) row.clear_notified = true;
      } else row.clear_notified = true;
      rows.push(row);
    } else if (!p.clear_notified && p.notified_level) {
      cleared.push(p); // คลี่คลายแล้วแต่ยังส่งไม่สำเร็จรอบก่อน
      if (lineReady) rows.push({ ...p, clear_notified: true });
    }
  }
  return { rows, raised, cleared, active: current };
}

export function formatLine({ raised, cleared, active }, snapshot, webUrl) {
  if (!raised.length && !cleared.length) return null;
  const t = new Date(snapshot.generated_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const L = [`🌊 WaterWest · ลุ่มน้ำแม่กลอง`, `${t} น.`];
  const list = (items, fn) => {
    const sorted = [...items].sort((a, b) => RANK[b.level] - RANK[a.level]);
    for (const a of sorted.slice(0, 8)) L.push(fn(a));
    if (sorted.length > 8) L.push(`…และอีก ${sorted.length - 8} รายการ`);
  };
  if (raised.length) {
    L.push('', '⚠️ แจ้งเตือนใหม่');
    list(raised, (a) => `${LABEL[a.level]}${a.escalated ? ' (รุนแรงขึ้น)' : ''}: ${a.text}`);
  }
  if (cleared.length) {
    L.push('', '✅ คลี่คลายแล้ว');
    // ข้อความเดิมอาจเป็นค่าตอนกำลังลด จึงสรุปใหม่: ชื่อสถานี/เขื่อน + "กลับสู่ระดับปกติแล้ว"
    list(cleared, (a) =>
      a.key.startsWith('bank:') ? `• ${a.text.slice(0, a.text.indexOf(')') + 1)} ลดลงต่ำกว่าตลิ่งแล้ว` : `• ไม่เกินเกณฑ์แล้ว: ${a.text}`,
    );
  }
  const stillOn = active.filter((a) => RANK[a.level] >= RANK.orange).length;
  L.push('', `ยังเฝ้าระวังอยู่ ${stillOn} จุด`);
  if (webUrl) L.push(`ดูรายละเอียด: ${webUrl}`);
  L.push('ข้อมูลประกอบการติดตาม ไม่ใช่ประกาศทางการ · สายด่วน ปภ. 1784');
  return L.join('\n').slice(0, 4900);
}

// LINE Messaging API — ส่งถึงทุกคนที่เพิ่มเพื่อน OA (broadcast)
export async function sendLine(token, text) {
  const res = await fetch('https://api.line.me/v2/bot/message/broadcast', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ type: 'text', text }] }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`LINE HTTP ${res.status} ${await res.text()}`);
}
