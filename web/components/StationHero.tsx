import { bankText, changeText, fmt, fmtAge, fmtTime } from "@/lib/status";
import type { Station } from "@/lib/types";
import { StaffGauge } from "./StaffGauge";
import { DdpmSign, levelText } from "./ui";
import { ShareLinks } from "./ShareLinks";

export type HeroStation = Pick<
  Station,
  "code" | "name" | "wl" | "diffBank" | "level" | "stale" | "change1h" | "change24h" | "time" | "ageMin" | "sign" | "q"
>;

// ส่วนบนของหน้าสถานี: ไม้วัด + ตัวเลขใหญ่เทียบตลิ่ง + การเปลี่ยนแปลง + ปุ่มแชร์ (ใช้ทั้งหน้าสถานีและแผงข้างแผนที่)
export function StationHero({ s, share = true, showQ = true }: { s: HeroStation; share?: boolean; showQ?: boolean }) {
  const tone = s.stale ? "text-muted" : levelText(s.level);
  const bank = s.wl !== null && s.diffBank !== null ? s.wl - s.diffBank : null;
  const changes = [
    s.change24h !== null && `${changeText(s.change24h)} ใน 24 ชม.`,
    s.change1h !== null && `${changeText(s.change1h)} ใน 1 ชม.`,
  ].filter(Boolean);
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-4">
        <StaffGauge wl={s.wl} diffBank={s.diffBank} />
        <div className="min-w-0">
          <p className={`text-2xl font-bold leading-tight sm:text-3xl ${tone}`}>{bankText(s.diffBank)}</p>
          {changes.length > 0 && <p className="tnum mt-1.5 text-sm">{changes.join(" · ")}</p>}
          {showQ && s.q !== null && <p className="tnum text-sm">ปริมาณน้ำ {fmt(s.q)} ลบ.ม./วิ</p>}
          <p className="tnum mt-1 text-xs text-muted">
            {s.wl !== null && `ระดับน้ำ ${fmt(s.wl, 2)} ม.รทก.`}
            {bank !== null && ` · ตลิ่ง ${fmt(bank, 2)} ม.รทก.`}
            {s.wl !== null && <br />}
            <span className={s.stale ? "font-semibold text-orange" : ""}>
              วัดเมื่อ {fmtTime(s.time)}
              {s.ageMin !== null && ` · ${fmtAge(s.ageMin)}`}
              {s.stale && " (ข้อมูลเก่า)"}
            </span>
          </p>
        </div>
      </div>
      {!s.stale && s.sign ? (
        <div className="mt-3">
          <DdpmSign sign={s.sign} />
        </div>
      ) : null}
      {share && (
        <div className="mt-3">
          <ShareLinks href={`/stations/${encodeURIComponent(s.code)}`} text={`ระดับน้ำ ${s.name} (${s.code}) ${bankText(s.diffBank)} · วัดเมื่อ ${fmtTime(s.time)}`} />
        </div>
      )}
    </section>
  );
}
