"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type Series = {
  key: string;
  name: string;
  color: string; // CSS color (ใช้ตัวแปร --series-*)
  points: [number, number | null][]; // [เวลา ms, ค่า]
};
export type RefLine = { y: number; label: string; color: string };

type Props = {
  title: string;
  series: Series[];
  refs?: RefLine[];
  unit: string;
  decimals?: number;
  height?: number;
  daily?: boolean; // ข้อมูลรายวัน (แกน X เป็นวันที่)
  signed?: boolean; // แสดง + หน้าค่าบวก
};

const M = { l: 52, r: 56, t: 14, b: 28 };
const TZ = "Asia/Bangkok";

function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) { min -= 1; max += 1; }
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) out.push(+v.toFixed(10));
  return out;
}

const fmtNum = (v: number, d: number, signed?: boolean) =>
  `${signed && v > 0 ? "+" : ""}${v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const fmtX = (t: number, daily?: boolean) =>
  new Date(t).toLocaleString("th-TH", daily ? { timeZone: TZ, day: "numeric", month: "short" } : { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function LineChart({ title, series, refs = [], unit, decimals = 0, height = 220, daily, signed }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const times = useMemo(() => [...new Set(series.flatMap((s) => s.points.map((p) => p[0])))].sort((a, b) => a - b), [series]);
  const values = series.flatMap((s) => s.points.map((p) => p[1])).filter((v): v is number => v !== null);

  if (!times.length || !values.length) {
    return <p className="rounded-xl bg-surface-2 p-4 text-sm text-muted">ยังไม่มีข้อมูลย้อนหลังสำหรับ{title}</p>;
  }

  const yMin0 = Math.min(...values, ...refs.map((r) => r.y));
  const yMax0 = Math.max(...values, ...refs.map((r) => r.y));
  const pad = (yMax0 - yMin0) * 0.08 || 1;
  const ticks = niceTicks(yMin0 - pad, yMax0 + pad);
  const yMin = Math.min(ticks[0], yMin0);
  const yMax = Math.max(ticks[ticks.length - 1], yMax0);
  const t0 = times[0];
  const t1 = times[times.length - 1] === t0 ? t0 + 1 : times[times.length - 1];
  const iw = width - M.l - M.r;
  const ih = height - M.t - M.b;
  const x = (t: number) => M.l + ((t - t0) / (t1 - t0)) * iw;
  const y = (v: number) => M.t + (1 - (v - yMin) / (yMax - yMin)) * ih;

  // เส้นแบ่งวัน (เที่ยงคืนเวลาไทย) สำหรับแกน X
  const xTicks: number[] = [];
  const dayMs = 86400e3;
  const tzOffset = 7 * 3600e3;
  const spanDays = (t1 - t0) / dayMs;
  const every = Math.max(1, Math.ceil(spanDays / (width < 480 ? 4 : 7)));
  for (let d = Math.ceil((t0 + tzOffset) / dayMs) * dayMs - tzOffset; d <= t1; d += dayMs * every) xTicks.push(d);

  const path = (pts: [number, number | null][]) => {
    let d = "";
    let pen = false;
    for (const [t, v] of pts) {
      if (v === null) { pen = false; continue; }
      d += `${pen ? "L" : "M"}${x(t).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    }
    return d;
  };

  const lastOf = (s: Series) => [...s.points].reverse().find((p) => p[1] !== null) as [number, number] | undefined;
  const at = (s: Series, t: number) => s.points.find((p) => p[0] === t)?.[1] ?? null;

  // ป้ายชื่อท้ายเส้น: ดันให้ห่างกันอย่างน้อย 12px ไม่ให้ซ้อนกัน
  const labelY = new Map<string, number>();
  const ends = series
    .map((s) => ({ key: s.key, last: lastOf(s) }))
    .filter((e): e is { key: string; last: [number, number] } => !!e.last)
    .map((e) => ({ key: e.key, y: y(e.last[1]) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 0; i < ends.length; i++) {
    if (i > 0 && ends[i].y - ends[i - 1].y < 12) ends[i].y = ends[i - 1].y + 12;
    labelY.set(ends[i].key, Math.min(ends[i].y, M.t + ih + 6));
  }

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * iw;
    const t = t0 + (px / iw) * (t1 - t0);
    let best = 0;
    for (let i = 1; i < times.length; i++) if (Math.abs(times[i] - t) < Math.abs(times[best] - t)) best = i;
    setHover(best);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setHover((h) => {
      const cur = h ?? times.length - 1;
      return Math.max(0, Math.min(times.length - 1, cur + (e.key === "ArrowRight" ? 1 : -1)));
    });
  };

  const ht = hover !== null ? times[hover] : null;
  const tipLeft = ht !== null ? Math.min(Math.max(x(ht), 90), width - 90) : 0;

  return (
    <figure className="space-y-2">
      {series.length > 1 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="คำอธิบายเส้น">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} aria-hidden />
              {s.name}
            </li>
          ))}
        </ul>
      )}
      <div ref={wrap} className="relative">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`กราฟ${title} (ใช้ลูกศรซ้าย/ขวาเพื่อดูค่า)`}
          tabIndex={0}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
          className="block max-w-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {ticks.map((v) => (
            <g key={v}>
              <line x1={M.l} x2={width - M.r} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={1} />
              <text x={M.l - 6} y={y(v)} dy="0.32em" textAnchor="end" className="fill-muted text-[10px] tnum">
                {fmtNum(v, Math.abs(ticks[1] - ticks[0]) < 1 ? Math.max(decimals, 1) : 0, signed)}
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <text key={t} x={x(t)} y={height - 8} textAnchor="middle" className="fill-muted text-[10px]">
              {new Date(t).toLocaleDateString("th-TH", { timeZone: TZ, day: "numeric", month: "short" })}
            </text>
          ))}
          {refs.map((r) => (
            <g key={r.label}>
              <line x1={M.l} x2={width - M.r} y1={y(r.y)} y2={y(r.y)} stroke={r.color} strokeWidth={1.5} />
              <text x={width - M.r + 4} y={y(r.y)} dy="0.32em" className="fill-text text-[10px] font-medium">
                {r.label}
              </text>
            </g>
          ))}
          {series.map((s) => (
            <path key={s.key} d={path(s.points)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {series.map((s) => {
            const last = lastOf(s);
            if (!last) return null;
            return (
              <g key={s.key}>
                <circle cx={x(last[0])} cy={y(last[1])} r={4} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
                {series.length > 1 && (
                  <text x={x(last[0]) + 8} y={labelY.get(s.key)} dy="0.32em" className="fill-text text-[10px] font-medium">
                    {s.name}
                  </text>
                )}
              </g>
            );
          })}
          {ht !== null && (
            <g pointerEvents="none">
              <line x1={x(ht)} x2={x(ht)} y1={M.t} y2={M.t + ih} stroke="var(--muted)" strokeWidth={1} />
              {series.map((s) => {
                const v = at(s, ht);
                return v === null ? null : <circle key={s.key} cx={x(ht)} cy={y(v)} r={4} fill={s.color} stroke="var(--surface)" strokeWidth={2} />;
              })}
            </g>
          )}
          <rect
            x={M.l}
            y={M.t}
            width={iw}
            height={ih}
            fill="transparent"
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
        {ht !== null && (
          <div
            className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-md"
            style={{ left: tipLeft }}
            role="status"
          >
            <div className="text-muted">{fmtX(ht, daily)}</div>
            {series.map((s) => {
              const v = at(s, ht);
              return (
                <div key={s.key} className="flex items-center gap-1.5">
                  <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} aria-hidden />
                  <span className="tnum font-semibold text-text">{v === null ? "-" : fmtNum(v, decimals, signed)}</span>
                  <span className="text-muted">{unit}{series.length > 1 ? ` · ${s.name}` : ""}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-muted hover:text-text">ดูเป็นตาราง</summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-border">
          <table className="tnum w-full">
            <thead className="sticky top-0 bg-surface-2 text-muted">
              <tr>
                <th className="px-2 py-1 text-left font-medium">เวลา</th>
                {series.map((s) => (
                  <th key={s.key} className="px-2 py-1 text-right font-medium">{s.name} ({unit})</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...times].reverse().map((t) => (
                <tr key={t} className="border-t border-border">
                  <td className="px-2 py-1">{fmtX(t, daily)}</td>
                  {series.map((s) => {
                    const v = at(s, t);
                    return <td key={s.key} className="px-2 py-1 text-right">{v === null ? "-" : fmtNum(v, decimals, signed)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
