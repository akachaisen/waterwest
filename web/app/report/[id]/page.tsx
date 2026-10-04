import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSnapshot } from "@/lib/data";
import { analyze, getPointRain, resolvePlace, RISK_TYPE } from "@/lib/area";
import { getSea, TOWN_TIDE_LAG_H, travelPlan, upcomingHighs } from "@/lib/forecast";
import { fmt, fmtSigned, LEVEL_TEXT, overall } from "@/lib/status";
import type { Level } from "@/lib/types";
import { levelBg, levelDot, levelText } from "@/components/ui";
import { ReportToolbar } from "@/components/ReportToolbar";

export const revalidate = 300;

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ lat?: string; lon?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const place = resolvePlace(decodeURIComponent((await params).id), (await searchParams).lat, (await searchParams).lon);
  return { title: place ? `รายงาน ${place.name}` : "รายงาน" };
}

const TZ = "Asia/Bangkok";
const dt = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("th-TH", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + " น." : "-";
const dtLong = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " น.";

const ADVICE: Record<Level, string> = {
  red: "ยกของมีค่า เอกสาร ยา ปลั๊กไฟขึ้นที่สูงทันที ย้ายรถไปที่สูง ผู้สูงอายุ/ผู้ป่วยเตรียมอพยพตามคำแนะนำ ปภ.",
  orange: "เตรียมยกของขึ้นที่สูง ตรวจท่อและทางระบายรอบบ้าน ติดตามระดับน้ำทุก 2–3 ชม.",
  yellow: "ติดตามสถานการณ์ใกล้ชิด สังเกตระดับน้ำในคลองใกล้บ้านวันละ 2–3 ครั้ง",
  green: "สถานการณ์ปกติ ติดตามข่าวสารตามปกติ",
  unknown: "ยังประเมินไม่ได้ ติดตามประกาศของหน่วยงานในพื้นที่",
};

function Chip({ level, children }: { level: Level; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${levelBg(level)} ${levelText(level)}`}>
      <span className={`size-1.5 rounded-full ${levelDot(level)}`} />
      {children}
    </span>
  );
}

export default async function ReportPage({ params, searchParams }: Props) {
  const id = decodeURIComponent((await params).id);
  const sp = await searchParams;
  const place = resolvePlace(id, sp.lat, sp.lon);
  if (!place) notFound();

  const s = await getSnapshot();
  const area = analyze(place, s);
  const basin = overall(s.stations, s.dams, s.maeklongQ?.q ?? null);
  const plan = travelPlan(s);
  const [rain, sea] = await Promise.all([getPointRain(place.lat, place.lon), area.tide ? getSea().catch(() => null) : Promise.resolve(null)]);
  const highs = sea ? upcomingHighs(sea, 2) : [];
  const vrk = s.dams.find((d) => d.id === "200402");
  const snr = s.dams.find((d) => d.id === "200401");
  const k55 = s.stations.find((x) => x.code === "K.55A");
  const nowIso = new Date(s.generatedAt).toISOString();
  const stamp = new Date(s.generatedAt).toLocaleString("sv-SE", { timeZone: TZ }).slice(0, 16).replace(/[-: ]/g, "");
  const backHref = id === "pin" ? `/area/pin?lat=${sp.lat}&lon=${sp.lon}` : `/area/${place.key}`;

  return (
    <div className="space-y-4">
      <div className="print:hidden space-y-2">
        <nav className="text-xs text-muted">
          <Link href={backHref} className="hover:text-accent">← กลับไปหน้า {place.name}</Link>
        </nav>
        <h1 className="text-xl font-bold">รายงานภาพ A4 — {place.name}</h1>
        <ReportToolbar targetId="report-sheet" fileName={`waterwest-${place.key.replace(/[^a-z0-9-]/gi, "_")}-${stamp}.png`} />
        <p className="text-xs text-muted">ขนาด A4 แนวตั้ง · ส่งต่อทาง LINE หรือพิมพ์ติดบ้านได้ · บนมือถือเลื่อนซ้าย-ขวาเพื่อดูทั้งแผ่น</p>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <article id="report-sheet" className="report-sheet mx-auto flex h-[1123px] w-[794px] flex-col gap-3 border border-border p-8 shadow-sm">
          {/* หัวรายงาน */}
          <header className="flex items-start justify-between gap-4 border-b-2 border-accent pb-3">
            <div>
              <p className="text-[13px] font-semibold text-accent">WaterWest · ติดตามน้ำลุ่มแม่กลอง</p>
              <h2 className="text-[26px] font-bold leading-tight">รายงานสถานการณ์น้ำ</h2>
              <p className="text-[18px] font-semibold">{place.name}</p>
              <p className="text-[12px] text-muted">{place.sub}</p>
            </div>
            <div className="text-right text-[12px]">
              <p className="text-muted">ข้อมูล ณ</p>
              <p className="text-[15px] font-bold">{dtLong(nowIso)}</p>
              <p className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[12px] font-semibold ${levelBg(basin.level)} ${levelText(basin.level)}`}>
                ลุ่มแม่กลอง: {LEVEL_TEXT[basin.level]}
              </p>
            </div>
          </header>

          {/* สถานะพื้นที่ */}
          <section className={`rounded-xl p-4 ${levelBg(area.level)}`}>
            <p className={`text-[20px] font-bold ${levelText(area.level)}`}>สถานะพื้นที่: {LEVEL_TEXT[area.level]}</p>
            <ul className="mt-1 space-y-0.5 text-[13px]">
              {area.reasons.slice(0, 3).map((r) => <li key={r}>• {r}</li>)}
            </ul>
            <p className="mt-2 text-[13px]"><b>ควรทำ:</b> {ADVICE[area.level]}</p>
          </section>

          {/* ตัวเลขสำคัญ */}
          <section className="grid grid-cols-4 gap-2">
            {[vrk, snr].map((d) =>
              d ? (
                <div key={d.id} className="rounded-lg border border-border p-2.5">
                  <p className="text-[11px] text-muted">{d.name}</p>
                  <p className="text-[20px] font-bold">{fmt(d.pct, 1)}%</p>
                  <p className="text-[11px] text-muted">เข้า ≈{fmt(d.inflowCms)} · ระบาย ≈{fmt(d.outflowCms)} ลบ.ม./วิ</p>
                  <p className="text-[10px] text-muted">ข้อมูลวันที่ {d.date}</p>
                </div>
              ) : null,
            )}
            <div className="rounded-lg border border-border p-2.5">
              <p className="text-[11px] text-muted">น้ำท้ายเขื่อนแม่กลอง (K.55A)</p>
              <p className="text-[20px] font-bold">{fmt(k55?.q)} <span className="text-[11px] font-normal">ลบ.ม./วิ</span></p>
              <p className="text-[11px] text-muted">เทียบตลิ่ง {fmtSigned(k55?.diffBank ?? null)} ม. · {k55?.trend ?? "-"}</p>
              <p className="text-[10px] text-muted">วัดเมื่อ {dt(k55?.time)}</p>
            </div>
            <div className="rounded-lg border border-border p-2.5">
              <p className="text-[11px] text-muted">สถานีอ้างอิงของพื้นที่</p>
              <p className={`text-[20px] font-bold ${levelText(area.ref?.level ?? "unknown")}`}>{area.ref ? `${fmtSigned(area.ref.diffBank)} ม.` : "-"}</p>
              <p className="text-[11px] text-muted">{area.ref ? `${area.ref.name} (${area.ref.code}) · ${area.ref.trend ?? "-"}` : "ไม่มีข้อมูล"}</p>
              <p className="text-[10px] text-muted">วัดเมื่อ {dt(area.ref?.time)}</p>
            </div>
          </section>

          {/* พื้นที่ + มวลน้ำ */}
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-[14px] font-bold">ลักษณะพื้นที่</p>
              <p className="text-[13px]">
                ห่าง{area.river.name} ~{fmt(area.river.distKm, 1)} กม. · <b>{RISK_TYPE[area.river.type].title}</b>
              </p>
              <p className="mt-1 text-[12px] text-muted">{RISK_TYPE[area.river.type].detail}</p>
              {area.canalNote && <p className="mt-1 text-[12px]">{area.canalNote}</p>}
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-[14px] font-bold">มวลน้ำจากต้นน้ำ</p>
              {area.eta ? (
                <p className="text-[13px]">
                  สภาพน้ำที่{area.eta.from.name} ตอนนี้ จะถึงพื้นที่นี้ราว <b>{dt(area.eta.at)}</b> (+{fmt(area.eta.hours)} ชม.)
                </p>
              ) : (
                <p className="text-[13px] text-muted">พื้นที่อยู่ต้นน้ำหรือใกล้สถานีต้นทาง — ดูสถานีใกล้สุดแทน</p>
              )}
              {highs.length > 0 && (
                <p className="mt-1 text-[12px]">
                  น้ำทะเลขึ้นสูง (เมืองสมุทรสงคราม):{" "}
                  {highs.map((t) => dt(new Date(new Date(t.time).getTime() + TOWN_TIDE_LAG_H * 3600e3).toISOString())).join(" · ")}
                </p>
              )}
            </div>
          </section>

          {/* เส้นทางน้ำช่วงล่าง */}
          <section className="rounded-lg border border-border p-3">
            <p className="mb-1 text-[14px] font-bold">เส้นทางน้ำ บ้านโป่ง → ปากอ่าว</p>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-muted">
                  <th className="py-0.5 font-medium">จุด</th>
                  <th className="py-0.5 font-medium">สถานะตอนนี้</th>
                  <th className="py-0.5 font-medium">เทียบตลิ่ง</th>
                  <th className="py-0.5 font-medium">สภาพน้ำบ้านโป่งตอนนี้จะถึงราว</th>
                </tr>
              </thead>
              <tbody>
                {plan.base && (
                  <tr className="border-t border-border">
                    <td className="py-1 font-semibold">บ้านโป่ง (K.55A)</td>
                    <td><Chip level={plan.base.level}>{plan.base.label}</Chip></td>
                    <td>{fmtSigned(plan.base.diffBank)} ม.</td>
                    <td className="text-muted">ต้นทาง · {dt(plan.base.time)}</td>
                  </tr>
                )}
                {plan.rows.map((r) => (
                  <tr key={r.code} className="border-t border-border">
                    <td className="py-1 font-semibold">{r.name}</td>
                    <td>{r.station ? <Chip level={r.station.stale ? "unknown" : r.station.level}>{r.station.stale ? "ข้อมูลเก่า" : r.station.label}</Chip> : "-"}</td>
                    <td>{r.station ? `${fmtSigned(r.station.diffBank)} ม.` : "-"}</td>
                    <td>{dt(r.eta)} <span className="text-muted">(+{fmt(r.hoursFromBase)} ชม.)</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ฝน */}
          <section className="rounded-lg border border-border p-3">
            <p className="mb-1 text-[14px] font-bold">ฝนคาดการณ์ 7 วัน (พิกัดพื้นที่นี้)</p>
            <div className="grid grid-cols-7 gap-1 text-center text-[12px]">
              {rain.map((d) => (
                <div key={d.date} className="rounded-md bg-surface-2 py-1">
                  <p className="text-muted">{new Date(`${d.date}T12:00:00+07:00`).toLocaleDateString("th-TH", { weekday: "short", day: "numeric" })}</p>
                  <p className="text-[15px] font-bold">{fmt(d.mm, d.mm !== null && d.mm < 10 ? 1 : 0)}</p>
                  <p className="text-[10px] text-muted">มม. · {d.prob ?? "-"}%</p>
                </div>
              ))}
            </div>
          </section>

          {/* ท้ายรายงาน */}
          <footer className="mt-auto border-t border-border pt-2 text-[10.5px] leading-relaxed text-muted">
            <p>
              <b className="text-text">เวลาของข้อมูล:</b> สถานีวัดน้ำ {dt(area.ref?.time ?? k55?.time)} (แต่ละสถานีวัดไม่พร้อมกัน) · เขื่อน วันที่ {vrk?.date ?? "-"} ·
              ฝน/น้ำทะเล แบบจำลอง Open-Meteo · ดึงข้อมูล {dt(s.generatedAt)}
            </p>
            <p>
              ที่มา: กรมชลประทาน · คลังข้อมูลน้ำแห่งชาติ (สสน.) · กฟผ. · Open-Meteo · ข้อมูลประกอบการเตรียมตัว ไม่ใช่ประกาศทางการ · สายด่วน ปภ. 1784 · การแพทย์ฉุกเฉิน 1669
            </p>
            <div className="mt-1.5 flex items-end justify-between">
              <p>อัปเดต {dtLong(nowIso)}</p>
              <p className="text-[13px] font-bold text-text">เอก AI</p>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
