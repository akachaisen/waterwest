import Link from "next/link";
import { getSnapshot } from "@/lib/data";
import { latestMaeklongRelease } from "@/lib/announcements";
import { getRainObs } from "@/lib/rainObs";
import { RainObsCard } from "@/components/RainObsCard";
import { fmt, fmtSigned, fmtTime, LEVEL_TEXT, overall, worst } from "@/lib/status";
import { SEGMENTS } from "@/lib/route";
import type { Dam, Level, Station } from "@/lib/types";
import { Badge, Card, levelBg, levelDot, levelText, Measured, Meter, SectionTitle, Trend } from "@/components/ui";

export const revalidate = 300;

const BANNER_TEXT: Record<Level, string> = {
  red: "สถานการณ์วิกฤต ติดตามประกาศทางการอย่างใกล้ชิด",
  orange: "มีจุดล้นตลิ่งบนเส้นทางหลัก พื้นที่ริมน้ำควรเตรียมพร้อม",
  yellow: "เฝ้าระวัง มีสัญญาณที่ต้องติดตาม",
  green: "สถานการณ์ปกติ",
  unknown: "ยังไม่มีข้อมูลเพียงพอ",
};

// ระดับของช่วงแม่น้ำ = สถานีที่แย่ที่สุดในช่วง จึงใช้คำเดียวกับสถานี (ไม่ใช่ระดับเตือนภัยของลุ่มน้ำ)
const SEG_TEXT: Record<Level, string> = {
  red: "มีจุดล้นตลิ่ง",
  orange: "ใกล้ตลิ่ง",
  yellow: "เฝ้าระวัง",
  green: "ปกติ",
  unknown: "ไม่มีข้อมูล",
};

export default async function Home() {
  const [s, official, rainObs] = await Promise.all([getSnapshot(), latestMaeklongRelease(), getRainObs()]);
  const by = Object.fromEntries(s.stations.map((x) => [x.code, x]));
  const status = overall(s.stations, s.dams, s.maeklongQ?.q ?? null);
  const vrk = s.dams.find((d) => d.id === "200402");
  const snr = s.dams.find((d) => d.id === "200401");
  const alerts = s.alerts.filter((a) => a.level !== "info");

  return (
    <div className="space-y-5">
      {/* สถานะรวม */}
      <section className={`rounded-2xl border border-border p-5 ${levelBg(status.level)}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`size-3 rounded-full ${levelDot(status.level)}`} aria-hidden />
          <span className={`text-sm font-semibold ${levelText(status.level)}`}>สถานะลุ่มน้ำแม่กลอง: {LEVEL_TEXT[status.level]}</span>
        </div>
        <h1 className="mt-2 text-xl font-bold leading-snug sm:text-2xl">{BANNER_TEXT[status.level]}</h1>
        {status.reasons.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {status.reasons.map((r) => (
              <li key={r} className="flex gap-2">
                <span aria-hidden>•</span>
                {r}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted">
          ดึงข้อมูลล่าสุด {fmtTime(s.generatedAt)} · {s.origin === "supabase" ? "จากฐานข้อมูล" : "จากไฟล์ในเครื่อง (โหมดทดสอบ)"}
        </p>
      </section>

      {official && (
        <Link href="/news" className="block rounded-2xl border border-border bg-surface p-4 hover:border-accent">
          <p className="text-xs font-semibold text-accent">ประกาศทางการ · มีผล {fmtTime(official.effective_at)}</p>
          <p className="mt-0.5 font-semibold">{official.title}</p>
          <p className="tnum text-sm text-muted">
            ระบายเขื่อนแม่กลอง {fmt(official.maeklong_cms)} ลบ.ม./วิ
            {s.maeklongQ && ` · วัดได้จริงที่บ้านโป่ง ${fmt(s.maeklongQ.q)} ลบ.ม./วิ (${fmtTime(s.maeklongQ.time)})`}
          </p>
        </Link>
      )}

      {/* ตัวเลขสำคัญ */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vrk && <DamTile dam={vrk} title="เขื่อนวชิราลงกรณ" river="แควน้อย" />}
        {snr && <DamTile dam={snr} title="เขื่อนศรีนครินทร์" river="แควใหญ่" />}
        <FlowTile
          title="น้ำท้ายเขื่อนแม่กลอง"
          sub="วัดที่ K.55A สะพานค่ายหลวง บ้านโป่ง (แทนการระบาย)"
          station={by["K.55A"]}
          marks={[2500, 3000]}
        />
        <BankTile title="ตัวเมืองราชบุรี" sub="K.2B สะพานธนะรัชต์" station={by["K.2B"]} />
        <FlowTile title="แควน้อยตอนล่าง" sub="K.37 บ้านวังเย็น เทียบความจุลำน้ำ" station={by["K.37"]} />
        <BankTile title="บางคนที สมุทรสงคราม" sub="TK.72 วัดบางคนฑีใน" station={by["TK.72"]} />
      </div>

      {/* สัญญาณเตือน */}
      <Card>
        <SectionTitle hint={`${alerts.length} รายการ`}>สัญญาณเตือน</SectionTitle>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted">ไม่มีสัญญาณเตือน</p>
        ) : (
          <ul className="divide-y divide-border">
            {alerts.map((a) => (
              <li key={a.text} className="flex items-start gap-3 py-2 text-sm">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${levelDot(a.level as Level)}`} aria-hidden />
                {a.text}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* สรุปรายช่วงแม่น้ำ */}
      <Card>
        <SectionTitle hint={<Link href="/river" className="font-medium text-accent">ดูผังเส้นทางน้ำ →</Link>}>สถานะรายช่วงแม่น้ำ</SectionTitle>
        <ul className="divide-y divide-border">
          {Object.entries(SEGMENTS).map(([id, name]) => {
            const rows = s.stations.filter((x) => x.seg === id && !x.stale);
            const lv = worst(rows.map((r) => r.level));
            const over = rows.filter((r) => r.level === "red").length;
            return (
              <li key={id}>
                <Link href={`/river#seg-${id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-accent">
                  <span className="text-sm">{name}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                    {over > 0 && <span>{over}/{rows.length} สถานี</span>}
                    <Badge level={lv}>{SEG_TEXT[lv]}</Badge>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* ฝนวัดจริง */}
        <RainObsCard obs={rainObs} compact />

        {/* ฝน */}
        <Card>
          <SectionTitle hint="Open-Meteo · มม./วัน">ฝนคาดการณ์</SectionTitle>
          <div className="overflow-x-auto">
            <table className="tnum w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="py-1 pr-2 font-medium">พื้นที่</th>
                  {s.rain[0]?.days.slice(1).map((d) => (
                    <th key={d.date} className="px-1 py-1 text-right font-medium">
                      {new Date(d.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.rain.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="py-1.5 pr-2">{p.name}</td>
                    {p.days.slice(1).map((d) => (
                      <td key={d.date} className="px-1 py-1.5 text-right">
                        {fmt(d.mm, 1)}
                        <span className="block text-[0.65rem] text-muted">{d.prob ?? "-"}%</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* น้ำทะเล + ฉุกเฉิน */}
        <div className="space-y-3">
          <Card>
            <SectionTitle hint="แบบจำลอง ไม่ใช่ตารางน้ำทางการ">น้ำทะเลหนุน ปากแม่กลอง</SectionTitle>
            {s.seaPeak ? (
              <p className="text-sm">
                สูงสุดใน 24 ชม. <span className="tnum text-lg font-bold">{fmt(s.seaPeak.m, 2)} ม.</span>{" "}
                <span className="text-muted">เวลา {fmtTime(s.seaPeak.time)}</span>
              </p>
            ) : (
              <p className="text-sm text-muted">ไม่มีข้อมูล</p>
            )}
            <p className="mt-1 text-xs text-muted">ช่วงน้ำขึ้นสูงตรงกับน้ำเหนือมาก พื้นที่อัมพวา–เมืองสมุทรสงครามเสี่ยงที่สุด</p>
          </Card>
          <Card>
            <SectionTitle>เบอร์ฉุกเฉิน</SectionTitle>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {[
                ["สายด่วน ปภ.", "1784"],
                ["การแพทย์ฉุกเฉิน", "1669"],
                ["เหตุด่วนเหตุร้าย", "191"],
                ["เขื่อนวชิราลงกรณ", "034-599077"],
              ].map(([n, t]) => (
                <li key={t}>
                  <a href={`tel:${t.replace(/-/g, "")}`} className="block rounded-xl border border-border px-3 py-2 hover:border-accent">
                    <span className="block text-xs text-muted">{n}</span>
                    <span className="tnum font-semibold">{t}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DamTile({ dam, title, river }: { dam: Dam; title: string; river: string }) {
  const level: Level = dam.pct >= 98 && dam.netMcm > 0 ? "orange" : dam.pct >= 95 ? "yellow" : "green";
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted">{river} · ข้อมูลวันที่ {dam.date}</p>
        </div>
        <Badge level={level}>{fmt(dam.pct, 1)}%</Badge>
      </div>
      <div className="mt-3">
        <Meter value={dam.pct} max={100} level={level} />
      </div>
      <dl className="tnum mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-muted">ไหลเข้า</dt>
          <dd className="font-semibold">≈{fmt(dam.inflowCms)} <span className="text-xs font-normal text-muted">ลบ.ม./วิ</span></dd>
        </div>
        <div>
          <dt className="text-xs text-muted">ระบาย</dt>
          <dd className="font-semibold">≈{fmt(dam.outflowCms)} <span className="text-xs font-normal text-muted">ลบ.ม./วิ</span></dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-muted">
        ที่ว่าง {fmt(dam.freeMcm)} ล้าน ลบ.ม.
        {dam.daysToFull !== null ? ` · ถ้าน้ำเข้าเท่านี้ ถึงระดับเก็บกักในราว ${fmt(dam.daysToFull, 1)} วัน` : " · น้ำในอ่างไม่เพิ่ม"}
      </p>
    </Card>
  );
}

function FlowTile({ title, sub, station, marks }: { title: string; sub: string; station?: Station; marks?: number[] }) {
  if (!station) return <MissingTile title={title} />;
  const max = marks ? marks[marks.length - 1] : station.capacity;
  const flowLevel: Level = marks
    ? station.q !== null && station.q > marks[1] ? "red" : station.q !== null && station.q > marks[0] ? "orange" : station.level
    : station.qPct !== null && station.qPct > 100 ? "red" : station.qPct !== null && station.qPct > 90 ? "orange" : "green";
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted">{sub}</p>
        </div>
        <Badge level={station.level}>{station.label}</Badge>
      </div>
      <p className="tnum mt-3 text-2xl font-bold">
        {fmt(station.q)} <span className="text-sm font-normal text-muted">ลบ.ม./วิ</span>
      </p>
      {station.q !== null && max && (
        <div className="mt-2 space-y-1">
          <Meter value={station.q} max={max} level={flowLevel} />
          <p className="tnum text-xs text-muted">
            {marks ? `เกณฑ์เฝ้าระวัง ${fmt(marks[0])} · วิกฤต ${fmt(marks[1])}` : `ความจุลำน้ำ ${fmt(station.capacity)} (${station.qPct}%)`}
          </p>
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Trend trend={station.trend} />
        <Measured time={station.time} ageMin={station.ageMin} stale={station.stale} />
      </div>
    </Card>
  );
}

function BankTile({ title, sub, station }: { title: string; sub: string; station?: Station }) {
  if (!station) return <MissingTile title={title} />;
  const above = station.diffBank !== null && station.diffBank > 0;
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted">{sub}</p>
        </div>
        <Badge level={station.level}>{station.label}</Badge>
      </div>
      <p className={`tnum mt-3 text-2xl font-bold ${levelText(station.level)}`}>
        {fmtSigned(station.diffBank)} <span className="text-sm font-normal text-muted">ม.</span>
      </p>
      <p className="text-xs text-muted">{above ? "สูงกว่าตลิ่ง" : "ต่ำกว่าตลิ่ง"}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Trend trend={station.trend} />
        <Measured time={station.time} ageMin={station.ageMin} stale={station.stale} />
      </div>
    </Card>
  );
}

function MissingTile({ title }: { title: string }) {
  return (
    <Card>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted">ยังไม่มีข้อมูล</p>
    </Card>
  );
}
