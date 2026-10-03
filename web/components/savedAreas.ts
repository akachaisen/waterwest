// พื้นที่ที่ผู้ใช้บันทึกไว้ — เก็บใน localStorage ของเบราว์เซอร์เท่านั้น
import { useMemo, useSyncExternalStore } from "react";

export type SavedArea = { href: string; name: string; sub: string; label?: string };
const KEY = "waterwest.areas.v1";
const EVENT = "waterwest-areas";

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function parse(raw: string): SavedArea[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x?.href === "string" && x.href.startsWith("/area/")) : [];
  } catch {
    return [];
  }
}

function write(list: SavedArea[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)));
  } catch {
    // โหมดส่วนตัว/บล็อกการเก็บข้อมูล — ใช้ต่อได้แต่จะไม่จำ
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

export function useSavedAreas(): SavedArea[] {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  return useMemo(() => parse(raw), [raw]);
}

export function addSaved(a: SavedArea) {
  write([a, ...parse(read()).filter((x) => x.href !== a.href)]);
}

export function removeSaved(href: string) {
  write(parse(read()).filter((x) => x.href !== href));
}
