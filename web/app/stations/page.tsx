import type { Metadata } from "next";
import Link from "next/link";
import { getSnapshot } from "@/lib/data";
import { getStationHistory } from "@/lib/history";
import { bankText, fmt, fmtTime } from "@/lib/status";
import { SEGMENTS, CONFLUENCE, KHWAE_NOI, KHWAE_YAI, LOWER } from "@/lib/route";
import { Badge, levelDot, levelText } from "@/components/ui";
import { Sparkline } from "@/components/Sparkline";

export const revalidate = 300;
export const metadata: Metadata = { title: "สถานีวัดน้ำ" };

const ORDER = [...KHWAE_NOI, ...KHWAE_YAI, ...CONFLUENCE, ...LOWER];

export default async function StationsPage() {
  const s = await getSnapshot();
  const stations = [...s.stations].sort((a, b) => ORDER.indexOf(a.code) - ORDER.indexOf(b.code));
  const histories = new Map(
    await Promise.all(stations.map(async (x) => [x.code, await getStationHistory(x.code, 2).catch(() => null)] as const)),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">สถานีวัดน้ำ</h1>
        <p className="mt-1 text-sm text-muted">
          {stations.length} สถานีตามเส้นทางน้ำแม่กลอง · เส้นเล็ก = ระดับเทียบตลิ่ง 48 ชม. ล่าสุด · ดึงข้อมูล {fmtTime(s.generatedAt)}
        </p>
      </div>

      {Object.entries(SEGMENTS).map(([seg, name]) => {
        const rows = stations.filter((x) => x.seg === seg);
        if (!rows.length) return null;
        return (
          <section key={seg} className="rounded-2xl border border-border bg-surface">
            <h2 className="border-b border-border px-4 py-2.5 text-sm font-semibold text-muted">{name}</h2>
            <ul className="divide-y divide-border">
              {rows.map((x) => (
                <li key={x.code}>
                  <Link href={`/stations/${encodeURIComponent(x.code)}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                    <span className={`size-2.5 shrink-0 rounded-full ${x.stale ? "bg-unknown" : levelDot(x.level)}`} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{x.name}</span>
                      <span className="block text-xs text-muted">
                        {x.code}
                        {x.q !== null && ` · ${fmt(x.q)} ลบ.ม./วิ`}
                        {x.stale && " · ข้อมูลเก่า"}
                      </span>
                    </span>
                    <span className="hidden sm:block">
                      <Sparkline points={histories.get(x.code)?.diff ?? []} color={`var(--${x.stale ? "unknown" : x.level})`} />
                    </span>
                    <span className="w-24 shrink-0 text-right">
                      <span className={`tnum block text-sm font-semibold ${levelText(x.level)}`}>
                        {x.diffBank === null ? "-" : bankText(x.diffBank)}
                      </span>
                      <Badge level={x.stale ? "unknown" : x.level}>{x.stale ? "ข้อมูลเก่า" : x.label}</Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
