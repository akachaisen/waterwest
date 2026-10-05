import "server-only";

// โควตาข้อความ LINE ของเดือนนี้ — Edge Function บันทึกไว้ในตาราง line_quota (อ่านด้วย secret key เฉพาะหน้าหลังบ้าน)

export type LineQuota = {
  month: string;
  quota: number | null;
  used: number;
  reach: number | null;
  followers: number | null;
  warned: number;
  checked_at: string;
};

export async function latestLineQuota(): Promise<LineQuota | null> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  const headers: Record<string, string> = { apikey: key };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  try {
    const res = await fetch(`${url}/rest/v1/line_quota?select=*&order=month.desc&limit=1`, { headers, cache: "no-store" });
    if (!res.ok) return null;
    const [row] = (await res.json()) as LineQuota[];
    return row ?? null;
  } catch {
    return null;
  }
}
