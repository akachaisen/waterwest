import type { Level } from "@/lib/types";
import { DDPM_SIGN, fmtAge, fmtTime, LEVEL_TEXT } from "@/lib/status";

const TEXT: Record<Level, string> = {
  red: "text-red",
  orange: "text-orange",
  yellow: "text-yellow",
  green: "text-green",
  unknown: "text-unknown",
};
const BG: Record<Level, string> = {
  red: "bg-red-bg",
  orange: "bg-orange-bg",
  yellow: "bg-yellow-bg",
  green: "bg-green-bg",
  unknown: "bg-unknown-bg",
};
const DOT: Record<Level, string> = {
  red: "bg-red",
  orange: "bg-orange",
  yellow: "bg-yellow",
  green: "bg-green",
  unknown: "bg-unknown",
};

export const levelText = (l: Level) => TEXT[l];
export const levelBg = (l: Level) => BG[l];
export const levelDot = (l: Level) => DOT[l];

export function Badge({ level, children }: { level: Level; children?: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${BG[level]} ${TEXT[level]}`}>
      <span className={`size-1.5 rounded-full ${DOT[level]}`} aria-hidden />
      {children ?? LEVEL_TEXT[level]}
    </span>
  );
}

// ป้ายระดับของ ปภ. — ข้อความทางการของสถานี ปภ. (KRIxx)
export function DdpmSign({ sign, compact = false }: { sign: number | null | undefined; compact?: boolean }) {
  const s = sign ? DDPM_SIGN[sign] : undefined;
  if (!s) return null;
  return (
    <p className={`rounded-lg ${compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"} ${BG[s.level]}`}>
      <span className="text-muted">ป้ายระดับของ ปภ.: </span>
      <b className={TEXT[s.level]}>{s.text}</b>
    </p>
  );
}

export function Trend({ trend }: { trend: string | null }) {
  if (!trend) return null;
  const map: Record<string, [string, string]> = {
    เพิ่มขึ้น: ["▲", "น้ำขึ้น"],
    ลดลง: ["▼", "น้ำลด"],
    คงที่: ["▬", "ทรงตัว"],
    ทรงตัว: ["▬", "ทรงตัว"],
  };
  const [icon, label] = map[trend] ?? ["", trend];
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted">
      <span aria-hidden className="text-[0.6rem]">{icon}</span>
      {label}
    </span>
  );
}

export function Measured({ time, ageMin, stale }: { time: string | null; ageMin?: number | null; stale?: boolean }) {
  return (
    <span className={`text-xs ${stale ? "font-semibold text-orange" : "text-muted"}`}>
      วัดเมื่อ {fmtTime(time)}
      {ageMin !== undefined && ageMin !== null && ` · ${fmtAge(ageMin)}`}
      {stale && " · ข้อมูลเก่า"}
    </span>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-border bg-surface p-4 ${className}`}>{children}</section>;
}

export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-2">
      <h2 className="text-base font-semibold">{children}</h2>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

// แถบเทียบค่ากับเกณฑ์ (เช่น ปริมาณน้ำเทียบความจุลำน้ำ)
export function Meter({ value, max, level }: { value: number; max: number; level: Level }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2" role="presentation">
      <div className={`h-full rounded-full ${DOT[level]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
