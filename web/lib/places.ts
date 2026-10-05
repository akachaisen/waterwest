// จุดคงที่บนแผนที่: เขื่อน กล้อง CCTV และพื้นที่ที่ติดตาม

// LINE Official Account สำหรับรับแจ้งเตือน (ID สาธารณะ ไม่ใช่ความลับ)
export const LINE_OA_ID = "@waterwest"; // Premium ID (ซื้อ 5 ต.ค. 2569) · ID เดิม @834fsaeo ยังใช้ได้

export type Camera = {
  id: string;
  dam: "VRK" | "SNR";
  name: string;
  note?: string;
  src: string;
};

// ภาพนิ่งจาก กฟผ. อัปเดตทุกไม่กี่นาที (ภาพมีเวลาประทับในตัว)
export const CAMERAS: Camera[] = [
  { id: "vrk-dam", dam: "VRK", name: "สันเขื่อนและอาคารรับน้ำ", src: "https://egatwater.egat.co.th/assets/CCTV/images/VRK/1.jpg" },
  { id: "vrk-spill", dam: "VRK", name: "ประตูระบายน้ำล้น (Spillway)", note: "ดูว่าเปิดระบายน้ำล้นหรือไม่", src: "https://egatwater.egat.co.th/assets/CCTV/images/VRK/3.jpg" },
  { id: "vrk-spillout", dam: "VRK", name: "ทางน้ำล้นด้านท้าย", src: "https://egatwater.egat.co.th/assets/CCTV/images/VRK/4.jpg" },
  { id: "vrk-river", dam: "VRK", name: "ท้ายโรงไฟฟ้า แม่น้ำแควน้อย", note: "ระดับน้ำที่ปล่อยลงแควน้อย", src: "https://egatwater.egat.co.th/assets/CCTV/images/VRK/2.jpg" },
  { id: "snr-gauge", dam: "SNR", name: "เสาวัดระดับน้ำหน้าเขื่อน", note: "ตัวเลขบนเสา = ระดับน้ำ ม.รทก.", src: "https://egatwater.egat.co.th/assets/CCTV/images/SNR/4.jpg" },
  { id: "snr-crest", dam: "SNR", name: "สันเขื่อนศรีนครินทร์", src: "https://egatwater.egat.co.th/assets/CCTV/images/SNR/1.jpg" },
  { id: "snr-plant", dam: "SNR", name: "โรงไฟฟ้าและท้ายเขื่อน", src: "https://egatwater.egat.co.th/assets/CCTV/images/SNR/2.jpg" },
];

export type Place = { id: string; name: string; lat: number; lon: number; kind: "dam" | "home" | "mouth"; note?: string; damId?: string; approx?: boolean };

export const PLACES: Place[] = [
  { id: "vrk", name: "เขื่อนวชิราลงกรณ", lat: 14.7975, lon: 98.6041, kind: "dam", damId: "200402" },
  { id: "snr", name: "เขื่อนศรีนครินทร์", lat: 14.4, lon: 99.1207, kind: "dam", damId: "200401" },
  { id: "ttn", name: "เขื่อนท่าทุ่งนา", lat: 14.2338, lon: 99.235, kind: "dam", note: "เขื่อนท้ายศรีนครินทร์ (กฟผ.)" },
  { id: "mk", name: "เขื่อนแม่กลอง (ท่าม่วง)", lat: 13.9712, lon: 99.6296, kind: "dam", note: "จุดเริ่มนับเวลาเดินทางของมวลน้ำ" },
  { id: "chedihak", name: "บ้านเจดีย์หัก (หมู่ 3) ต.เจดีย์หัก", lat: 13.543, lon: 99.7984, kind: "home", note: "พื้นที่ที่ติดตาม · หมุดที่โบราณสถานเจดีย์หัก (ไม่ใช่บ้านเลขที่)" },
  { id: "mouth", name: "ปากแม่น้ำแม่กลอง · อ่าวไทย", lat: 13.357, lon: 99.997, kind: "mouth", approx: true },
];
