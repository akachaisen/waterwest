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

export const KM_FROM_MAEKLONG_DAM: Record<string, number> = {
  "K.11A": 3,
  RAJ002: 30,
  "K.55A": 32,
  "K.56A": 47,
  RAJ001: 50,
  "K.2B": 70,
  "K.57": 92,
  "TK.72": 95,
  "TK.74": 112,
  MKG006: 115,
  PTT002: 118,
};
export const MOUTH_KM = 122;

// เวลาเดินทางของมวลน้ำจากเขื่อนแม่กลอง (ชม.) — จุดยึด:
//  - บ้านโป่ง 32 กม. ~8 ชม. และโพธาราม 50 กม. ~11 ชม. : จากข้อมูลจริงเหตุการณ์ 30 ก.ย.–1 ต.ค. 2569 (ยอดน้ำ K.11A → K.55A → RAJ001)
//  - ราชบุรี 70 กม. ~17 ชม. และปากอ่าว 122 กม. ~28 ชม. : ตัวเลขทางการ (กรมชลประทาน)
export const TRAVEL_ANCHORS: [number, number][] = [
  [0, 0],
  [32, 8],
  [50, 11],
  [70, 17],
  [MOUTH_KM, 28],
];

export function travelHours(km: number): number {
  const a = TRAVEL_ANCHORS;
  for (let i = 1; i < a.length; i++) {
    if (km <= a[i][0]) return a[i - 1][1] + ((km - a[i - 1][0]) / (a[i][0] - a[i - 1][0])) * (a[i][1] - a[i - 1][1]);
  }
  return a[a.length - 1][1];
}

export const TRIBUTARY = new Set(["K.12"]);
