export type Level = "red" | "orange" | "yellow" | "green" | "unknown";

export type Station = {
  code: string;
  name: string;
  seg: string;
  isKey: boolean;
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
