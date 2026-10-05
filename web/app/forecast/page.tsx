import type { Metadata } from "next";
import Link from "next/link";
import { getSnapshot } from "@/lib/data";
import { getStationHistory } from "@/lib/history";
import { CALIBRATION, OFFICIAL_RATCHABURI_H, TRAVEL_STATS } from "@/lib/route";
import { BASE_CODE, getRain7, getSea, tideClash, TOWN_TIDE_LAG_H, travelPlan, upcomingHighs } from "@/lib/forecast";
import { fmt, fmtSigned, fmtTime } from "@/lib/status";
import { Badge, Card, levelText, SectionTitle, Trend } from "@/components/ui";
import { LineChart } from "@/components/LineChart";

export const revalidate = 300;
export const metadata: Metadata = { title: "คาดการณ์" };

const hhmm = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + " น.";

// เวลาที่ยอดน้ำผ่านแต่ละสถานี เหตุการณ์ 30 ก.ย.–1 ต.ค. 2569 (จากข้อมูล ThaiWater รายชั่วโมง)
const EVENT = [
  { code: "K.37", name: "แควน้อย บ้านวังเย็น", peak: "30 ก.ย. 02:00", gap: "—" },
  { code: "K.3A", name: "กาญจนบุรี หน้าศาลากลาง", peak: "30 ก.ย. 16:00", gap: "+14 ชม." },
  { code: "K.11A", name: "ท่าม่วง (ท้ายเขื่อนแม่กลอง)", peak: "30 ก.ย. 19:00", gap: "+3 ชม." },
  { code: "K.55A", name: "บ้านโป่ง สะพานค่ายหลวง (47 กม.)", peak: "1 ต.ค. 08:00", gap: "+5–13 ชม." },
  { code: "RAJ001", name: "โพธาราม (71 กม.)", peak: "1 ต.ค. 09:00", gap: "+1–3 ชม." },
];

export default async function ForecastPage() {
  const [s, sea, rain] = await Promise.all([getSnapshot(), getSea().catch(() => null), getRain7().catch(() => null)]);
  const plan = travelPlan(s);
  const base = plan.base;
  const hist = await getStationHistory(BASE_CODE, 1).catch(() => null);
  const pts = (hist?.diff ?? []).filter((p): p is { t: number; v: number } => p.v !== null);
  const last = pts[pts.length - 1];
  const sixAgo = last ? pts.find((p) => p.t >= last.t - 6 * 3600e3) : undefined;
  const change6h = last && sixAgo && sixAgo !== last ? last.v - sixAgo.v : null;
  const rising = (change6h ?? 0) > 0.02 || base?.trend === "เพิ่มขึ้น";
  const falling = (change6h ?? 0) < -0.02 || base?.trend === "ลดลง";
  const nextHighs = upcomingHighs(sea);
  const maxRain = Math.max(1, ...(rain ?? []).flatMap((a) => a.days.map((d) => d.mm ?? 0)));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">คาดการณ์</h1>
        <p className="mt-1 text-sm text-muted">มวลน้ำจะถึงแต่ละจุดเมื่อไหร่ · น้ำทะเลหนุน · ฝน 7 วัน — เป็นการประมาณเพื่อเตรียมตัว ไม่ใช่ประกาศทางการ</p>
      </div>

      {/* มวลน้ำกำลังเดินทาง */}
      <Card>
        <SectionTitle hint={base?.time ? `ข้อมูลบ้านโป่ง ${fmtTime(base.time)}` : undefined}>มวลน้ำกำลังเดินทาง</SectionTitle>
        {!base ? (
          <p className="text-sm text-muted">ยังไม่มีข้อมูลสถานีบ้านโป่ง</p>
        ) : (
          <>
            <div className="rounded-xl bg-surface-2 p-3 text-sm">
              <p>
                ตอนนี้ที่ <b>บ้านโป่ง (K.55A)</b> ระดับน้ำ{" "}
                <b className={levelText(base.level)}>{base.diffBank === null ? "-" : `${fmtSigned(base.diffBank)} ม. เทียบตลิ่ง`}</b>
                {base.q !== null && <> · ปริมาณ <b>{fmt(base.q)}</b> ลบ.ม./วิ</>}
                {change6h !== null && <> · เปลี่ยน {fmtSigned(change6h)} ม. ใน 6 ชม.</>} <Trend trend={base.trend} />
              </p>
              <p className="mt-1 font-semibold">
                {rising
                  ? "ระดับน้ำต้นทางกำลังขึ้น → จุดท้ายน้ำมีแนวโน้มสูงขึ้นตาม ตามเวลาในตารางด้านล่าง"
                  : falling
                    ? "ระดับน้ำต้นทางกำลังลด → จุดท้ายน้ำมีแนวโน้มลดลงตาม ตามเวลาในตารางด้านล่าง"
                    : "ระดับน้ำต้นทางค่อนข้างทรงตัว"}
              </p>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="tnum w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="py-1.5 pr-2 font-medium">จุด</th>
                    <th className="px-2 py-1.5 text-right font-medium">ห่างบ้านโป่ง</th>
                    <th className="px-2 py-1.5 font-medium">สภาพน้ำบ้านโป่งตอนนี้จะถึงราว</th>
                    <th className="py-1.5 pl-2 font-medium">ตอนนี้ที่จุดนั้น</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.rows.map((r) => {
                    const clash = sea && (r.code === "MKG006" || r.code === "MOUTH") ? tideClash(r.eta, sea.tides) : undefined;
                    return (
                      <tr key={r.code} className="border-t border-border align-top">
                        <td className="py-2 pr-2">
                          <span className="font-semibold">{r.name}</span>
                          <span className="block text-xs text-muted">{r.code === "MOUTH" ? `${r.km} กม. จากเขื่อน` : `${r.code} · ${r.km} กม. จากเขื่อน`}</span>
                        </td>
                        <td className="px-2 py-2 text-right whitespace-nowrap">+{fmt(r.hoursFromBase)} ชม.</td>
                        <td className="px-2 py-2">
                          <span className="font-semibold">{hhmm(r.eta)}</span>
                          {clash && (
                            <span className="mt-1 block rounded-md bg-orange-bg px-2 py-0.5 text-xs font-semibold text-orange">
                              ใกล้ช่วงน้ำทะเลขึ้นสูง ({hhmm(new Date(new Date(clash.time).getTime() + TOWN_TIDE_LAG_H * 3600e3).toISOString())}) — อาจเอ่อสูงกว่าปกติ
                            </span>
                          )}
                        </td>
                        <td className="py-2 pl-2">
                          {r.station ? (
                            <>
                              <Badge level={r.station.stale ? "unknown" : r.station.level}>{r.station.stale ? "ข้อมูลเก่า" : r.station.label}</Badge>
                              <span className="block text-xs text-muted">{r.station.diffBank === null ? "" : `${fmtSigned(r.station.diffBank)} ม.`}</span>
                            </>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted">
              เวลาเดินทาง: เขื่อนแม่กลอง→บ้านโป่ง ~10 ชม. และ →โพธาราม ~15 ชม. (ค่ากลางจากยอดน้ำ {CALIBRATION.events} ครั้ง) · →ราชบุรี ~{OFFICIAL_RATCHABURI_H} ชม. และ →ปากอ่าว ~28 ชม. ตามตัวเลขทางการ · เวลาจริงคลาดได้หลายชั่วโมง ·
              ต.เจดีย์หักไม่ติดแม่น้ำ ผลกระทบมาทางคลองที่ระบายลงแม่กลองไม่ทัน จึงใช้เวลาเดียวกับตัวเมืองราชบุรี
            </p>
          </>
        )}
      </Card>

      {/* น้ำทะเลหนุน */}
      <Card>
        <SectionTitle hint="แบบจำลอง Open-Meteo · ไม่ใช่ตารางน้ำทางการ">น้ำทะเลหนุน ปากแม่กลอง</SectionTitle>
        {!sea ? (
          <p className="text-sm text-muted">ดึงข้อมูลไม่ได้</p>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {nextHighs.map((t) => (
                <div key={t.time} className="rounded-xl border border-border p-2.5">
                  <p className="text-xs text-muted">น้ำขึ้นสูง ตัวเมืองสมุทรสงคราม</p>
                  <p className="text-sm font-semibold">{hhmm(new Date(new Date(t.time).getTime() + TOWN_TIDE_LAG_H * 3600e3).toISOString())}</p>
                  <p className="tnum text-xs text-muted">ทะเล {fmt(t.m, 2)} ม.</p>
                </div>
              ))}
            </div>
            <LineChart
              title="ระดับน้ำทะเล"
              unit="ม."
              decimals={2}
              height={200}
              series={[{ key: "sea", name: "ระดับน้ำทะเล (แบบจำลอง)", color: "var(--series-1)", points: sea.points }]}
            />
            <p className="mt-2 text-xs text-muted">
              เทียบกับสถานีวัดจริง MKG006 สมุทรสงคราม: เวลาน้ำขึ้นตรงกัน โดยที่ตัวเมืองช้ากว่าแบบจำลองราว {TOWN_TIDE_LAG_H} ชม. ·
              ช่วงที่น้ำเหนือมาถึงตรงกับน้ำขึ้นสูง พื้นที่อัมพวา–เมืองสมุทรสงครามเสี่ยงที่สุด
            </p>
          </>
        )}
      </Card>

      {/* ฝน 7 วัน */}
      <Card>
        <SectionTitle hint={<Link href="/map?radar=1" className="font-medium text-accent">ดูเรดาร์ฝนบนแผนที่ →</Link>}>ฝนคาดการณ์ 7 วัน</SectionTitle>
        {!rain ? (
          <p className="text-sm text-muted">ดึงข้อมูลไม่ได้</p>
        ) : (
          <>
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="tnum w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-xs text-muted">
                  <th className="py-1 pr-2 text-left font-medium">พื้นที่</th>
                  {rain[0].days.map((d) => (
                    <th key={d.date} className="px-1 py-1 font-medium">
                      {new Date(`${d.date}T12:00:00+07:00`).toLocaleDateString("th-TH", { weekday: "short", day: "numeric" })}
                    </th>
                  ))}
                  <th className="py-1 pl-2 text-right font-medium">รวม</th>
                </tr>
              </thead>
              <tbody>
                {rain.map((a) => {
                  const total = a.days.reduce((x, d) => x + (d.mm ?? 0), 0);
                  return (
                    <tr key={a.id} className="border-t border-border">
                      <td className="py-2 pr-2 text-sm">{a.name}</td>
                      {a.days.map((d) => (
                        <td key={d.date} className="px-1 py-2 text-center align-bottom">
                          <div className="mx-auto flex h-10 w-3 items-end overflow-hidden rounded-sm bg-surface-2" aria-hidden>
                            <div className="w-full rounded-sm bg-[var(--series-1)]" style={{ height: `${Math.min(100, ((d.mm ?? 0) / maxRain) * 100)}%` }} />
                          </div>
                          <span className="block text-xs">{fmt(d.mm, d.mm !== null && d.mm < 10 ? 1 : 0)}</span>
                          <span className="block text-[0.65rem] text-muted">{d.prob ?? "-"}%</span>
                        </td>
                      ))}
                      <td className={`py-2 pl-2 text-right font-semibold ${total >= 50 ? "text-orange" : ""}`}>{fmt(total)} มม.</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">มม./วัน · % = โอกาสฝนสูงสุดของวัน · ฝนเหนืออ่างรวมเกิน 50 มม. ใน 3 วัน ระบบจะขึ้นสถานะเฝ้าระวัง</p>
          </>
        )}
      </Card>

      {/* หลักฐานเวลาเดินทาง: สถิติหลายเหตุการณ์ */}
      <Card>
        <SectionTitle hint={`ปรับเมื่อ ${CALIBRATION.date}`}>
          เวลาเดินทางของน้ำจากยอดน้ำ {CALIBRATION.events} ครั้ง ({CALIBRATION.period})
        </SectionTitle>
        <table className="tnum w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="py-1 font-medium">จุด (ระยะจากเขื่อนแม่กลอง)</th>
              <th className="py-1 text-right font-medium">ค่ากลาง</th>
              <th className="py-1 text-right font-medium">ช่วงที่พบบ่อย</th>
              <th className="py-1 text-right font-medium">ทั้งหมด</th>
            </tr>
          </thead>
          <tbody>
            {TRAVEL_STATS.map((t) => (
              <tr key={t.name} className="border-t border-border">
                <td className="py-1.5">{t.name} <span className="text-xs text-muted">{t.km} กม.</span></td>
                <td className="py-1.5 text-right font-semibold">{t.median} ชม.</td>
                <td className="py-1.5 text-right">{t.range} ชม.</td>
                <td className="py-1.5 text-right text-muted">{t.all} ชม.</td>
              </tr>
            ))}
            <tr className="border-t border-border">
              <td className="py-1.5">ตัวเมืองราชบุรี (K.2B) <span className="text-xs text-muted">83 กม.</span></td>
              <td className="py-1.5 text-right font-semibold">{OFFICIAL_RATCHABURI_H} ชม.</td>
              <td className="py-1.5 text-right text-muted" colSpan={2}>ตัวเลขทางการ</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted">
          นับจากยอดน้ำที่ท่าม่วง (K.11A ท้ายเขื่อนแม่กลอง) ถึงยอดน้ำที่สถานีท้ายน้ำ · ข้อมูลรายชั่วโมง ThaiWater · ราชบุรีใช้ตัวเลขทางการเพราะ K.2B ไม่มีใน ThaiWater
          (ระบบเก็บข้อมูล K.2B เองตั้งแต่ ต.ค. 2569 จะวัดได้เมื่อมีเหตุการณ์น้ำขึ้นครั้งถัดไป)
        </p>
      </Card>

      {/* หลักฐานเวลาเดินทาง: เหตุการณ์ใหญ่ล่าสุด */}
      <Card>
        <SectionTitle hint="ข้อมูลรายชั่วโมง ThaiWater">เวลาเดินทางของน้ำจากเหตุการณ์จริง (30 ก.ย.–1 ต.ค. 2569)</SectionTitle>
        <table className="tnum w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="py-1 font-medium">สถานี</th>
              <th className="py-1 font-medium">ยอดน้ำสูงสุด</th>
              <th className="py-1 text-right font-medium">ห่างจุดก่อนหน้า</th>
            </tr>
          </thead>
          <tbody>
            {EVENT.map((e) => (
              <tr key={e.code} className="border-t border-border">
                <td className="py-1.5">{e.name} <span className="text-xs text-muted">{e.code}</span></td>
                <td className="py-1.5">{e.peak} น.</td>
                <td className="py-1.5 text-right">{e.gap}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted">
          ยอดน้ำแบนกว้างจึงระบุเวลาแน่นอนยาก · ช่วงโพธาราม→ราชบุรีจะปรับเมื่อสถานี K.2B มีข้อมูลสะสมพอ
        </p>
      </Card>
    </div>
  );
}
