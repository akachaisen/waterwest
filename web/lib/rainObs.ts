// ฝนวัดจริง 24 ชม. จากสถานีวัดฝนในลุ่มน้ำแม่กลอง — Edge Function บันทึกในตาราง rain_obs ชั่วโมงละครั้ง
// (กลุ่มพื้นที่ตรงกับ ingest/rainobs.mjs RAIN_GROUPS)

export const RAIN_OBS_GROUPS = [
  { id: "khwaeyai", name: "แควใหญ่ตอนบน", area: "อุ้มผาง–ศรีสวัสดิ์ · ไหลลงอ่างศรีนครินทร์", upstream: true },
  { id: "khwaenoi_up", name: "แควน้อยตอนบน", area: "สังขละบุรี–ทองผาภูมิ · ไหลลงอ่างวชิราลงกรณ", upstream: true },
  { id: "taphoen", name: "ลำตะเพิน", area: "ด่านช้าง–บ่อพลอย · เข้าแควใหญ่ท้ายเขื่อน", upstream: false },
  { id: "khwaenoi_low", name: "แควน้อยตอนล่าง", area: "ทองผาภูมิ–ไทรโยค · ท้ายเขื่อนวชิราลงกรณ", upstream: false },
  { id: "lower", name: "กาญจนบุรี–ราชบุรี–สมุทรสงคราม", area: "ท้ายเขื่อนแม่กลองถึงปากอ่าว", upstream: false },
] as const;
export const HEAVY_MM = 35;
export const VERY_HEAVY_MM = 90;

export type RainObsStation = { station_id: number; name: string; amphoe: string; province: string; agency: string; grp: string; mm_24h: number; measured_at: string; checked_at: string };
export type RainObsGroup = (typeof RAIN_OBS_GROUPS)[number] & { stations: RainObsStation[]; max: RainObsStation | null; heavy: number };
export type RainObs = { checkedAt: string | null; groups: RainObsGroup[]; top: RainObsStation[] };

export async function getRainObs(): Promise<RainObs | null> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/rain_obs?select=*&order=mm_24h.desc`, { headers: { apikey: key }, next: { revalidate: 300 } });
    if (!res.ok) return null;
    const rows = ((await res.json()) as RainObsStation[]).map((r) => ({ ...r, mm_24h: Number(r.mm_24h) }));
    const marker = rows.find((r) => r.station_id === 0);
    const st = rows.filter((r) => r.station_id !== 0);
    if (!marker) return null; // ยังไม่เคยตรวจ
    const groups = RAIN_OBS_GROUPS.map((g) => {
      const a = st.filter((r) => r.grp === g.id);
      return { ...g, stations: a, max: a[0] ?? null, heavy: a.filter((r) => r.mm_24h >= HEAVY_MM).length };
    });
    return { checkedAt: marker.checked_at, groups, top: st.slice(0, 5) };
  } catch {
    return null;
  }
}
