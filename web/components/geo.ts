// หาตำแหน่งบนมือถือ + ข้อความบอกสาเหตุเมื่อไม่ได้ (ภาษาชาวบ้าน)
import { useSyncExternalStore } from "react";

// เปิดจากเบราว์เซอร์ในแอป LINE (มักไม่ให้เว็บใช้ตำแหน่ง)
export const isLineApp = () => typeof navigator !== "undefined" && /\bLine\//i.test(navigator.userAgent);
const noop = () => () => {};
export function useInLineApp(): boolean {
  return useSyncExternalStore(noop, isLineApp, () => false);
}

export const LINE_APP_HINT = "เปิดจากในแอป LINE มักใช้ตำแหน่งไม่ได้ — กด ⋮ หรือปุ่มแชร์มุมขวาบน แล้วเลือก \"เปิดในเบราว์เซอร์\" หรือกดเลือกตำบลแทน";

function permissionHelp(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/iPhone|iPad/i.test(ua)) return "เปิดสิทธิ์: การตั้งค่า → ความเป็นส่วนตัวและความปลอดภัย → บริการหาตำแหน่ง → Safari Websites → ขณะใช้แอป แล้วรีเฟรชหน้านี้";
  return "เปิดสิทธิ์: กดรูปแม่กุญแจหน้าชื่อเว็บด้านบน → สิทธิ์ → ตำแหน่ง → อนุญาต แล้วรีเฟรชหน้านี้ (และดูว่าเปิดตำแหน่งของเครื่องไว้)";
}

// เรียกหาตำแหน่ง → onOk(lat, lon) หรือ onFail(ข้อความบอกสาเหตุ)
export function locate(onOk: (lat: number, lon: number) => void, onFail: (msg: string) => void) {
  if (!navigator.geolocation) return onFail("เบราว์เซอร์นี้หาตำแหน่งไม่ได้ กดเลือกตำบลแทน");
  navigator.geolocation.getCurrentPosition(
    (pos) => onOk(pos.coords.latitude, pos.coords.longitude),
    (err) => {
      if (err.code === err.PERMISSION_DENIED) onFail(isLineApp() ? LINE_APP_HINT : `เว็บยังไม่ได้รับอนุญาตให้ใช้ตำแหน่ง · ${permissionHelp()} · หรือกดเลือกตำบลแทน`);
      else if (err.code === err.TIMEOUT) onFail("หาตำแหน่งนานเกินไป (สัญญาณ GPS อ่อน) ลองกดอีกครั้ง หรือกดเลือกตำบลแทน");
      else onFail("หาตำแหน่งไม่ได้ — ดูว่าเปิดตำแหน่ง (GPS) ของเครื่องไว้ แล้วลองใหม่ หรือกดเลือกตำบลแทน");
    },
    { timeout: 15000, maximumAge: 600000 },
  );
}
