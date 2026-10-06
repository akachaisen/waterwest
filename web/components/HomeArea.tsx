"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Level } from "@/lib/types";
import { bankText, fmtTime, trendText } from "@/lib/status";
import { levelBg, levelDot, levelText, DdpmSign } from "./ui";
import { addSaved, useSavedAreas } from "./savedAreas";
import { LINE_APP_HINT, locate, useInLineApp } from "./geo";
import { remaining, remainingText, useThreshold } from "./thresholds";

type Summary = {
  href: string;
  name: string;
  sub: string;
  level: Level;
  levelText: string;
  river: { name: string; distKm: number };
  ref: { code: string; name: string; diffBank: number | null; trend: string | null; time: string | null; stale: boolean; sign?: number | null } | null;
  eta: { from: string; hours: number; at: string } | null;
  tide: boolean;
};

const hhmm = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", weekday: "short", hour: "2-digit", minute: "2-digit" }) + " น.";

// การ์ดแรกของหน้าแรก: "แถวบ้านคุณ" — จำพื้นที่ไว้ในเครื่องนี้ (ใช้รายการพื้นที่ที่บันทึกไว้ อันแรก)
export type QuickArea = { href: string; name: string; sub: string };

export function HomeArea({ quick }: { quick: QuickArea[] }) {
  const saved = useSavedAreas();
  const home = saved[0];
  const [data, setData] = useState<Summary | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const inLine = useInLineApp();
  const [outside, setOutside] = useState(false);
  const th = useThreshold(data?.ref?.code);
  const rem = remaining(data?.ref?.diffBank ?? null, th);

  useEffect(() => {
    if (!home) return;
    let alive = true;
    fetch(`/api/area-summary?href=${encodeURIComponent(home.href)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Summary | null) => {
        if (alive) setData(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [home]);

  const useLocation = () => {
    setMsg("กำลังหาตำแหน่ง…");
    locate(async (lat, lon) => {
      const r = await fetch(`/api/area-summary?lat=${lat.toFixed(3)}&lon=${lon.toFixed(3)}`);
      if (!r.ok) {
        setOutside(true);
        return setMsg("ตำแหน่งตอนนี้อยู่นอกพื้นที่ที่ WaterWest ติดตาม (กาญจนบุรี ราชบุรี สมุทรสงคราม บ้านแพ้ว) — เลือกพื้นที่บ้านของคุณด้านล่าง หรือกดเลือกตำบล");
      }
      const d: Summary = await r.json();
      addSaved({ href: d.href, name: d.name, sub: d.sub, label: "บ้านฉัน" });
      setMsg(null);
    }, setMsg);
  };

  if (!home) {
    return (
      <section className="rounded-2xl border border-accent/40 bg-surface p-4">
        <h2 className="text-lg font-bold">น้ำแถวบ้านคุณเป็นยังไง?</h2>
        <p className="mt-1 text-sm text-muted">กดครั้งเดียว ครั้งต่อไปเปิดเว็บมาจะเห็นพื้นที่ของคุณก่อนเลย</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={useLocation} className="rounded-full bg-accent px-5 py-2.5 font-semibold text-white dark:text-bg">
            📍 ใช้ตำแหน่งของฉัน
          </button>
          <Link href="/area" className="rounded-full border border-border px-5 py-2.5 font-semibold hover:border-accent">
            เลือกตำบล
          </Link>
        </div>
        {msg ? (
          <p className="mt-2 text-sm text-orange" role="status">{msg}</p>
        ) : (
          inLine && <p className="mt-2 text-sm text-orange">{LINE_APP_HINT}</p>
        )}
        {outside && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {quick.map((a) => (
              <button
                key={a.href}
                type="button"
                onClick={() => addSaved({ ...a, label: "บ้านฉัน" })}
                className="rounded-full border border-border px-3 py-1.5 text-sm font-semibold hover:border-accent hover:text-accent"
              >
                {a.name}
              </button>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-muted">ตำแหน่งใช้หาตำบลที่ใกล้ที่สุดเท่านั้น ไม่เก็บพิกัดของคุณ · พื้นที่ที่เลือกจำไว้ในโทรศัพท์เครื่องนี้</p>
      </section>
    );
  }

  const lv: Level = data?.level ?? "unknown";
  return (
    <section className={`rounded-2xl border border-border p-4 ${levelBg(lv)}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted">แถวบ้านคุณ{home.label ? ` · ${home.label}` : ""}</p>
          <h2 className="text-lg font-bold leading-snug">{home.name}</h2>
          <p className="text-xs text-muted">{home.sub}</p>
        </div>
        {data && (
          <span className={`flex shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-sm font-bold ${levelText(lv)}`}>
            <span className={`size-2.5 rounded-full ${levelDot(lv)}`} aria-hidden />
            {data.levelText}
          </span>
        )}
      </div>

      {!data ? (
        <p className="mt-3 text-sm text-muted">กำลังโหลด…</p>
      ) : (
        <div className="mt-3 space-y-1.5">
          {data.ref ? (
            <p className="text-base">
              {data.river.name}ที่{data.ref.name}{" "}
              <b className="tnum">{bankText(data.ref.diffBank)}</b>
              {trendText(data.ref.trend) && <> · {trendText(data.ref.trend)}</>}
              <span className="block text-xs text-muted">
                วัดเมื่อ {fmtTime(data.ref.time)}{data.ref.stale ? " · ข้อมูลเก่า" : ""} · สถานี {data.ref.code}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted">ไม่มีสถานีวัดน้ำที่ใช้ประเมินพื้นที่นี้ได้</p>
          )}
          {data.ref && !data.ref.stale && (data.ref.sign ?? 0) >= 2 && <DdpmSign sign={data.ref.sign} compact />}
          {rem && (
            <p className={`rounded-lg bg-surface px-3 py-1.5 text-sm font-semibold ${levelText(rem.level)}`}>เกณฑ์บ้านฉัน: {remainingText(rem.m)}</p>
          )}
          {data.eta && (
            <p className="text-sm">
              น้ำจาก{data.eta.from}จะมาถึงแถวนี้ราว <b>{hhmm(data.eta.at)}</b>
            </p>
          )}
          {data.tide && <p className="text-sm">ได้รับผลน้ำทะเลหนุน — ดูเวลาน้ำขึ้นสูงในหน้าพื้นที่</p>}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={home.href} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white dark:text-bg">
          ดูรายละเอียด
        </Link>
        <Link href="/area" className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-accent">
          เปลี่ยนพื้นที่
        </Link>
      </div>
    </section>
  );
}
