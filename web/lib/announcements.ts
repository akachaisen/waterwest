import "server-only";

// ประกาศที่ผู้ดูแลกรอกเอง — อ่าน/เขียนฝั่งเซิร์ฟเวอร์ด้วย SUPABASE_SECRET_KEY (ไม่ส่งถึงเบราว์เซอร์)

export type Announcement = {
  id: number;
  created_at: string;
  title: string;
  body: string | null;
  level: "info" | "yellow" | "orange" | "red";
  source_url: string | null;
  maeklong_cms: number | null;
  effective_at: string;
  expires_at: string | null;
};

function db() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  return { url, headers };
}

export const announcementsEnabled = () => db() !== null;

export async function listAnnouncements(limit = 30): Promise<Announcement[]> {
  const d = db();
  if (!d) return [];
  try {
    const res = await fetch(`${d.url}/rest/v1/announcements?select=*&order=effective_at.desc&limit=${limit}`, {
      headers: d.headers,
      next: { revalidate: 60, tags: ["announcements"] },
    });
    return res.ok ? res.json() : [];
  } catch {
    return [];
  }
}

// ตัวเลขระบายเขื่อนแม่กลองจากประกาศล่าสุด (ภายใน 48 ชม. และยังไม่หมดอายุ)
export async function latestMaeklongRelease(): Promise<Announcement | null> {
  const list = await listAnnouncements(20);
  const now = Date.now();
  return (
    list.find(
      (a) =>
        a.maeklong_cms !== null &&
        now - new Date(a.effective_at).getTime() < 48 * 3600e3 &&
        (!a.expires_at || new Date(a.expires_at).getTime() > now),
    ) ?? null
  );
}

export async function insertAnnouncement(a: Omit<Announcement, "id" | "created_at">) {
  const d = db();
  if (!d) throw new Error("ยังไม่ได้ตั้งค่าฐานข้อมูลสำหรับหลังบ้าน");
  const res = await fetch(`${d.url}/rest/v1/announcements`, {
    method: "POST",
    headers: { ...d.headers, Prefer: "return=minimal" },
    body: JSON.stringify(a),
  });
  if (!res.ok) throw new Error(`บันทึกไม่สำเร็จ (HTTP ${res.status})`);
}

export async function deleteAnnouncement(id: number) {
  const d = db();
  if (!d) throw new Error("ยังไม่ได้ตั้งค่าฐานข้อมูลสำหรับหลังบ้าน");
  const res = await fetch(`${d.url}/rest/v1/announcements?id=eq.${id}`, { method: "DELETE", headers: d.headers });
  if (!res.ok) throw new Error(`ลบไม่สำเร็จ (HTTP ${res.status})`);
}

// แยกประกาศที่ยังมีผล / หมดอายุแล้ว
export function splitByExpiry(list: Announcement[]) {
  const now = Date.now();
  const alive = (a: Announcement) => !a.expires_at || new Date(a.expires_at).getTime() > now;
  return { current: list.filter(alive), past: list.filter((a) => !alive(a)).slice(0, 10) };
}

// เวลาไทยตอนนี้ในรูปแบบ datetime-local (yyyy-mm-ddThh:mm)
export function nowThaiInput() {
  return new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 16);
}
