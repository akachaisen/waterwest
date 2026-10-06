// เกณฑ์บ้านฉัน — "น้ำเริ่มเข้าบ้านเมื่อสถานี X วัดได้เท่านี้ (เทียบตลิ่ง)" · เก็บใน localStorage ของเครื่องนี้เท่านั้น
import { useMemo, useSyncExternalStore } from "react";
import type { Level } from "@/lib/types";

export type Threshold = { bank: number; note?: string; at: string }; // bank = ระดับเทียบตลิ่ง (ม.) + สูงกว่า / − ต่ำกว่า
const KEY = "waterwest.thresholds.v1";
const EVENT = "waterwest-thresholds";

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "{}";
  } catch {
    return "{}";
  }
}

function parse(raw: string): Record<string, Threshold> {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

export function useThreshold(code: string | null | undefined): Threshold | null {
  const raw = useSyncExternalStore(subscribe, read, () => "{}");
  return useMemo(() => (code ? parse(raw)[code] ?? null : null), [raw, code]);
}

export function saveThreshold(code: string, t: Omit<Threshold, "at">) {
  const all = parse(read());
  all[code] = { ...t, at: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // โหมดส่วนตัว — ใช้ต่อได้แต่จะไม่จำ
  }
  window.dispatchEvent(new Event(EVENT));
}

export function clearThreshold(code: string) {
  const all = parse(read());
  delete all[code];
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(EVENT));
}

// ระยะที่เหลือก่อนถึงเกณฑ์ (ม.) และระดับสีที่ใช้แสดง
export function remaining(current: number | null, t: Threshold | null): { m: number; level: Level } | null {
  if (current === null || !t) return null;
  const m = t.bank - current;
  const level: Level = m <= 0 ? "red" : m < 0.3 ? "orange" : m < 1 ? "yellow" : "green";
  return { m, level };
}

export const remainingText = (m: number) =>
  m <= 0 ? `ถึงเกณฑ์บ้านคุณแล้ว (เกิน ${Math.round(-m * 100)} ซม.)` : `อีก ${m >= 1 ? `${m.toFixed(2)} ม.` : `${Math.round(m * 100)} ซม.`} จะถึงระดับที่น้ำเข้าบ้านคุณ`;
