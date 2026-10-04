import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// ล็อกอินหลังบ้านด้วยรหัสผ่านเดียว (ADMIN_PASSWORD ตั้งในเซิร์ฟเวอร์) → คุกกี้ที่เซ็นด้วย HMAC อายุ 12 ชม.
const COOKIE = "ww_admin";
const TTL_S = 12 * 3600;

const secret = () => process.env.ADMIN_PASSWORD ?? "";
export const adminEnabled = () => secret().length >= 8;

function sign(exp: number) {
  return createHmac("sha256", secret()).update(`waterwest-admin:${exp}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function passwordMatches(input: string) {
  if (!adminEnabled()) return false;
  // เทียบแบบเวลาคงที่ผ่าน HMAC เพื่อไม่ให้ความยาวรหัสรั่ว
  const h = (s: string) => createHmac("sha256", "waterwest-pw").update(s).digest("hex");
  return safeEqual(h(input), h(secret()));
}

export async function setSession() {
  const exp = Math.floor(Date.now() / 1000) + TTL_S;
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: TTL_S,
  });
}

export async function clearSession() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}

export async function isAdmin(): Promise<boolean> {
  if (!adminEnabled()) return false;
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const [expStr, sig] = v.split(".");
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now() || !sig) return false;
  return safeEqual(sig, sign(exp));
}
