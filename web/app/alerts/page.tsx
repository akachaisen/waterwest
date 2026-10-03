import type { Metadata } from "next";
import { getSnapshot } from "@/lib/data";
import { fmtTime } from "@/lib/status";
import type { Level } from "@/lib/types";
import { Badge, Card, SectionTitle } from "@/components/ui";

export const revalidate = 300;
export const metadata: Metadata = { title: "เตือนภัย" };

type AlertRow = { key: string; level: Level; text: string; first_seen: string; last_seen: string; active: boolean; cleared_at: string | null; notified_at: string | null };

const LEVEL_NAME: Record<string, string> = { red: "วิกฤต", orange: "เตือนภัย", yellow: "เฝ้าระวัง" };
const RANK: Record<string, number> = { red: 3, orange: 2, yellow: 1 };

async function getAlertState(): Promise<AlertRow[] | null> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const since = new Date(Date.now() - 7 * 86400e3).toISOString();
  const res = await fetch(`${url}/rest/v1/alert_state?select=*&last_seen=gte.${since}&order=last_seen.desc&limit=200`, {
    headers: { apikey: key },
    next: { revalidate: 300 },
  });
  return res.ok ? res.json() : null;
}

export default async function AlertsPage() {
  const [s, state] = await Promise.all([getSnapshot(), getAlertState().catch(() => null)]);
  const active = state
    ? state.filter((a) => a.active)
    : s.alerts.filter((a) => a.level !== "info").map((a) => ({ key: a.text, level: a.level as Level, text: a.text, first_seen: s.generatedAt, last_seen: s.generatedAt, active: true, cleared_at: null, notified_at: null }));
  const history = state ? state.filter((a) => !a.active) : [];
  const lineId = process.env.NEXT_PUBLIC_LINE_OA_ID;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">เตือนภัย</h1>
        <p className="mt-1 text-sm text-muted">
          ตรวจทุก 15 นาที · ส่ง LINE เมื่อมีเหตุระดับ <b>เตือนภัย/วิกฤต</b> ใหม่ รุนแรงขึ้น หรือคลี่คลาย · ระดับเฝ้าระวังแสดงบนเว็บเท่านั้น
        </p>
      </div>

      <Card>
        <SectionTitle hint={`${active.length} รายการ`}>กำลังเกิดขึ้นตอนนี้</SectionTitle>
        {active.length === 0 ? (
          <p className="text-sm text-muted">ไม่มีเหตุที่ต้องเฝ้าระวัง</p>
        ) : (
          <ul className="divide-y divide-border">
            {[...active].sort((a, b) => (RANK[b.level] ?? 0) - (RANK[a.level] ?? 0)).map((a) => (
              <li key={a.key} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-2.5">
                <Badge level={a.level}>{LEVEL_NAME[a.level] ?? a.level}</Badge>
                <span className="min-w-0 flex-1 text-sm">{a.text}</span>
                {state && <span className="w-full text-xs text-muted sm:w-auto">เริ่ม {fmtTime(a.first_seen)}{a.notified_at ? " · แจ้ง LINE แล้ว" : ""}</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {state && (
        <Card>
          <SectionTitle hint="7 วันล่าสุด">คลี่คลายแล้ว</SectionTitle>
          {history.length === 0 ? (
            <p className="text-sm text-muted">ยังไม่มี</p>
          ) : (
            <ul className="divide-y divide-border">
              {history.map((a) => (
                <li key={a.key + a.first_seen} className="py-2 text-sm">
                  <span className="text-muted">{fmtTime(a.first_seen)} – {fmtTime(a.cleared_at)}</span>
                  <span className="block">{a.text}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Card>
        <SectionTitle>รับแจ้งเตือนทาง LINE</SectionTitle>
        {lineId ? (
          <div className="flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- QR จาก LINE */}
            <img src={`https://qr-official.line.me/sid/L/${lineId.replace(/^@/, "")}.png`} alt="QR สำหรับเพิ่มเพื่อน LINE" className="size-32 rounded-lg border border-border bg-white" />
            <div className="text-sm">
              <p>สแกน QR หรือกดปุ่มเพื่อเพิ่มเพื่อน แล้วจะได้รับแจ้งเตือนอัตโนมัติ</p>
              <a href={`https://line.me/R/ti/p/${encodeURIComponent(lineId)}`} className="mt-2 inline-block rounded-full bg-[#06c755] px-4 py-2 font-semibold text-white" target="_blank" rel="noopener noreferrer">
                เพิ่มเพื่อน {lineId}
              </a>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">กำลังตั้งค่า LINE Official Account</p>
        )}
      </Card>

      <p className="text-xs text-muted">
        เกณฑ์ (ต้นแบบของ WaterWest ไม่ใช่เกณฑ์ทางการ): สถานีหลักสูงกว่าตลิ่ง = เตือนภัย (ถ้ายังเพิ่มขึ้น = วิกฤต) · น้ำท้ายเขื่อนแม่กลองเกิน 2,500 / 3,000 ลบ.ม./วิ ·
        เขื่อน ≥98% และน้ำเข้ามากกว่าระบาย · K.37 เกินความจุลำน้ำ · สถานีรองล้นตลิ่ง/ฝนคาดการณ์ ≥50 มม. ใน 3 วัน = เฝ้าระวัง · คลี่คลายเมื่อไม่พบติดกัน 2 รอบ
        และสถานีต้องลดต่ำกว่าตลิ่ง 15 ซม.
      </p>
    </div>
  );
}
