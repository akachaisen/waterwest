"use client";

import Link from "next/link";
import { useState } from "react";
import { bankText, fmtTime } from "@/lib/status";
import { levelBg, levelText } from "./ui";
import { clearThreshold, remaining, remainingText, saveThreshold, useThreshold } from "./thresholds";

// เกณฑ์บ้านฉัน: ตั้งระดับที่สถานีวัดได้แล้วน้ำเริ่มเข้าบ้าน → บอก "เหลืออีกกี่ ซม." (เก็บในเครื่องนี้เท่านั้น)
export function HouseThreshold({ code, name, diffBank, time }: { code: string; name: string; diffBank: number | null; time: string | null }) {
  const t = useThreshold(code);
  const [editing, setEditing] = useState(false);
  const [above, setAbove] = useState(true);
  const [value, setValue] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const rem = remaining(diffBank, t);

  const startEdit = () => {
    const b = t?.bank ?? 0;
    setAbove(b >= 0);
    setValue(Math.abs(b).toFixed(2));
    setErr(null);
    setEditing(true);
  };
  const save = () => {
    const n = Number(value.replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > 10) return setErr("ใส่ตัวเลข 0–10 ม. เช่น 0.30");
    saveThreshold(code, { bank: above ? n : -n });
    setEditing(false);
  };
  const useNow = () => {
    if (diffBank === null) return;
    saveThreshold(code, { bank: Math.round(diffBank * 100) / 100, note: "ตั้งจากระดับตอนที่น้ำเข้าบ้าน" });
    setEditing(false);
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">เกณฑ์บ้านฉัน</h2>
        <span className="text-xs text-muted">เทียบกับสถานี {name} ({code})</span>
      </div>

      {editing ? (
        <div className="space-y-3">
          <p className="text-sm">น้ำเริ่มเข้าบ้าน (หรือถนนหน้าบ้าน) เมื่อระดับน้ำที่สถานีนี้…</p>
          <div className="flex gap-2" role="radiogroup" aria-label="สูงหรือต่ำกว่าตลิ่ง">
            {[
              [true, "สูงกว่าตลิ่ง"],
              [false, "ต่ำกว่าตลิ่ง"],
            ].map(([v, l]) => (
              <button
                key={String(v)}
                type="button"
                role="radio"
                aria-checked={above === v}
                onClick={() => setAbove(v as boolean)}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold ${above === v ? "bg-accent text-white dark:text-bg" : "border border-border"}`}
              >
                {l as string}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="tnum w-28 rounded-xl border border-border bg-bg px-3 py-2 text-lg"
              aria-label="ระดับ (เมตร)"
            />
            เมตร
          </label>
          {err && <p className="text-sm text-orange">{err}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={save} className="rounded-full bg-accent px-5 py-2 font-semibold text-white dark:text-bg">
              บันทึก
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-full border border-border px-5 py-2 font-semibold">
              ยกเลิก
            </button>
          </div>
          {diffBank !== null && (
            <button type="button" onClick={useNow} className="w-full rounded-xl border border-dashed border-border px-3 py-2 text-left text-sm">
              <b>น้ำกำลังเข้าบ้านตอนนี้?</b> กดเพื่อใช้ระดับตอนนี้ ({bankText(diffBank)}) เป็นเกณฑ์
            </button>
          )}
          <p className="text-xs text-muted">
            ไม่แน่ใจตัวเลข? ดูว่าครั้งก่อนที่น้ำเข้าบ้าน สถานีวัดได้เท่าไร จาก
            <Link href={`/stations/${encodeURIComponent(code)}`} className="text-accent"> กราฟย้อนหลังของสถานี</Link> หรือเริ่มที่ &quot;เท่าตลิ่ง 0.00&quot; แล้วค่อยปรับ
          </p>
        </div>
      ) : !t ? (
        <div className="space-y-2">
          <p className="text-sm">
            แต่ละบ้านน้ำเข้าที่ระดับไม่เท่ากัน ตั้งตัวเลขที่บ้านคุณเริ่มมีน้ำเข้า แล้วเว็บจะบอกว่า <b>เหลืออีกกี่ ซม.</b>
          </p>
          <button type="button" onClick={startEdit} className="rounded-full bg-accent px-5 py-2 font-semibold text-white dark:text-bg">
            ตั้งเกณฑ์บ้านฉัน
          </button>
          <p className="text-xs text-muted">ตัวเลขนี้จำไว้ในโทรศัพท์เครื่องนี้เท่านั้น ไม่ส่งไปที่ไหน</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rem ? (
            <p className={`rounded-xl px-3 py-2 text-lg font-bold ${levelBg(rem.level)} ${levelText(rem.level)}`}>{remainingText(rem.m)}</p>
          ) : (
            <p className="text-sm text-muted">สถานีนี้ยังไม่มีค่าเทียบตลิ่งล่าสุด</p>
          )}
          <p className="tnum text-sm">
            น้ำเข้าบ้านเมื่อ <b>{bankText(t.bank)}</b> · ตอนนี้ <b>{bankText(diffBank)}</b>
            <span className="block text-xs text-muted">วัดเมื่อ {fmtTime(time)}</span>
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={startEdit} className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold hover:border-accent">
              แก้เกณฑ์
            </button>
            <button type="button" onClick={() => clearThreshold(code)} className="rounded-full px-4 py-1.5 text-sm text-muted hover:text-red">
              ลบ
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
