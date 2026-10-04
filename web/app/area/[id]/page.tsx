import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSnapshot } from "@/lib/data";
import { analyze, getElevation, getPointRain, resolvePlace, RISK_TYPE } from "@/lib/area";
import { getSea, TOWN_TIDE_LAG_H, upcomingHighs } from "@/lib/forecast";
import { OFFICIAL_RATCHABURI_H } from "@/lib/route";
import { fmt, fmtSigned, fmtTime, LEVEL_TEXT } from "@/lib/status";
import type { Level } from "@/lib/types";
import { Badge, Card, levelBg, levelDot, levelText, Measured, SectionTitle, Trend } from "@/components/ui";
import { AreaActions } from "@/components/AreaActions";

export const revalidate = 300;

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ lat?: string; lon?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const place = resolvePlace(decodeURIComponent((await params).id), (await searchParams).lat, (await searchParams).lon);
  return { title: place ? `${place.name} — พื้นที่ของฉัน` : "พื้นที่ของฉัน" };
}

const ADVICE: Record<Level, string[]> = {
  red: [
    "ยกของมีค่า เอกสาร ยา และปลั๊กไฟขึ้นที่สูงทันที",
    "ย้ายรถไปจอดที่สูง เตรียมกระสอบทรายอุดท่อ/ทางน้ำเข้า",
    "ผู้สูงอายุ เด็ก ผู้ป่วย เตรียมอพยพตามคำแนะนำของ ปภ./อปท.",
  ],
  orange: [
    "เตรียมยกของขึ้นที่สูง โดยเฉพาะบ้านที่พื้นต่ำกว่าถนน",
    "ตรวจท่อและทางระบายน้ำรอบบ้าน อุดทางที่น้ำอาจดันย้อน",
    "ติดตามระดับน้ำทุก 2–3 ชม. และประกาศของจังหวัด",
  ],
  yellow: ["ติดตามสถานการณ์อย่างใกล้ชิด", "สังเกตระดับน้ำในคลองใกล้บ้านวันละ 2–3 ครั้ง"],
  green: ["สถานการณ์ปกติ ติดตามข่าวสารตามปกติ"],
  unknown: ["ยังประเมินไม่ได้ ติดตามประกาศของหน่วยงานในพื้นที่"],
};

const hhmm = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + " น.";

export default async function AreaPage({ params, searchParams }: Props) {
  const id = decodeURIComponent((await params).id);
  const sp = await searchParams;
  const place = resolvePlace(id, sp.lat, sp.lon);
  if (!place) notFound();

  const s = await getSnapshot();
  const r = analyze(place, s);
  const [elev, rain, sea] = await Promise.all([
    getElevation(place.lat, place.lon),
    getPointRain(place.lat, place.lon),
    r.tide ? getSea().catch(() => null) : Promise.resolve(null),
  ]);
  const bank = r.ref && r.ref.wl !== null && r.ref.diffBank !== null ? r.ref.wl - r.ref.diffBank : null;
  const href = id === "pin" ? `/area/pin?lat=${place.lat.toFixed(2)}&lon=${place.lon.toFixed(2)}` : `/area/${place.key}`;
  const rain3 = rain.slice(0, 3).reduce((a, d) => a + (d.mm ?? 0), 0);
  const maxRain = Math.max(1, ...rain.map((d) => d.mm ?? 0));
  const highs = sea ? upcomingHighs(sea, 3) : [];

  return (
    <div className="space-y-5">
      <nav className="text-xs text-muted">
        <Link href="/area" className="hover:text-accent">พื้นที่ของฉัน</Link> / {place.name}
      </nav>

      <div className="space-y-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{place.name}</h1>
          <p className="text-sm text-muted">{place.sub}{place.approx ? ` · ${place.approx}` : ""}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AreaActions href={href} name={place.name} sub={place.sub} />
          <Link href={href.replace("/area/", "/report/")} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-accent">
            🖼️ รายงานภาพ A4
          </Link>
        </div>
      </div>

      {/* สถานะพื้นที่ */}
      <section className={`rounded-2xl border border-border p-5 ${levelBg(r.level)}`}>
        <div className="flex items-center gap-2">
          <span className={`size-3 rounded-full ${levelDot(r.level)}`} aria-hidden />
          <span className={`text-sm font-semibold ${levelText(r.level)}`}>สถานะพื้นที่: {LEVEL_TEXT[r.level]}</span>
        </div>
        <ul className="mt-2 space-y-1 text-sm">
          {r.reasons.map((x) => (
            <li key={x} className="flex gap-2"><span aria-hidden>•</span>{x}</li>
          ))}
        </ul>
        <h2 className="mt-3 text-sm font-semibold">ควรทำอะไร</h2>
        <ul className="mt-1 space-y-1 text-sm">
          {ADVICE[r.level].map((x) => (
            <li key={x} className="flex gap-2"><span aria-hidden>✓</span>{x}</li>
          ))}
        </ul>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        {/* แม่น้ำและประเภทพื้นที่ */}
        <Card>
          <SectionTitle>แม่น้ำใกล้สุด</SectionTitle>
          <p className="text-sm">
            <b>{r.river.name}</b> ห่างราว <b className="tnum">{fmt(r.river.distKm, r.river.distKm < 10 ? 1 : 0)} กม.</b>
            {r.river.chainKm !== null && <span className="text-muted"> · ตรงกับ กม. {fmt(r.river.chainKm)} ตามลำน้ำจากเขื่อนแม่กลอง</span>}
          </p>
          <p className="mt-2 font-semibold">{RISK_TYPE[r.river.type].title}</p>
          <p className="text-sm text-muted">{RISK_TYPE[r.river.type].detail}</p>
          {r.canalNote && <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">{r.canalNote}</p>}
        </Card>

        {/* ความสูงพื้นที่ */}
        <Card>
          <SectionTitle hint="ค่าประมาณ ±2–5 ม.">ความสูงของพื้นที่</SectionTitle>
          {elev === null ? (
            <p className="text-sm text-muted">ดึงข้อมูลความสูงไม่ได้</p>
          ) : (
            <>
              <p className="tnum text-2xl font-bold">~{fmt(elev, 0)} <span className="text-sm font-normal text-muted">ม. เหนือระดับน้ำทะเล (ม.รทก.)</span></p>
              {bank !== null && r.ref && (
                <p className="mt-1 text-sm">
                  ตลิ่งที่ {r.ref.name} อยู่ที่ราว {fmt(bank, 1)} ม. → พื้นที่{" "}
                  <b>{elev - bank >= 0 ? `สูงกว่าตลิ่งราว ${fmt(elev - bank, 1)} ม.` : `ต่ำกว่าตลิ่งราว ${fmt(bank - elev, 1)} ม.`}</b>
                </p>
              )}
              <p className="mt-1 text-xs text-muted">
                จากแบบจำลองความสูงดาวเทียม (Copernicus DEM 90 ม.) ซึ่งรวมความสูงอาคาร/ต้นไม้ และเป็นค่าเฉลี่ยพื้นที่กว้าง — ใช้ดูภาพรวมเท่านั้น
                ระดับพื้นบ้านจริงเทียบกับถนนสำคัญกว่า
              </p>
            </>
          )}
        </Card>
      </div>

      {/* สถานีวัดน้ำใกล้สุด */}
      <Card>
        <SectionTitle>สถานีวัดน้ำใกล้พื้นที่</SectionTitle>
        <ul className="divide-y divide-border">
          {r.nearest.map(({ station: x, distKm, canal }) => (
            <li key={x.code} className="py-2.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link href={`/stations/${encodeURIComponent(x.code)}`} className="font-semibold hover:text-accent">
                  {x.name}
                  {x.code === r.ref?.code && <span className="ml-1.5 rounded bg-accent/10 px-1.5 py-0.5 align-middle text-[0.65rem] text-accent">ใช้ประเมิน</span>}
                </Link>
                <Badge level={x.stale ? "unknown" : x.level}>{x.stale ? "ข้อมูลเก่า" : x.label}</Badge>
              </div>
              <p className="tnum text-sm">
                {x.code} · ห่าง {fmt(distKm, 1)} กม.{canal ? " · สถานีในคลอง" : ""} · เทียบตลิ่ง{" "}
                <b className={levelText(x.level)}>{x.diffBank === null ? "-" : `${fmtSigned(x.diffBank)} ม.`}</b> <Trend trend={x.trend} />
              </p>
              <Measured time={x.time} ageMin={x.ageMin} stale={x.stale} />
            </li>
          ))}
          {r.ref && !r.nearest.some((n) => n.station.code === r.ref!.code) && (
            <li className="py-2.5 text-sm">
              สถานีบนแม่น้ำสายหลักที่ใช้ประเมิน:{" "}
              <Link href={`/stations/${encodeURIComponent(r.ref.code)}`} className="font-semibold text-accent">{r.ref.name} ({r.ref.code})</Link> · เทียบตลิ่ง{" "}
              <b className={levelText(r.ref.level)}>{fmtSigned(r.ref.diffBank)} ม.</b>
            </li>
          )}
        </ul>
      </Card>

      {/* มวลน้ำ */}
      {r.eta && (
        <Card>
          <SectionTitle hint={<Link href="/forecast" className="font-medium text-accent">ดูทั้งเส้นทาง →</Link>}>มวลน้ำจากต้นน้ำ</SectionTitle>
          <p className="text-sm">
            สภาพน้ำที่ <b>{r.eta.from.name}</b> ({fmtTime(r.eta.from.time)}: เทียบตลิ่ง {fmtSigned(r.eta.from.diffBank)} ม. <Trend trend={r.eta.from.trend} />)
            จะมาถึงพื้นที่นี้ราว <b>{hhmm(r.eta.at)}</b> <span className="text-muted">(+{fmt(r.eta.hours)} ชม.)</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            ประมาณจากความเร็วน้ำเหตุการณ์ 30 ก.ย.–1 ต.ค. 2569 · ตัวเลขทางการช่วงเขื่อน→ราชบุรีคือ ~{OFFICIAL_RATCHABURI_H} ชม. จึงควรเผื่อเวลาช้ากว่านี้ได้
          </p>
        </Card>
      )}

      {/* น้ำทะเลหนุน */}
      {r.tide && (
        <Card>
          <SectionTitle hint="แบบจำลอง ไม่ใช่ตารางน้ำทางการ">น้ำทะเลหนุน</SectionTitle>
          {highs.length ? (
            <ul className="grid gap-2 sm:grid-cols-3">
              {highs.map((t) => (
                <li key={t.time} className="rounded-xl border border-border p-2.5 text-sm">
                  <span className="block text-xs text-muted">น้ำขึ้นสูง (ตัวเมืองสมุทรสงคราม)</span>
                  <b>{hhmm(new Date(new Date(t.time).getTime() + TOWN_TIDE_LAG_H * 3600e3).toISOString())}</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">ดึงข้อมูลไม่ได้</p>
          )}
          <p className="mt-2 text-xs text-muted">ช่วงน้ำขึ้นสูง น้ำในแม่น้ำและคลองระบายลงทะเลได้ช้า — ถ้ามีน้ำเหนือหรือฝนหนักพร้อมกัน ระดับน้ำจะสูงกว่าปกติ</p>
        </Card>
      )}

      {/* ฝน */}
      <Card>
        <SectionTitle hint="Open-Meteo · มม./วัน">ฝนคาดการณ์ 7 วัน (พิกัดนี้)</SectionTitle>
        {rain.length === 0 ? (
          <p className="text-sm text-muted">ดึงข้อมูลไม่ได้</p>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 text-center">
              {rain.map((d) => (
                <div key={d.date}>
                  <div className="mx-auto flex h-16 w-5 items-end overflow-hidden rounded-sm bg-surface-2" aria-hidden>
                    <div className="w-full rounded-sm bg-[var(--series-1)]" style={{ height: `${Math.min(100, ((d.mm ?? 0) / maxRain) * 100)}%` }} />
                  </div>
                  <span className="tnum block text-xs font-semibold">{fmt(d.mm, d.mm !== null && d.mm < 10 ? 1 : 0)}</span>
                  <span className="block text-[0.65rem] text-muted">
                    {new Date(`${d.date}T12:00:00+07:00`).toLocaleDateString("th-TH", { weekday: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
            <p className={`mt-2 text-sm ${rain3 >= 50 ? "font-semibold text-orange" : "text-muted"}`}>
              3 วันข้างหน้ารวม {fmt(rain3)} มม.{rain3 >= 50 ? " — ฝนมาก เสี่ยงน้ำขังในพื้นที่ต่ำ" : ""}
            </p>
          </>
        )}
      </Card>

      <Card>
        <SectionTitle>เบอร์ฉุกเฉิน</SectionTitle>
        <ul className="grid grid-cols-3 gap-2 text-sm">
          {[["ปภ.", "1784"], ["การแพทย์ฉุกเฉิน", "1669"], ["เหตุด่วน", "191"]].map(([n, t]) => (
            <li key={t}>
              <a href={`tel:${t}`} className="block rounded-xl border border-border px-3 py-2 hover:border-accent">
                <span className="block text-xs text-muted">{n}</span>
                <span className="tnum font-semibold">{t}</span>
              </a>
            </li>
          ))}
        </ul>
      </Card>

      <p className="text-xs text-muted">
        ประเมินอัตโนมัติจากระยะห่างแม่น้ำ สถานีวัดน้ำใกล้สุด และข้อมูลฝน — ใช้ประกอบการเตรียมตัว ไม่ใช่ประกาศทางการ ·
        ข้อมูลตำบล UN OCHA COD-AB · แม่น้ำ © OpenStreetMap · ความสูง Copernicus DEM · ฝน Open-Meteo
      </p>
    </div>
  );
}
