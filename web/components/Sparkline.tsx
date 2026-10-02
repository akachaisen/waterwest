import type { Point } from "@/lib/history";

// เส้นแนวโน้มขนาดเล็ก (ไม่มีแกน) — เส้นสีจาง จุดท้ายเป็นสีสถานะ · เส้นบาง = ระดับตลิ่ง (0)
export function Sparkline({ points, color, width = 96, height = 28 }: { points: Point[]; color: string; width?: number; height?: number }) {
  const vals = points.filter((p): p is { t: number; v: number } => p.v !== null);
  if (vals.length < 2) return <span className="inline-block text-xs text-muted" style={{ width }}>-</span>;
  const min = Math.min(...vals.map((p) => p.v), 0);
  const max = Math.max(...vals.map((p) => p.v), 0);
  const t0 = vals[0].t;
  const t1 = vals[vals.length - 1].t;
  const x = (t: number) => 2 + ((t - t0) / (t1 - t0 || 1)) * (width - 6);
  const y = (v: number) => 2 + (1 - (v - min) / (max - min || 1)) * (height - 4);
  const d = vals.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  const last = vals[vals.length - 1];
  return (
    <svg width={width} height={height} aria-hidden className="shrink-0 overflow-visible">
      <line x1={0} x2={width} y1={y(0)} y2={y(0)} stroke="var(--border)" strokeWidth={1} />
      <path d={d} fill="none" stroke="var(--muted)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last.t)} cy={y(last.v)} r={3} fill={color} stroke="var(--surface)" strokeWidth={1.5} />
    </svg>
  );
}
