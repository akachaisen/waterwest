import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSnapshot } from "@/lib/data";
import { getStationHistory, summarize } from "@/lib/history";
import { bankText, changeText, fmt, fmtTime } from "@/lib/status";
import { KM_FROM_MAEKLONG_DAM, SEGMENTS, travelHours } from "@/lib/route";
import { Badge, Card, levelText, Measured, Trend } from "@/components/ui";
import { LineChart } from "@/components/LineChart";
import { HouseThreshold } from "@/components/HouseThreshold";

export const revalidate = 300;

type Params = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { code } = await params;
  return { title: `สถานี ${decodeURIComponent(code)}` };
}

const ORIGIN: Record<string, string> = {
  supabase: "ฐานข้อมูล WaterWest (ค่าเฉลี่ยรายชั่วโมง)",
  thaiwater: "ThaiWater (สสน.) ดึงสด เฉลี่ยรายชั่วโมง",
  none: "ไม่มีข้อมูลย้อนหลังจากแหล่งสาธารณะ — จะสะสมจากการดึงข้อมูลทุก 15 นาที",
};

export default async function StationPage({ params }: Params) {
  const code = decodeURIComponent((await params).code);
  const s = await getSnapshot();
  const st = s.stations.find((x) => x.code === code);
  if (!st) notFound();

  const h = await getStationHistory(code, 7).catch(() => ({ diff: [], q: [], origin: "none" as const }));
  const sd = summarize(h.diff);
  const sq = summarize(h.q);
  const km = KM_FROM_MAEKLONG_DAM[code];

  return (
    <div className="space-y-5">
      <nav className="text-xs text-muted">
        <Link href="/stations" className="hover:text-accent">สถานีวัดน้ำ</Link> / {SEGMENTS[st.seg] ?? st.seg}
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{st.name}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {st.code}
            {st.source && ` · ${st.source}`}
            {km !== undefined && ` · ${km} กม. จากเขื่อนแม่กลอง (มวลน้ำถึง ~${fmt(travelHours(km))} ชม.)`}
          </p>
        </div>
        <Badge level={st.stale ? "unknown" : st.level}>{st.stale ? "ข้อมูลเก่า" : st.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="เทียบตลิ่งตอนนี้" value={st.diffBank === null ? "-" : bankText(st.diffBank)} tone={levelText(st.level)}>
          <Trend trend={st.trend} />
        </Stat>
        <Stat label="สูงสุดใน 7 วัน" value={sd ? bankText(sd.max.v) : "-"}>
          {sd && <span className="text-xs text-muted">{fmtTime(new Date(sd.max.t).toISOString())}</span>}
        </Stat>
        <Stat label="เปลี่ยนใน 24 ชม." value={sd?.change24h != null ? changeText(sd.change24h) : "-"} />
        <Stat label="ปริมาณน้ำ" value={st.q === null ? "-" : `${fmt(st.q)}`}>
          <span className="text-xs text-muted">
            ลบ.ม./วิ{st.capacity ? ` · ความจุลำน้ำ ${fmt(st.capacity)} (${st.qPct}%)` : ""}
          </span>
        </Stat>
      </div>
      <Measured time={st.time} ageMin={st.ageMin} stale={st.stale} />
      {st.diffBank !== null && <HouseThreshold code={st.code} name={st.name} diffBank={st.diffBank} time={st.time} />}

      <Card>
        <h2 className="mb-1 text-base font-semibold">ระดับน้ำเทียบตลิ่ง 7 วัน</h2>
        <p className="mb-3 text-xs text-muted">ค่าบวก = สูงกว่าตลิ่ง (ล้นตลิ่ง) · เส้นแดง = ระดับตลิ่ง</p>
        <LineChart
          title="ระดับน้ำเทียบตลิ่ง"
          unit="ม."
          decimals={2}
          signed
          series={[{ key: "diff", name: "เทียบตลิ่ง", color: "var(--series-1)", points: h.diff.map((p) => [p.t, p.v]) }]}
          refs={[{ y: 0, label: "ตลิ่ง", color: "var(--red)" }]}
        />
      </Card>

      {sq && (
        <Card>
          <h2 className="mb-1 text-base font-semibold">ปริมาณน้ำ 7 วัน</h2>
          <p className="mb-3 text-xs text-muted">ลบ.ม./วินาที{st.capacity ? " · เส้นส้ม = ความจุลำน้ำ" : ""}</p>
          <LineChart
            title="ปริมาณน้ำ"
            unit="ลบ.ม./วิ"
            series={[{ key: "q", name: "ปริมาณน้ำ", color: "var(--series-1)", points: h.q.map((p) => [p.t, p.v]) }]}
            refs={st.capacity ? [{ y: st.capacity, label: "ความจุ", color: "var(--orange)" }] : []}
          />
        </Card>
      )}

      <p className="text-xs text-muted">ข้อมูลกราฟ: {ORIGIN[h.origin]}</p>
    </div>
  );
}

function Stat({ label, value, tone = "", children }: { label: string; value: string; tone?: string; children?: React.ReactNode }) {
  return (
    <Card className="p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`tnum mt-0.5 text-xl font-bold ${tone}`}>{value}</p>
      {children}
    </Card>
  );
}
