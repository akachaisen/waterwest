"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { clearSession, isAdmin, passwordMatches, setSession } from "@/lib/adminAuth";
import { deleteAnnouncement, insertAnnouncement } from "@/lib/announcements";

export type FormState = { ok?: string; error?: string };

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const pw = String(form.get("password") ?? "");
  if (!passwordMatches(pw)) {
    await new Promise((r) => setTimeout(r, 1500)); // หน่วงเวลาเพื่อกันการเดารหัส
    return { error: "รหัสผ่านไม่ถูกต้อง" };
  }
  await setSession();
  revalidatePath("/admin");
  return { ok: "เข้าสู่ระบบแล้ว" };
}

export async function logout() {
  await clearSession();
  revalidatePath("/admin");
}

const LEVELS = new Set(["info", "yellow", "orange", "red"]);

export async function addAnnouncement(_: FormState, form: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { error: "หมดเวลาเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่" };
  const title = String(form.get("title") ?? "").trim().slice(0, 200);
  const body = String(form.get("body") ?? "").trim().slice(0, 2000) || null;
  const level = String(form.get("level") ?? "info");
  const source = String(form.get("source_url") ?? "").trim();
  const cmsRaw = String(form.get("maeklong_cms") ?? "").replace(/,/g, "").trim();
  const effRaw = String(form.get("effective_at") ?? "").trim();
  const hours = Number(form.get("expires_hours") ?? 24);

  if (!title) return { error: "กรุณาใส่หัวข้อ" };
  if (!LEVELS.has(level)) return { error: "ระดับไม่ถูกต้อง" };
  if (source && !/^https?:\/\/\S+$/i.test(source)) return { error: "ลิงก์แหล่งข่าวต้องขึ้นต้นด้วย http:// หรือ https://" };
  const cms = cmsRaw ? Number(cmsRaw) : null;
  if (cms !== null && (!Number.isFinite(cms) || cms < 0 || cms > 10000)) return { error: "ตัวเลขระบายต้องอยู่ระหว่าง 0–10,000 ลบ.ม./วิ" };
  // เวลาที่กรอกเป็นเวลาไทย (datetime-local)
  const eff = effRaw ? new Date(`${effRaw}:00+07:00`) : new Date();
  if (Number.isNaN(eff.getTime())) return { error: "เวลาที่มีผลไม่ถูกต้อง" };
  const exp = Number.isFinite(hours) && hours > 0 ? new Date(eff.getTime() + Math.min(hours, 24 * 30) * 3600e3) : null;

  try {
    await insertAnnouncement({
      title, body, level: level as "info", source_url: source || null, maeklong_cms: cms,
      effective_at: eff.toISOString(), expires_at: exp ? exp.toISOString() : null,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidateTag("announcements", { expire: 0 });
  revalidatePath("/admin");
  revalidatePath("/news");
  revalidatePath("/");
  return { ok: "บันทึกประกาศแล้ว" };
}

export async function removeAnnouncement(form: FormData) {
  if (!(await isAdmin())) return;
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  await deleteAnnouncement(id);
  revalidateTag("announcements", { expire: 0 });
  revalidatePath("/admin");
  revalidatePath("/news");
  revalidatePath("/");
}
