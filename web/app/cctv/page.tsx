import type { Metadata } from "next";
import { CAMERAS } from "@/lib/places";
import { CameraGrid } from "@/components/CameraGrid";

export const metadata: Metadata = { title: "กล้อง CCTV" };

export default function CctvPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">กล้อง CCTV</h1>
        <p className="mt-1 text-sm text-muted">
          ภาพจากกล้องของ กฟผ. ที่เขื่อนต้นน้ำ โหลดใหม่ทุก 1 นาที · เวลาที่ถ่ายดูได้จากตัวเลขบนภาพ · แตะภาพเพื่อเปิดขนาดเต็ม
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">เขื่อนวชิราลงกรณ · แม่น้ำแควน้อย</h2>
        <CameraGrid cameras={CAMERAS.filter((c) => c.dam === "VRK")} />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">เขื่อนศรีนครินทร์ · แม่น้ำแควใหญ่</h2>
        <CameraGrid cameras={CAMERAS.filter((c) => c.dam === "SNR")} />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 text-sm">
        <h2 className="font-semibold">กล้องในพื้นที่ราชบุรี / สมุทรสงคราม</h2>
        <p className="mt-1 text-muted">
          ยังไม่พบกล้องสาธารณะที่เปิดให้ดึงภาพได้ในตัวเมืองราชบุรีและริมแม่กลองตอนล่าง (ตรวจแล้วจาก Longdo Camera และ ThaiWater) ·
          ถ้าเทศบาลหรือจังหวัดเปิดให้ใช้ จะเพิ่มในหน้านี้
        </p>
        <ul className="mt-2 space-y-1 text-muted">
          <li>
            ·{" "}
            <a href="https://vrkdam.egat.co.th/index.php" target="_blank" rel="noopener noreferrer" className="text-accent underline">
              เว็บไซต์เขื่อนวชิราลงกรณ
            </a>{" "}
            มีกล้องสันเขื่อนและท้ายน้ำเพิ่มเติม
          </li>
          <li>
            ·{" "}
            <a href="https://cctv.maholan.net/" target="_blank" rel="noopener noreferrer" className="text-accent underline">
              รวมกล้อง CCTV ทั่วไทย (cctv.maholan.net)
            </a>
          </li>
        </ul>
      </section>

      <p className="text-xs text-muted">ภาพเป็นของ การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย (กฟผ.) แสดงเพื่อการติดตามสถานการณ์น้ำ</p>
    </div>
  );
}
