import type { Metadata } from "next";
import Link from "next/link";
import { getSnapshot } from "@/lib/data";
import { fmt, fmtSigned, fmtTime } from "@/lib/status";
import { CANAL_STATIONS, CONFLUENCE, KHWAE_NOI, KHWAE_YAI, KM_FROM_MAEKLONG_DAM, LOWER, MOUTH_KM, SEGMENTS, travelHours, TRIBUTARY } from "@/lib/route";
import type { Dam, Level, Station } from "@/lib/types";
import { Badge, levelDot, levelText, Measured, Trend } from "@/components/ui";

export const revalidate = 300;
export const metadata: Metadata = { title: "ผังเส้นทางน้ำ" };

export default async function RiverPage() {
  const s = await getSnapshot();
  const by = new Map(s.stations.map((x) => [x.code, x]));
  const pick = (codes: string[]) => codes.map((c) => by.get(c)).filter((x): x is Station => !!x);
  const vrk = s.dams.find((d) => d.id === "200402");
  const snr = s.dams.find((d) => d.id === "200401");
  const lowerE = pick(LOWER).filter((x) => x.seg === "E");
  const lowerF = pick(LOWER).filter((x) => x.seg === "F");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">ผังเส้นทางน้ำแม่กลอง</h1>
        <p className="mt-1 text-sm text-muted">
          จากเขื่อนวชิราลงกรณและศรีนครินทร์ ผ่านเขื่อนแม่กลอง ถึงปากอ่าวไทย · ดึงข้อมูลล่าสุด {fmtTime(s.generatedAt)}
        </p>
        <Legend />
      </div>

      {/* ต้นน้ำ 2 สาย */}
      <div className="grid gap-4 md:grid-cols-2">
        <Branch id="seg-A" title={SEGMENTS.A} dam={vrk} damName="เขื่อนวชิราลงกรณ" stations={pick(KHWAE_NOI)} />
        <Branch id="seg-B" title={SEGMENTS.B} dam={snr} damName="เขื่อนศรีนครินทร์" stations={pick(KHWAE_YAI)} />
      </div>

      {/* รวมแม่น้ำ → ปากอ่าว */}
      <section className="rounded-2xl border border-border bg-surface p-4">
        <Line>
          <Hub id="seg-C" title="แควน้อย + แควใหญ่ รวมเป็นแม่น้ำแม่กลอง" sub={SEGMENTS.C} />
          {pick(CONFLUENCE).map((x) => <StationNode key={x.code} s={x} />)}

          <Hub
            title="เขื่อนแม่กลอง (ท่าม่วง)"
            sub="จุดเริ่มนับเวลาเดินทางของมวลน้ำ"
            square
            extra={
              s.maeklongQ && (
                <p className="tnum mt-1 text-sm">
                  น้ำท้ายเขื่อน ≈ <b>{fmt(s.maeklongQ.q)}</b> ลบ.ม./วิ{" "}
                  <span className="text-xs text-muted">(วัดที่ K.55A บ้านโป่ง · {fmtTime(s.maeklongQ.time)})</span>
                </p>
              )
            }
          />

          <SegmentLabel id="seg-E">{SEGMENTS.E}</SegmentLabel>
          {lowerE.map((x) => <StationNode key={x.code} s={x} km={KM_FROM_MAEKLONG_DAM[x.code]} />)}

          <SegmentLabel id="seg-F">{SEGMENTS.F}</SegmentLabel>
          {lowerF.map((x) => <StationNode key={x.code} s={x} km={KM_FROM_MAEKLONG_DAM[x.code]} />)}

          <Hub
            title="ปากแม่น้ำแม่กลอง · อ่าวไทย"
            sub={`ราว ${MOUTH_KM} กม. · มวลน้ำถึงประมาณ ${fmt(travelHours(MOUTH_KM))} ชม. หลังออกจากเขื่อนแม่กลอง`}
            last
            extra={
              s.seaPeak && (
                <p className="tnum mt-1 text-sm">
                  น้ำทะเลสูงสุดใน 24 ชม. <b>{fmt(s.seaPeak.m, 2)} ม.</b>{" "}
                  <span className="text-xs text-muted">เวลา {fmtTime(s.seaPeak.time)} (แบบจำลอง)</span>
                </p>
              )
            }
          />
        </Line>
      </section>

      <p className="text-xs text-muted">
        เวลาเดินทางของมวลน้ำเทียบจากตัวเลขทางการ (เขื่อนแม่กลอง→ราชบุรี ~17 ชม., →ปากอ่าว ~28 ชม.) จุดอื่นเป็นการประมาณตามระยะทาง ·
        ระยะทางตามลำน้ำเป็นค่าโดยประมาณ · ระดับน้ำบางสถานีของ ชป. ใช้ระดับอ้างอิงของสถานีเอง จึงแสดงเป็น &quot;เทียบตลิ่ง&quot;
      </p>
    </div>
  );
}

function Legend() {
  const items: [Level, string][] = [
    ["red", "ล้นตลิ่ง"],
    ["orange", "ต่ำกว่าตลิ่งไม่ถึง 1 ม."],
    ["green", "ปกติ"],
    ["unknown", "ไม่มีข้อมูลตลิ่ง"],
  ];
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {items.map(([l, t]) => (
        <li key={l} className="flex items-center gap-1.5">
          <span className={`size-2.5 rounded-full ${levelDot(l)}`} aria-hidden />
          {t}
        </li>
      ))}
    </ul>
  );
}

function Branch({ id, title, dam, damName, stations }: { id: string; title: string; dam?: Dam; damName: string; stations: Station[] }) {
  return (
    <section id={id} className="scroll-mt-20 rounded-2xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-muted">{title}</h2>
      <Line>
        <Hub
          title={damName}
          square
          sub={dam ? `ข้อมูลวันที่ ${dam.date}` : "ไม่มีข้อมูลเขื่อน"}
          extra={dam && <DamFacts dam={dam} />}
        />
        {stations.map((x) => <StationNode key={x.code} s={x} tributary={TRIBUTARY.has(x.code)} />)}
        <li className="relative pb-0 pl-6 text-xs text-muted">
          <span className="absolute -left-[7px] top-0.5 text-river" aria-hidden>▼</span>
          ไหลลงจุดรวมแม่น้ำ จ.กาญจนบุรี
        </li>
      </Line>
    </section>
  );
}

function DamFacts({ dam }: { dam: Dam }) {
  const level: Level = dam.pct >= 98 && dam.netMcm > 0 ? "orange" : dam.pct >= 95 ? "yellow" : "green";
  return (
    <div className="mt-1 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <Badge level={level}>ความจุ {fmt(dam.pct, 1)}%</Badge>
        <span className="tnum text-xs text-muted">
          เข้า ≈{fmt(dam.inflowCms)} · ระบาย ≈{fmt(dam.outflowCms)} ลบ.ม./วิ
        </span>
      </div>
      <p className="text-xs text-muted">
        {dam.daysToFull !== null ? `ถึงระดับเก็บกักในราว ${fmt(dam.daysToFull, 1)} วัน ถ้าน้ำเข้าเท่านี้` : "น้ำในอ่างไม่เพิ่ม"}
      </p>
    </div>
  );
}

function Line({ children }: { children: React.ReactNode }) {
  return <ol className="relative ml-2 border-l-4 border-river">{children}</ol>;
}

function Hub({ id, title, sub, extra, square, last }: { id?: string; title: string; sub?: string; extra?: React.ReactNode; square?: boolean; last?: boolean }) {
  return (
    <li id={id} className={`relative scroll-mt-20 pl-6 ${last ? "" : "pb-5"}`}>
      <span
        className={`absolute -left-[12px] top-0.5 size-5 border-4 border-river bg-surface ${square ? "rounded-md" : "rounded-full"}`}
        aria-hidden
      />
      <h3 className="font-bold leading-snug">{title}</h3>
      {sub && <p className="text-xs text-muted">{sub}</p>}
      {extra}
    </li>
  );
}

function SegmentLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <li id={id} className="relative scroll-mt-20 pb-3 pl-6">
      <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">{children}</span>
    </li>
  );
}

function StationNode({ s, km, tributary }: { s: Station; km?: number; tributary?: boolean }) {
  return (
    <li className="relative pb-5 pl-6">
      <span
        className={`absolute -left-[10px] top-1.5 size-4 rounded-full ring-4 ring-surface ${s.stale ? "bg-unknown" : levelDot(s.level)}`}
        aria-hidden
      />
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div>
          <h3 className="font-semibold leading-snug">
            <Link href={`/stations/${encodeURIComponent(s.code)}`} className="hover:text-accent hover:underline">{s.name}</Link>
            {s.isKey && <span className="ml-1.5 rounded bg-accent/10 px-1.5 py-0.5 align-middle text-[0.65rem] font-semibold text-accent">สถานีหลัก</span>}
          </h3>
          <p className="text-xs text-muted">
            {s.code}
            {tributary && " · ลำน้ำสาขา (ลำตะเพิน)"}
            {CANAL_STATIONS.has(s.code) && " · สถานีในคลอง (ไม่ใช่แม่น้ำสายหลัก)"}
            {s.source && ` · ${s.source}`}
          </p>
        </div>
        <Badge level={s.stale ? "unknown" : s.level}>{s.stale ? "ข้อมูลเก่า" : s.label}</Badge>
      </div>

      <dl className="tnum mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <div className="flex gap-1">
          <dt className="text-muted">เทียบตลิ่ง</dt>
          <dd className={`font-semibold ${levelText(s.level)}`}>{s.diffBank === null ? "-" : `${fmtSigned(s.diffBank)} ม.`}</dd>
        </div>
        {s.q !== null && (
          <div className="flex gap-1">
            <dt className="text-muted">ปริมาณ</dt>
            <dd className="font-semibold">
              {fmt(s.q)}
              {s.qPct !== null && (
                <span className={`ml-1 text-xs font-normal ${s.qPct > 100 ? "text-red" : "text-muted"}`}>({s.qPct}% ของความจุ)</span>
              )}
            </dd>
          </div>
        )}
        <Trend trend={s.trend} />
      </dl>

      <div className="mt-0.5 flex flex-wrap gap-x-3">
        <Measured time={s.time} ageMin={s.ageMin} stale={s.stale} />
        {km !== undefined && (
          <span className="text-xs text-muted">
            {km} กม. จากเขื่อนแม่กลอง · มวลน้ำถึง ~{fmt(travelHours(km))} ชม.
          </span>
        )}
      </div>
    </li>
  );
}
