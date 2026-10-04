import type { Metadata } from "next";
import { getSnapshot } from "@/lib/data";
import { latestMaeklongRelease } from "@/lib/announcements";
import { getDamHistory, getStationHistory } from "@/lib/history";
import { fmt, fmtTime } from "@/lib/status";
import type { Dam, Level } from "@/lib/types";
import { Badge, Card, Meter } from "@/components/ui";
import { LineChart } from "@/components/LineChart";
import { CameraGrid } from "@/components/CameraGrid";
import { CAMERAS, type Camera } from "@/lib/places";

export const revalidate = 300;
export const metadata: Metadata = { title: "เขื่อน" };

const DAY = (d: string) => new Date(`${d}T12:00:00+07:00`).getTime();

export default async function DamsPage() {
  const s = await getSnapshot();
  const vrk = s.dams.find((d) => d.id === "200402");
  const snr = s.dams.find((d) => d.id === "200401");
  const [vrkH, snrH, k55, official] = await Promise.all([
    getDamHistory("200402", 30).catch(() => []),
    getDamHistory("200401", 30).catch(() => []),
    getStationHistory("K.55A", 7).catch(() => null),
    latestMaeklongRelease(),
  ]);
  const k55now = s.stations.find((x) => x.code === "K.55A");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">เขื่อน</h1>
        <p className="mt-1 text-sm text-muted">เขื่อนต้นน้ำ 2 แห่ง และน้ำที่ปล่อยผ่านเขื่อนแม่กลอง · ข้อมูลอ่างเก็บน้ำจากกรมชลประทาน (รายวัน)</p>
      </div>

      {vrk && <DamSection dam={vrk} river="แม่น้ำแควน้อย" history={vrkH} cameras={CAMERAS.filter((c) => c.dam === "VRK")} />}
      {snr && <DamSection dam={snr} river="แม่น้ำแควใหญ่" history={snrH} cameras={CAMERAS.filter((c) => c.dam === "SNR")} />}

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">เขื่อนแม่กลอง (ท่าม่วง)</h2>
            <p className="text-xs text-muted">ไม่มีข้อมูลการระบายแบบเปิด · ใช้ปริมาณน้ำที่ K.55A สะพานค่ายหลวง บ้านโป่ง (ท้ายน้ำ ~32 กม.) แทน</p>
          </div>
          {k55now && <Badge level={k55now.level}>{k55now.label}</Badge>}
        </div>
        {official && (
          <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm">
            <b>ประกาศทางการ:</b> ระบาย {fmt(official.maeklong_cms)} ลบ.ม./วิ · มีผล {fmtTime(official.effective_at)}
            {official.source_url && (
              <a href={official.source_url} target="_blank" rel="noopener noreferrer nofollow" className="ml-1 text-accent underline">แหล่งข่าว</a>
            )}
          </p>
        )}
        {k55now?.q != null && (
          <p className="tnum mt-3 text-2xl font-bold">
            {fmt(k55now.q)} <span className="text-sm font-normal text-muted">ลบ.ม./วิ · {fmtTime(k55now.time)}</span>
          </p>
        )}
        <div className="mt-3">
          <LineChart
            title="ปริมาณน้ำท้ายเขื่อนแม่กลอง"
            unit="ลบ.ม./วิ"
            series={[{ key: "q", name: "K.55A บ้านโป่ง", color: "var(--series-1)", points: (k55?.q ?? []).map((p) => [p.t, p.v]) }]}
            refs={[
              { y: 2500, label: "2,500", color: "var(--orange)" },
              { y: 3000, label: "3,000", color: "var(--red)" },
            ]}
          />
        </div>
        <p className="mt-2 text-xs text-muted">เส้นส้ม 2,500 = เฝ้าระวัง · เส้นแดง 3,000 = วิกฤต (เกณฑ์ต้นแบบของ WaterWest ไม่ใช่เกณฑ์ทางการ)</p>
      </Card>

      <Card>
        <h2 className="mb-1 text-base font-semibold">ผังน้ำลุ่มแม่กลอง (กฟผ.)</h2>
        <p className="mb-3 text-xs text-muted">
          ภาพสดจาก{" "}
          <a href="https://water.egat.co.th/telemeter/schematic/index.php" target="_blank" rel="noopener noreferrer" className="text-accent underline">
            ระบบโทรมาตร กฟผ.
          </a>{" "}
          · ข้อมูลเป็นของ กฟผ.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element -- ภาพสร้างสดจาก server กฟผ. */}
        <img
          src="https://water.egat.co.th/telemeter/schematic/tele_mk_anni.php"
          alt="ผังน้ำระบบโทรมาตรลุ่มน้ำแม่กลอง ของ กฟผ. แสดงระดับและปริมาณน้ำเขื่อนและสถานี"
          className="w-full rounded-lg border border-border bg-white"
          loading="lazy"
        />
      </Card>
    </div>
  );
}

function DamSection({ dam, river, history, cameras }: { dam: Dam; river: string; history: Awaited<ReturnType<typeof getDamHistory>>; cameras: Camera[] }) {
  const level: Level = dam.pct >= 98 && dam.netMcm > 0 ? "orange" : dam.pct >= 95 ? "yellow" : "green";
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">{dam.name}</h2>
          <p className="text-xs text-muted">{river} · ข้อมูลวันที่ {dam.date}</p>
        </div>
        <Badge level={level}>{fmt(dam.pct, 1)}% ของระดับเก็บกัก</Badge>
      </div>

      <div className="mt-3">
        <Meter value={dam.pct} max={100} level={level} />
      </div>
      <dl className="tnum mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Fact label="ปริมาตร" value={`${fmt(dam.volume)}`} unit={`/ ${fmt(dam.normalStorage)} ล้าน ลบ.ม.`} />
        <Fact label="ที่ว่างเหลือ" value={fmt(dam.freeMcm)} unit="ล้าน ลบ.ม." />
        <Fact label="ไหลเข้า" value={`≈${fmt(dam.inflowCms)}`} unit={`ลบ.ม./วิ (${fmt(dam.inflowMcm, 2)} ล้าน/วัน)`} />
        <Fact label="ระบาย" value={`≈${fmt(dam.outflowCms)}`} unit={`ลบ.ม./วิ (${fmt(dam.outflowMcm, 2)} ล้าน/วัน)`} />
      </dl>
      <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${dam.daysToFull !== null && dam.daysToFull < 7 ? "bg-orange-bg" : "bg-surface-2"}`}>
        {dam.daysToFull !== null
          ? `ถ้าน้ำไหลเข้าและระบายเท่าวันนี้ อ่างจะถึงระดับเก็บกักในราว ${fmt(dam.daysToFull, 1)} วัน — ถ้าเต็มต้องระบายเพิ่ม ซึ่งจะเป็นน้ำก้อนใหม่ลงมาท้ายน้ำ`
          : "วันนี้ระบายมากกว่าหรือเท่ากับน้ำไหลเข้า น้ำในอ่างไม่เพิ่ม"}
      </p>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold">ความจุอ่าง 30 วัน (%)</h3>
          <LineChart
            title="ความจุอ่าง"
            unit="%"
            decimals={1}
            daily
            height={200}
            series={[{ key: "pct", name: "ความจุ", color: "var(--series-1)", points: history.map((d) => [DAY(d.date), d.pct]) }]}
            refs={[{ y: 100, label: "เต็ม", color: "var(--red)" }]}
          />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">น้ำไหลเข้า เทียบ ระบาย 30 วัน (ลบ.ม./วิ)</h3>
          <LineChart
            title="น้ำไหลเข้าและระบาย"
            unit="ลบ.ม./วิ"
            daily
            height={200}
            series={[
              { key: "in", name: "ไหลเข้า", color: "var(--series-1)", points: history.map((d) => [DAY(d.date), d.inflowCms]) },
              { key: "out", name: "ระบาย", color: "var(--series-2)", points: history.map((d) => [DAY(d.date), d.outflowCms]) },
            ]}
          />
        </div>
      </div>

      {cameras.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold">กล้อง CCTV (กฟผ.) · โหลดใหม่ทุก 1 นาที</h3>
          <CameraGrid cameras={cameras} />
        </div>
      )}
    </Card>
  );
}

function Fact({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-semibold">
        {value} <span className="text-xs font-normal text-muted">{unit}</span>
      </dd>
    </div>
  );
}
