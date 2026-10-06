// Supabase Edge Function: ดึงข้อมูลน้ำแล้วบันทึกลงฐานข้อมูล — Supabase Cron เรียกทุก 15 นาที
// ไม่ต้องใช้คีย์เรียก (verify_jwt ปิด) แต่มีตัวกัน: ถ้ารอบล่าสุดยังไม่ถึง MIN_GAP_MIN นาที จะไม่ทำงานซ้ำ
// โค้ดหลักอยู่ที่ ingest/core.mjs (ใช้ร่วมกับสคริปต์ Node) — สร้างไฟล์ deploy ด้วย `npm run build:function`

import { collect } from "../../../ingest/core.mjs";
import { dbConfig, store, upsert } from "../../../ingest/store.mjs";
import { formatLine, sendLine, syncAlerts } from "../../../ingest/alerts.mjs";
import { checkHealth, formatHealth, pushLine } from "../../../ingest/health.mjs";
import { syncQuota } from "../../../ingest/quota.mjs";
import { maybeSendDaily } from "../../../ingest/daily.mjs";
import { syncRainObs } from "../../../ingest/rainobs.mjs";
import { tideFromStation } from "../../../ingest/tide.mjs";
import { ridHistoryRows } from "../../../ingest/sources.mjs";
import { STATIONS } from "../../../ingest/stations.mjs";

const MIN_GAP_MIN = 8;

declare const Deno: {
  env: { get(k: string): string | undefined };
  serve(h: (req: Request) => Response | Promise<Response>): void;
};

// คีย์ที่ Supabase ใส่ให้ Edge Function อัตโนมัติ (แบบใหม่ SUPABASE_SECRET_KEYS หรือแบบเดิม SUPABASE_SERVICE_ROLE_KEY)
function secretKey(): string | undefined {
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keys) {
    try {
      const parsed = JSON.parse(keys) as Record<string, string>;
      const first = Object.values(parsed)[0];
      if (first) return first;
    } catch {
      // ใช้แบบเดิมแทน
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const env = { SUPABASE_URL: Deno.env.get("SUPABASE_URL"), SUPABASE_SECRET_KEY: secretKey() };
  const db = dbConfig(env);
  if (!db) return json({ error: "ไม่มีค่า SUPABASE_URL / คีย์" }, 500);

  // ?rid_day=N: เติมค่ารายชั่วโมงกรมชลฯ ย้อนหลังของวันที่ N วันก่อน (0–60, 0 = วันนี้) — เครื่อง GitHub เข้า hyd-app ไม่ได้
  const ridParam = new URL(req.url).searchParams.get("rid_day");
  const ridDay = ridParam === null ? NaN : Number(ridParam);
  if (Number.isInteger(ridDay) && ridDay >= 0 && ridDay <= 60) {
    const codes = new Set(STATIONS.filter((s) => s.src === "swoc").map((s) => s.code));
    const rows = await ridHistoryRows(new Date(Date.now() - ridDay * 86400e3), codes);
    return json({ rid_day: ridDay, saved: await upsert(db, "readings", rows) });
  }

  // กันการเรียกถี่เกินไป (ทั้งจากคนภายนอกและเมื่อ GitHub รันใกล้เวลากัน)
  const last = await fetch(`${db.url}/rest/v1/ingest_runs?select=started_at&order=started_at.desc&limit=1`, { headers: db.headers })
    .then((r) => r.json())
    .catch(() => []);
  const lastAt = last?.[0]?.started_at ? new Date(last[0].started_at).getTime() : 0;
  const gapMin = (Date.now() - lastAt) / 60000;
  if (gapMin < MIN_GAP_MIN) return json({ skipped: true, reason: `รอบล่าสุดเมื่อ ${gapMin.toFixed(1)} นาทีก่อน` });

  const snapshot = await collect();
  const saved = await store(snapshot, env);
  const failed = Object.entries(snapshot.sources).filter(([, v]) => v !== "ok").map(([k]) => k);

  // ฝนวัดจริง 24 ชม. (ดึงชั่วโมงละครั้ง) — ใส่ใน snapshot ให้กฎเตือนภัยและสรุปรายวันใช้
  let rainObs: Record<string, unknown> = {};
  try {
    const r = await syncRainObs(db, new Date(snapshot.generated_at));
    Object.assign(snapshot, { rain_obs: r.groups, rain_obs_at: r.checked_at });
    rainObs = { fetched: r.fetched, checked_at: r.checked_at };
  } catch (e) {
    rainObs = { error: String((e as Error).message ?? e) };
  }

  // น้ำทะเลหนุน: ปรับแบบจำลองให้ตรงสถานีจริง MKG006 แล้วคาดน้ำขึ้นสูงครั้งถัดไป (เทียบตลิ่ง)
  let tide: Record<string, unknown> = {};
  try {
    const t = await tideFromStation(db, new Date(snapshot.generated_at).getTime());
    Object.assign(snapshot, { tide: t });
    tide = t ? { lag_h: t.lag_h, rmse: t.rmse, highs: t.highs.length } : { status: "ข้อมูลสถานีไม่พอ ใช้แบบจำลองอย่างเดียว" };
  } catch (e) {
    tide = { error: String((e as Error).message ?? e) };
  }

  // ขั้นที่ 6: เตือนภัย + LINE (ส่งเฉพาะเหตุใหม่/รุนแรงขึ้น/คลี่คลาย)
  const token = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
  let alerts: Record<string, unknown> = {};
  let active: { key: string; level: string; text: string }[] = [];
  try {
    const sync = await syncAlerts(db, snapshot, { lineReady: !!token });
    active = sync.active;
    const text = formatLine(sync, snapshot, Deno.env.get("WEB_URL"));
    let line = "ไม่มีเรื่องต้องแจ้ง";
    if (text && token) {
      await sendLine(token, text);
      line = "ส่งแล้ว";
    } else if (text) line = "ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN";
    // บันทึกสถานะหลังส่งสำเร็จเท่านั้น — ถ้าส่งไม่ผ่านจะลองใหม่รอบหน้า
    await upsert(db, "alert_state", sync.rows);
    alerts = { active: sync.active.length, raised: sync.raised.length, cleared: sync.cleared.length, line };
  } catch (e) {
    alerts = { error: String((e as Error).message ?? e) };
  }
  // เฝ้าระวังระบบ: แจ้งผู้ดูแลคนเดียว (LINE_ADMIN_USER_ID) เมื่อแหล่งข้อมูลล่ม/ข้อมูลเก่า/ระบบหยุดไป และเมื่อกลับมาปกติ
  const adminId = Deno.env.get("LINE_ADMIN_USER_ID");
  let health: Record<string, unknown> = {};
  try {
    const notes = await checkHealth(db, snapshot);
    let line = notes.length ? "ยังไม่ได้ตั้งค่า LINE_ADMIN_USER_ID" : "ปกติ";
    if (notes.length && token && adminId) {
      const webUrl = Deno.env.get("WEB_URL");
      await pushLine(token, adminId, formatHealth(notes, snapshot, webUrl ? new URL("/admin", webUrl).href : undefined));
      line = "ส่งแล้ว";
    }
    health = { notes: notes.map((n) => n.text), line };
  } catch (e) {
    health = { error: String((e as Error).message ?? e) };
  }
  // โควตาข้อความ LINE: บันทึกยอดใช้ + เตือนผู้ดูแลเมื่อใกล้หมด
  let quota: Record<string, unknown> = {};
  if (token) {
    try {
      quota = await syncQuota(db, token, adminId);
    } catch (e) {
      quota = { error: String((e as Error).message ?? e) };
    }
  }
  // สรุปสถานการณ์รายวัน 06:00 น. (broadcast วันละครั้ง)
  let daily: Record<string, unknown> = {};
  try {
    const webUrl = Deno.env.get("WEB_URL");
    daily = await maybeSendDaily(db, snapshot, active, {
      token,
      webUrl: webUrl ? new URL("/", webUrl).href : undefined,
      enabled: Deno.env.get("DAILY_SUMMARY") !== "off",
    });
  } catch (e) {
    daily = { error: String((e as Error).message ?? e) };
  }
  return json({ ok: true, generated_at: snapshot.generated_at, saved, failed, alerts, health, quota, daily, rainObs, tide });
});
