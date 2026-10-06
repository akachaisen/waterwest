// ไม้วัดระดับน้ำ (SVG) — ใช้ทั้งในป๊อปอัปแผนที่ (DOM) และหน้าสถานี (React)
// สเกลเป็น ม.รทก. ถ้ารู้ระดับน้ำจริง ไม่งั้นใช้ "เทียบตลิ่ง" (ตลิ่ง = 0) · ข้อความใน SVG มีแต่ตัวเลข จึงใส่เป็น innerHTML ได้

export type GaugeInput = { wl: number | null; diffBank: number | null; color: string; size?: "sm" | "lg" };

export function gaugeSvg({ wl, diffBank, color, size = "sm" }: GaugeInput): string {
  if (diffBank === null) return "";
  const abs = wl !== null; // มี ม.รทก.
  const water = abs ? wl : diffBank;
  const bank = abs ? wl - diffBank : 0;
  // ช่วงสเกล: เห็นทั้งน้ำและตลิ่ง เผื่อด้านบน 1 ม. ด้านล่าง 1.5 ม. อย่างน้อย 3 ม.
  let hi = Math.max(water, bank) + 1;
  let lo = Math.min(water, bank) - 1.5;
  if (hi - lo < 3) lo = hi - 3;
  hi = Math.ceil(hi * 2) / 2;
  lo = Math.floor(lo * 2) / 2;

  const lg = size === "lg";
  const W = lg ? 104 : 34;
  const H = lg ? 200 : 100;
  const pad = 6;
  const x0 = lg ? 30 : 8; // ขอบซ้ายของไม้วัด
  const tw = lg ? 30 : 18; // ความกว้างไม้วัด
  const y = (v: number) => pad + ((hi - v) / (hi - lo)) * (H - 2 * pad);
  const step = hi - lo > 6 ? 2 : hi - lo > 3 ? 1 : 0.5;

  const parts: string[] = [];
  parts.push(`<rect x="${x0}" y="${pad}" width="${tw}" height="${H - 2 * pad}" rx="3" fill="none" stroke="currentColor" stroke-opacity="0.35"/>`);
  parts.push(`<rect x="${x0 + 1}" y="${y(Math.min(water, hi)).toFixed(1)}" width="${tw - 2}" height="${(H - pad - y(Math.min(water, hi))).toFixed(1)}" fill="${color}" fill-opacity="0.55"/>`);
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) {
    const yy = y(v).toFixed(1);
    parts.push(`<line x1="${x0}" y1="${yy}" x2="${x0 + (lg ? 9 : 6)}" y2="${yy}" stroke="currentColor" stroke-opacity="0.45"/>`);
    if (lg) parts.push(`<text x="${x0 - 4}" y="${(+yy + 4).toFixed(1)}" font-size="11" text-anchor="end" fill="currentColor" fill-opacity="0.65">${abs ? +v.toFixed(1) : (v > 0 ? "+" : "") + +v.toFixed(1)}</text>`);
  }
  const yb = y(bank).toFixed(1);
  parts.push(`<line x1="${x0 - (lg ? 6 : 4)}" y1="${yb}" x2="${x0 + tw + (lg ? 8 : 4)}" y2="${yb}" stroke="#dc2626" stroke-width="${lg ? 2.5 : 2}"/>`);
  if (lg) parts.push(`<text x="${x0 + tw + 11}" y="${(+yb + 4).toFixed(1)}" font-size="11" fill="#dc2626">ตลิ่ง</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="ไม้วัดระดับน้ำเทียบตลิ่ง">${parts.join("")}</svg>`;
}
