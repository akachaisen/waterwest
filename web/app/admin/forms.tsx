"use client";

import { useActionState } from "react";
import { addAnnouncement, login, type FormState } from "./actions";

const input = "w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-base outline-none focus:border-accent";

function Msg({ s }: { s: FormState }) {
  if (s.error) return <p className="text-sm font-semibold text-red" role="alert">{s.error}</p>;
  if (s.ok) return <p className="text-sm font-semibold text-green" role="status">{s.ok}</p>;
  return null;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm font-semibold" htmlFor="pw">รหัสผ่านผู้ดูแล</label>
      <input id="pw" name="password" type="password" autoComplete="current-password" required className={input} />
      <button disabled={pending} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:text-bg">
        {pending ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}
      </button>
      <Msg s={state} />
    </form>
  );
}

export function AnnouncementForm({ nowLocal }: { nowLocal: string }) {
  const [state, action, pending] = useActionState(addAnnouncement, {});
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="block text-sm font-semibold" htmlFor="title">หัวข้อ *</label>
        <input id="title" name="title" required maxLength={200} placeholder="เช่น เขื่อนแม่กลองเพิ่มการระบายเป็น 2,500 ลบ.ม./วินาที" className={input} />
      </div>
      <div>
        <label className="block text-sm font-semibold" htmlFor="body">รายละเอียด</label>
        <textarea id="body" name="body" rows={3} maxLength={2000} className={input} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold" htmlFor="level">ระดับ</label>
          <select id="level" name="level" defaultValue="info" className={input}>
            <option value="info">ข่าวสาร</option>
            <option value="yellow">เฝ้าระวัง</option>
            <option value="orange">เตือนภัย</option>
            <option value="red">วิกฤต</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold" htmlFor="maeklong_cms">ระบายเขื่อนแม่กลอง (ลบ.ม./วิ)</label>
          <input id="maeklong_cms" name="maeklong_cms" inputMode="numeric" placeholder="เว้นว่างถ้าไม่ใช่ประกาศเรื่องนี้" className={input} />
        </div>
        <div>
          <label className="block text-sm font-semibold" htmlFor="effective_at">มีผลตั้งแต่ (เวลาไทย)</label>
          <input id="effective_at" name="effective_at" type="datetime-local" defaultValue={nowLocal} className={input} />
        </div>
        <div>
          <label className="block text-sm font-semibold" htmlFor="expires_hours">แสดงนาน (ชั่วโมง)</label>
          <input id="expires_hours" name="expires_hours" type="number" min={1} max={720} defaultValue={24} className={input} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold" htmlFor="source_url">ลิงก์แหล่งข่าวทางการ</label>
        <input id="source_url" name="source_url" type="url" placeholder="https://…" className={input} />
      </div>
      <button disabled={pending} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:text-bg">
        {pending ? "กำลังบันทึก…" : "บันทึกประกาศ"}
      </button>
      <Msg s={state} />
    </form>
  );
}
