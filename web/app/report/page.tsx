import type { Metadata } from "next";
import Link from "next/link";
import { PRESETS } from "@/lib/area";

export const metadata: Metadata = { title: "รายงานภาพ A4" };

export default function ReportIndex() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold sm:text-2xl">รายงานภาพ A4</h1>
      <p className="text-sm text-muted">
        เลือกพื้นที่เพื่อสร้างรายงาน 1 หน้า A4 (ดาวน์โหลดเป็นรูป หรือพิมพ์/บันทึก PDF) · พื้นที่อื่นสร้างได้จากปุ่ม &quot;รายงานภาพ A4&quot; ในหน้า{" "}
        <Link href="/area" className="text-accent underline">พื้นที่ของฉัน</Link>
      </p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Link key={p.slug} href={`/report/${p.slug}`} className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-accent hover:text-accent">
            {p.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
