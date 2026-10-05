import type { Metadata } from "next";
import { adminEnabled, isAdmin } from "@/lib/adminAuth";
import { announcementsEnabled, listAnnouncements, nowThaiInput } from "@/lib/announcements";
import { latestLineQuota, type LineQuota } from "@/lib/lineQuota";
import { fmt, fmtTime } from "@/lib/status";
import { Card, SectionTitle } from "@/components/ui";
import { logout, removeAnnouncement } from "./actions";
import { AnnouncementForm, LoginForm } from "./forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "หลังบ้าน", robots: { index: false, follow: false } };

const LEVEL_NAME: Record<string, string> = { info: "ข่าวสาร", yellow: "เฝ้าระวัง", orange: "เตือนภัย", red: "วิกฤต" };

export default async function AdminPage() {
  if (!adminEnabled() || !announcementsEnabled()) {
    return (
      <Card>
        <h1 className="text-xl font-bold">หลังบ้าน</h1>
        <p className="mt-2 text-sm text-muted">ยังไม่ได้ตั้งค่าบนเซิร์ฟเวอร์ ตรวจรายการต่อไปนี้ (แสดงเฉพาะสถานะ ไม่แสดงค่า):</p>
        <ul className="mt-2 space-y-1 text-sm">
          {[
            ["ADMIN_PASSWORD (อย่างน้อย 8 ตัวอักษร)", adminEnabled()],
            ["SUPABASE_URL", !!process.env.SUPABASE_URL],
            ["SUPABASE_SECRET_KEY", !!process.env.SUPABASE_SECRET_KEY],
          ].map(([n, ok]) => (
            <li key={String(n)}>{ok ? "✅" : "❌"} <code>{n}</code></li>
          ))}
        </ul>
      </Card>
    );
  }

  if (!(await isAdmin())) {
    return (
      <div className="mx-auto max-w-sm">
        <Card>
          <h1 className="mb-3 text-xl font-bold">เข้าสู่ระบบหลังบ้าน</h1>
          <LoginForm />
        </Card>
      </div>
    );
  }

  const [list, quota] = await Promise.all([listAnnouncements(50), latestLineQuota()]);
  const nowLocal = nowThaiInput();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold sm:text-2xl">หลังบ้าน · ประกาศ</h1>
        <form action={logout}>
          <button className="rounded-full border border-border px-4 py-1.5 text-sm hover:border-accent">ออกจากระบบ</button>
        </form>
      </div>

      <QuotaCard q={quota} />

      <Card>
        <SectionTitle>เพิ่มประกาศ</SectionTitle>
        <p className="mb-3 text-xs text-muted">
          ใส่เฉพาะข้อมูลจากประกาศทางการ พร้อมลิงก์แหล่งข่าว · ถ้ากรอกตัวเลขระบายเขื่อนแม่กลอง ระบบจะแสดงคู่กับค่าที่วัดได้ที่บ้านโป่ง (K.55A) เป็นเวลา 48 ชม.
        </p>
        <AnnouncementForm nowLocal={nowLocal} />
      </Card>

      <Card>
        <SectionTitle hint={`${list.length} รายการ`}>ประกาศทั้งหมด</SectionTitle>
        <ul className="divide-y divide-border">
          {list.map((a) => (
            <li key={a.id} className="flex items-start gap-3 py-2.5">
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold">{a.title}</p>
                <p className="text-xs text-muted">
                  {LEVEL_NAME[a.level] ?? a.level} · มีผล {fmtTime(a.effective_at)}
                  {a.expires_at && ` ถึง ${fmtTime(a.expires_at)}`}
                  {a.maeklong_cms !== null && ` · ระบาย ${fmt(a.maeklong_cms)} ลบ.ม./วิ`}
                </p>
              </div>
              <form action={removeAnnouncement}>
                <input type="hidden" name="id" value={a.id} />
                <button className="rounded-full px-3 py-1 text-xs text-muted hover:bg-red-bg hover:text-red">ลบ</button>
              </form>
            </li>
          ))}
          {list.length === 0 && <li className="py-2 text-sm text-muted">ยังไม่มีประกาศ</li>}
        </ul>
      </Card>
    </div>
  );
}

// โควตาข้อความ LINE เดือนนี้: แจ้งเตือน 1 ครั้ง (broadcast) ใช้โควตาเท่าจำนวนผู้รับ
function QuotaCard({ q }: { q: LineQuota | null }) {
  if (!q) {
    return (
      <Card>
        <SectionTitle>โควตาข้อความ LINE</SectionTitle>
        <p className="text-sm text-muted">ยังไม่มีข้อมูล (ระบบจะอัปเดตในรอบดึงข้อมูลถัดไป)</p>
      </Card>
    );
  }
  const per = Math.max(1, q.reach ?? 1);
  const pct = q.quota ? Math.min(100, Math.round((q.used / q.quota) * 100)) : 0;
  const bar = pct >= 95 ? "bg-red" : pct >= 80 ? "bg-orange" : "bg-green";
  return (
    <Card>
      <SectionTitle hint={`อัปเดต ${fmtTime(q.checked_at)}`}>โควตาข้อความ LINE · {q.month}</SectionTitle>
      {q.quota === null ? (
        <p className="text-sm">ใช้ไป {fmt(q.used)} ข้อความ · แพ็กเกจไม่จำกัดจำนวน</p>
      ) : (
        <>
          <p className="text-sm">
            ใช้ไป <b>{fmt(q.used)}</b> / {fmt(q.quota)} ข้อความ ({pct}%)
          </p>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-border" role="img" aria-label={`ใช้โควตาไป ${pct}%`}>
            <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">
            ผู้รับ {q.reach ?? "?"} คน → แจ้งเตือน 1 ครั้งใช้ ~{per} ข้อความ · ส่งได้อีกประมาณ{" "}
            {Math.max(0, Math.floor((q.quota - q.used) / per))} ครั้ง · ระบบส่ง LINE ถึงผู้ดูแลเมื่อใช้ถึง 80%, 95% และเมื่อไม่พอส่งอีก 1 ครั้ง
          </p>
        </>
      )}
    </Card>
  );
}
