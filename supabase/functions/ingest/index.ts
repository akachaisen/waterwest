// Supabase Edge Function: ดึงข้อมูลน้ำแล้วบันทึกลงฐานข้อมูล — Supabase Cron เรียกทุก 15 นาที
// ไม่ต้องใช้คีย์เรียก (verify_jwt ปิด) แต่มีตัวกัน: ถ้ารอบล่าสุดยังไม่ถึง MIN_GAP_MIN นาที จะไม่ทำงานซ้ำ
// โค้ดหลักอยู่ที่ ingest/core.mjs (ใช้ร่วมกับสคริปต์ Node) — สร้างไฟล์ deploy ด้วย `npm run build:function`

import { collect } from "../../../ingest/core.mjs";
import { dbConfig, store } from "../../../ingest/store.mjs";

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
  return json({ ok: true, generated_at: snapshot.generated_at, saved, failed });
});
