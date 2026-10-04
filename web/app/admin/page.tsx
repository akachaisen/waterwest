import type { Metadata } from "next";
import { adminEnabled, isAdmin } from "@/lib/adminAuth";
import { announcementsEnabled, listAnnouncements, nowThaiInput } from "@/lib/announcements";
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
        <p className="mt-2 text-sm text-muted">
          ยังไม่ได้ตั้งค่าบนเซิร์ฟเวอร์ — ต้องมี <code>ADMIN_PASSWORD</code> (อย่างน้อย 8 ตัว), <code>SUPABASE_URL</code> และ <code>SUPABASE_SECRET_KEY</code>
          (ตั้งตอนนำเว็บขึ้นออนไลน์ ขั้นที่ 9)
        </p>
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

  const list = await listAnnouncements(50);
  const nowLocal = nowThaiInput();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold sm:text-2xl">หลังบ้าน · ประกาศ</h1>
        <form action={logout}>
          <button className="rounded-full border border-border px-4 py-1.5 text-sm hover:border-accent">ออกจากระบบ</button>
        </form>
      </div>

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
