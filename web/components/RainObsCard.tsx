import { fmt, fmtTime } from "@/lib/status";
import { HEAVY_MM, VERY_HEAVY_MM, type RainObs } from "@/lib/rainObs";
import { Card, SectionTitle } from "@/components/ui";

const tone = (mm: number) => (mm >= VERY_HEAVY_MM ? "text-red" : mm >= HEAVY_MM ? "text-orange" : "");

// ฝนวัดได้จริง 24 ชม. รายกลุ่มพื้นที่ (ต้นน้ำ → ปลายน้ำ) · compact = ไม่แสดงรายชื่อสถานีที่ฝนมากสุด
export function RainObsCard({ obs, compact = false }: { obs: RainObs | null; compact?: boolean }) {
  return (
    <Card>
      <SectionTitle hint={obs?.checkedAt ? `สถานีวัดฝน · ตรวจ ${fmtTime(obs.checkedAt)}` : "สถานีวัดฝน"}>ฝนวัดได้จริง 24 ชม.</SectionTitle>
      {!obs ? (
        <p className="text-sm text-muted">ยังไม่มีข้อมูล (ระบบดึงชั่วโมงละครั้ง)</p>
      ) : (
        <>
          <ul className="divide-y divide-border text-sm">
            {obs.groups.map((g) => (
              <li key={g.id} className="flex items-baseline justify-between gap-3 py-1.5">
                <span className="min-w-0">
                  {g.name}
                  {g.upstream && <span className="ml-1 rounded bg-accent/10 px-1 text-[0.65rem] text-accent">เหนืออ่าง</span>}
                  <span className="block text-xs text-muted">{g.area}</span>
                </span>
                <span className="shrink-0 text-right">
                  {g.max ? (
                    <>
                      <b className={`tnum ${tone(g.max.mm_24h)}`}>{fmt(g.max.mm_24h, 1)}</b> <span className="text-xs text-muted">มม.</span>
                      <span className="block text-xs text-muted">
                        อ.{g.max.amphoe} · {g.stations.length} สถานีมีฝน{g.heavy ? ` · หนัก ${g.heavy}` : ""}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted">ไม่มีฝน</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {!compact && obs.top.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-medium text-muted">สถานีที่ฝนมากที่สุด</p>
              <ul className="space-y-0.5 text-xs">
                {obs.top.map((r) => (
                  <li key={r.station_id} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">
                      {r.name} <span className="text-muted">อ.{r.amphoe} จ.{r.province} · {r.agency}</span>
                    </span>
                    <span className="tnum shrink-0">
                      <b className={tone(r.mm_24h)}>{fmt(r.mm_24h, 1)}</b> มม. <span className="text-muted">({fmtTime(r.measured_at)})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-2 text-xs text-muted">
            ค่าสูงสุดของสถานีในแต่ละพื้นที่ (ฝนสะสม 24 ชม.) · ฝนหนัก ≥ {HEAVY_MM} มม. · หนักมาก ≥ {VERY_HEAVY_MM} มม. · ข้อมูลรวมหลายหน่วยงานผ่าน ThaiWater (สสน.) · ฝนหนักเหนืออ่างจะขึ้นสถานะเฝ้าระวัง
          </p>
        </>
      )}
    </Card>
  );
}
