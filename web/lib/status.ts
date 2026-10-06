import type { Dam, Level, Station } from "./types";

export const STALE_MIN = 180;

export function classify(diff: number | null): { level: Level; label: string } {
  if (diff === null) return { level: "unknown", label: "ไม่มีข้อมูลตลิ่ง" };
  if (diff > 0) return { level: "red", label: "ล้นตลิ่ง" };
  if (diff > -1) return { level: "orange", label: "ใกล้ตลิ่ง" };
  return { level: "green", label: "ปกติ" };
}

const RANK: Record<Level, number> = { unknown: 0, green: 1, yellow: 2, orange: 3, red: 4 };
export const worst = (levels: Level[]): Level =>
  levels.reduce<Level>((a, b) => (RANK[b] > RANK[a] ? b : a), "unknown");

export const LEVEL_TEXT: Record<Level, string> = {
  red: "วิกฤต",
  orange: "เตือนภัย",
  yellow: "เฝ้าระวัง",
  green: "ปกติ",
  unknown: "ไม่มีข้อมูล",
};

// สถานะรวมของลุ่มน้ำ — ใช้สถานีหลักเป็นเกณฑ์ (ไม่นับข้อมูลเก่า)
export function overall(stations: Station[], dams: Dam[], maeklongQ: number | null): { level: Level; reasons: string[] } {
  const live = stations.filter((s) => !s.stale);
  const reasons: string[] = [];
  let level: Level = "green";
  const bump = (l: Level, why: string) => {
    reasons.push(why);
    level = worst([level, l]);
  };

  for (const s of live.filter((s) => s.isKey && s.level === "red")) {
    const rising = s.trend === "เพิ่มขึ้น";
    bump(rising ? "red" : "orange", `${s.name} สูงกว่าตลิ่ง ${fmt(s.diffBank, 2)} ม.${rising ? " และยังเพิ่มขึ้น" : ""}`);
  }
  if (maeklongQ !== null && maeklongQ > 3000) bump("red", `น้ำท้ายเขื่อนแม่กลอง ${fmt(maeklongQ)} ลบ.ม./วิ เกิน 3,000`);
  else if (maeklongQ !== null && maeklongQ > 2500) bump("orange", `น้ำท้ายเขื่อนแม่กลอง ${fmt(maeklongQ)} ลบ.ม./วิ เกิน 2,500`);
  const otherRed = live.filter((s) => !s.isKey && s.level === "red");
  if (otherRed.length) bump("yellow", `ล้นตลิ่ง ${otherRed.length} สถานี`);
  for (const d of dams.filter((d) => d.pct >= 98 && d.netMcm > 0))
    bump("yellow", `${d.name} ${fmt(d.pct, 1)}% น้ำเข้ามากกว่าระบาย`);
  return { level, reasons };
}

export function damDerived(r: {
  id: string; name: string; date: string; volume: number; normal_storage: number; pct: number; inflow_mcm: number; outflow_mcm: number;
}): Dam {
  const free = r.normal_storage - r.volume;
  const net = r.inflow_mcm - r.outflow_mcm;
  return {
    id: r.id,
    name: r.name,
    date: r.date,
    pct: r.pct,
    volume: r.volume,
    normalStorage: r.normal_storage,
    inflowMcm: r.inflow_mcm,
    outflowMcm: r.outflow_mcm,
    inflowCms: Math.round((r.inflow_mcm * 1e6) / 86400),
    outflowCms: Math.round((r.outflow_mcm * 1e6) / 86400),
    freeMcm: Math.round(free * 10) / 10,
    netMcm: Math.round(net * 100) / 100,
    daysToFull: net > 0 ? Math.round((free / net) * 10) / 10 : null,
  };
}

// ป้ายระดับของ ปภ. (cctv.disaster.go.th) — ข้อความทางการ ตามเกณฑ์ที่ ปภ. ตั้งไว้ของแต่ละสถานี
export const DDPM_SIGN: Record<number, { text: string; level: Level }> = {
  1: { text: "ติดตามข้อมูลข่าวสาร", level: "green" },
  2: { text: "เฝ้าระวังอย่างใกล้ชิด", level: "yellow" },
  3: { text: "เตรียมพร้อมรับมือสถานการณ์", level: "orange" },
  4: { text: "ให้อพยพและปฏิบัติตามแนวทางที่กำหนด", level: "red" },
  5: { text: "ต้องอพยพและปฏิบัติตามข้อสั่งการ", level: "red" },
};

// ทิศทางน้ำเทียบราว 1 ชม.ก่อน: ขึ้น/ลง เมื่อเปลี่ยนเกิน 2 ซม.
export const CHANGE_EPS = 0.02;
export function trendOf(change: number | null): string | null {
  if (change === null) return null;
  return change > CHANGE_EPS ? "เพิ่มขึ้น" : change < -CHANGE_EPS ? "ลดลง" : "ทรงตัว";
}

// สรุปทั้งลุ่มน้ำ: กี่สถานีน้ำขึ้น/ลง/ทรงตัว และกี่สถานีข้อมูลยังสด
export function changeSummary(stations: Station[]) {
  const live = stations.filter((x) => !x.stale);
  const cmp = live.filter((x) => x.change1h !== null);
  const n = (t: string) => cmp.filter((x) => trendOf(x.change1h) === t).length;
  return { total: stations.length, live: live.length, compared: cmp.length, up: n("เพิ่มขึ้น"), down: n("ลดลง"), flat: n("ทรงตัว") };
}

export function fmt(n: number | null | undefined, d = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function fmtSigned(n: number | null, d = 2): string {
  if (n === null) return "-";
  return `${n > 0 ? "+" : ""}${fmt(n, d)}`;
}

// ระดับเทียบตลิ่งเป็นภาษาชาวบ้าน (แทนตัวเลขติดลบ เช่น -1.33)
export function bankText(d: number | null | undefined, digits = 2): string {
  if (d === null || d === undefined || Number.isNaN(d)) return "ไม่มีค่าเทียบตลิ่ง";
  if (Math.abs(d) < 0.005) return "ระดับเท่าตลิ่ง";
  return d > 0 ? `สูงกว่าตลิ่ง ${fmt(d, digits)} ม.` : `ต่ำกว่าตลิ่ง ${fmt(-d, digits)} ม.`;
}

// การเปลี่ยนแปลงระดับน้ำเป็นคำพูด (เช่น "สูงขึ้น 0.12 ม.")
export function changeText(d: number | null | undefined, digits = 2): string {
  if (d === null || d === undefined || Number.isNaN(d)) return "-";
  if (Math.abs(d) < 0.005) return "เท่าเดิม";
  return d > 0 ? `สูงขึ้น ${fmt(d, digits)} ม.` : `ลดลง ${fmt(-d, digits)} ม.`;
}

// แนวโน้มเป็นคำพูด
export function trendText(trend: string | null | undefined): string | null {
  if (!trend) return null;
  return ({ เพิ่มขึ้น: "น้ำขึ้น", ลดลง: "น้ำลด", คงที่: "ทรงตัว", ทรงตัว: "ทรงตัว" } as Record<string, string>)[trend] ?? trend;
}

export function fmtTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }) + " น.";
}

export function fmtAge(min: number | null): string {
  if (min === null) return "";
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${Math.round(min)} นาทีก่อน`;
  const h = min / 60;
  if (h < 24) return `${fmt(h, h < 10 ? 1 : 0)} ชม.ก่อน`;
  return `${fmt(h / 24, 1)} วันก่อน`;
}
