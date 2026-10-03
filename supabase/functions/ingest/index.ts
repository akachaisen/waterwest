// Supabase Edge Function: ดึงข้อมูลน้ำแล้วบันทึกลงฐานข้อมูล — Supabase Cron เรียกทุก 15 นาที
// ไม่ต้องใช้คีย์เรียก (verify_jwt ปิด) แต่มีตัวกัน: ถ้ารอบล่าสุดยังไม่ถึง MIN_GAP_MIN นาที จะไม่ทำงานซ้ำ
// โค้ดหลักอยู่ที่ ingest/core.mjs (ใช้ร่วมกับสคริปต์ Node) — สร้างไฟล์ deploy ด้วย `npm run build:function`

import { collect } from "../../../ingest/core.mjs";
import { dbConfig, store, upsert } from "../../../ingest/store.mjs";
import { formatLine, sendLine, syncAlerts } from "../../../ingest/alerts.mjs";

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

Deno.serve(async () => {
  const env = { SUPABASE_URL: Deno.env.get("SUPABASE_URL"), SUPABASE_SECRET_KEY: secretKey() };
  const db = dbConfig(env);
  if (!db) return json({ error: "ไม่มีค่า SUPABASE_URL / คีย์" }, 500);

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

  // ขั้นที่ 6: เตือนภัย + LINE (ส่งเฉพาะเหตุใหม่/รุนแรงขึ้น/คลี่คลาย)
  const token = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
  let alerts: Record<string, unknown> = {};
  try {
    const sync = await syncAlerts(db, snapshot, { lineReady: !!token });
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
  return json({ ok: true, generated_at: snapshot.generated_at, saved, failed, alerts });
});
