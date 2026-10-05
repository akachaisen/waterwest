// โครงผังเส้นทางน้ำ: ลำดับสถานีและระยะทางตามลำน้ำจากเขื่อนแม่กลอง (กม. โดยประมาณ)

export const SEGMENTS: Record<string, string> = {
  A: "แควน้อย ท้ายเขื่อนวชิราลงกรณ",
  B: "แควใหญ่ ท้ายเขื่อนศรีนครินทร์",
  C: "จุดรวมแม่น้ำ จ.กาญจนบุรี",
  E: "เขื่อนแม่กลอง – บ้านโป่ง – โพธาราม – ราชบุรี",
  F: "สมุทรสงคราม – ปากอ่าวไทย",
};

export const KHWAE_NOI = ["MKVKD01", "MKVKD02", "K.54", "K.58", "K.10", "K.37"];
export const KHWAE_YAI = ["K.35A", "K.12"];
export const CONFLUENCE = ["K.3A", "MKSND03"];
export const LOWER = ["K.11A", "K.55A", "RAJ002", "K.56A", "RAJ001", "K.2B", "K.57", "TK.72", "TK.74", "MKG006", "PTT002"];

// ระยะตามลำน้ำจากเขื่อนแม่กลอง (กม.) — วัดจากเส้นแม่น้ำแม่กลองใน OpenStreetMap (web/data/rivers.json)
export const KM_FROM_MAEKLONG_DAM: Record<string, number> = {
  "K.11A": 3.9,
  RAJ002: 45.3,
  "K.55A": 47,
  "K.56A": 56,
  RAJ001: 70.9,
  "K.2B": 83.4,
  "K.57": 98.7,
  "TK.72": 100.4,
  "TK.74": 117.2,
  MKG006: 121.8,
  PTT002: 124.2,
};
export const MOUTH_KM = 126.5;

// สถานีที่อยู่บนคลอง ไม่ใช่แม่น้ำสายหลัก (ห่างแม่น้ำแม่กลองหลายกิโลเมตร)
export const CANAL_STATIONS = new Set(["TK.74", "PTT002"]);

// เวลาเดินทางของมวลน้ำจากเขื่อนแม่กลอง (ชม.) — ปรับ 5 ต.ค. 2569 จากยอดน้ำ 11 ครั้ง ก.ค.–ต.ค. 2569 (node ingest/calibrate.mjs 90):
//  - บ้านโป่ง 47 กม.: ค่ากลาง 10 ชม. (ช่วงที่พบบ่อย 10–12)
//  - โพธาราม 71 กม.: ค่ากลาง 15 ชม. (ช่วงที่พบบ่อย 11–20 · สถานี RAJ001 สัญญาณรบกวนมาก)
//  - ราชบุรี 83 กม.: 17 ชม. = ตัวเลขทางการ และตรงกับความเร็วช่วงบ้านโป่ง–โพธาราม (K.2B ไม่มีใน ThaiWater จึงยังวัดตรงไม่ได้)
//  - ปากอ่าว 127 กม.: 28 ชม. ตัวเลขทางการ (ช่วงล่างน้ำทะเลหนุน วัดจากข้อมูลไม่ได้)
export const OFFICIAL_RATCHABURI_H = 17;
export const CALIBRATION = { date: "5 ต.ค. 2569", events: 11, period: "ก.ค.–ต.ค. 2569" };
export const TRAVEL_STATS = [
  { name: "บ้านโป่ง (K.55A)", km: 47, median: 10, range: "10–12", all: "8–21" },
  { name: "โพธาราม (RAJ001)", km: 71, median: 15, range: "11–20", all: "5–38" },
];
export const TRAVEL_ANCHORS: [number, number][] = [
  [0, 0],
  [47, 10],
  [71, 15],
  [83.4, OFFICIAL_RATCHABURI_H],
  [MOUTH_KM, 28],
];

export function travelHours(km: number): number {
  const a = TRAVEL_ANCHORS;
  if (km <= 0) return 0;
  for (let i = 1; i < a.length; i++) {
    if (km <= a[i][0]) return a[i - 1][1] + ((km - a[i - 1][0]) / (a[i][0] - a[i - 1][0])) * (a[i][1] - a[i - 1][1]);
  }
  return a[a.length - 1][1];
}

export const TRIBUTARY = new Set(["K.12"]);
