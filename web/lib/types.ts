export type Level = "red" | "orange" | "yellow" | "green" | "unknown";

export type Station = {
  code: string;
  name: string;
  seg: string;
  isKey: boolean;
  lat: number | null;
  lon: number | null;
  source: string | null;
  time: string | null; // ISO เวลาวัด
  ageMin: number | null;
  stale: boolean;
  wl: number | null;
  diffBank: number | null; // + = สูงกว่าตลิ่ง
  q: number | null;
  capacity: number | null;
  qPct: number | null;
  trend: string | null;
  sign: number | null; // ป้ายระดับของ ปภ. 1–5
  change1h: number | null; // ระดับเปลี่ยนจากราว 1 ชม.ก่อน (ม.)
  change24h: number | null; // ระดับเปลี่ยนจาก 24 ชม.ก่อน (ค่าเฉลี่ยรายชั่วโมง)
  level: Level;
  label: string;
};

export type Dam = {
  id: string;
  name: string;
  date: string;
  pct: number;
  volume: number;
  normalStorage: number;
  inflowMcm: number;
  outflowMcm: number;
  inflowCms: number;
  outflowCms: number;
  freeMcm: number;
  netMcm: number;
  daysToFull: number | null;
};

export type Alert = { level: string; text: string };

export type RainPoint = { id: string; name: string; days: { date: string; mm: number | null; prob: number | null }[] };

export type Snapshot = {
  origin: "file" | "supabase";
  generatedAt: string;
  stations: Station[];
  dams: Dam[];
  maeklongQ: { q: number; time: string | null } | null;
  alerts: Alert[];
  rain: RainPoint[];
  seaPeak: { m: number; time: string } | null;
  sources: Record<string, string>;
};
