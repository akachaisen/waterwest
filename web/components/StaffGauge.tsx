import { gaugeSvg } from "@/lib/gauge";

// ไม้วัดระดับน้ำพร้อมเส้นตลิ่งสีแดง (น้ำสีฟ้า — ระดับเตือนแสดงด้วยสีตัวอักษรข้าง ๆ)
export function StaffGauge({ wl, diffBank, size = "lg" }: { wl: number | null; diffBank: number | null; size?: "sm" | "lg" }) {
  const svg = gaugeSvg({ wl, diffBank, color: "var(--series-1)", size });
  if (!svg) return null;
  return <span className="inline-block shrink-0 text-text" dangerouslySetInnerHTML={{ __html: svg }} />;
}
