import type { Metadata } from "next";
import { PRESETS, TAMBONS } from "@/lib/area";
import { AreaPicker } from "@/components/AreaPicker";

export const metadata: Metadata = { title: "พื้นที่ของฉัน" };

export default function AreaIndex() {
  const tambons = TAMBONS.map(({ id, t, te, a, p }) => ({ id, t, te, a, p }));
  const presets = PRESETS.map((p) => {
    const t = TAMBONS.find((x) => x.id === p.tambonId)!;
    return { slug: p.slug, name: p.name, sub: `ต.${t.t} อ.${t.a}` };
  });
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">พื้นที่ของฉัน</h1>
        <p className="mt-1 text-sm text-muted">
          เลือกพื้นที่เพื่อดูความเสี่ยง สถานีวัดน้ำใกล้สุด เวลาที่มวลน้ำจะมาถึง และฝน · ครอบคลุม {TAMBONS.length} ตำบล ในกาญจนบุรี ราชบุรี สมุทรสงคราม และ อ.บ้านแพ้ว
        </p>
      </div>
      <AreaPicker tambons={tambons} presets={presets} />
      <p className="text-xs text-muted">ข้อมูลตำบล: UN OCHA COD-AB (อ้างอิงเขตการปกครองของรัฐบาลไทย) · เส้นแม่น้ำ: © OpenStreetMap</p>
    </div>
  );
}
