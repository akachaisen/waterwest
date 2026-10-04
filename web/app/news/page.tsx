import type { Metadata } from "next";
import { listAnnouncements, splitByExpiry } from "@/lib/announcements";
import { NATIONAL, OFFICIAL_LINKS, PROVINCE_DDPM } from "@/lib/contacts";
import { fmt, fmtTime } from "@/lib/status";
import type { Level } from "@/lib/types";
import { Badge, Card, SectionTitle } from "@/components/ui";

export const revalidate = 60;
export const metadata: Metadata = { title: "ประกาศและเบอร์โทร" };

const LEVEL: Record<string, { level: Level; name: string }> = {
  info: { level: "unknown", name: "ข่าวสาร" },
  yellow: { level: "yellow", name: "เฝ้าระวัง" },
  orange: { level: "orange", name: "เตือนภัย" },
  red: { level: "red", name: "วิกฤต" },
};

const tel = (t: string) => `tel:${t.replace(/[^0-9]/g, "")}`;

export default async function NewsPage() {
  const all = await listAnnouncements(30);
  const { current, past } = splitByExpiry(all);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold sm:text-2xl">ประกาศและเบอร์โทร</h1>

      <Card>
        <SectionTitle hint="สรุปจากประกาศทางการ">ประกาศล่าสุด</SectionTitle>
        {current.length === 0 ? (
          <p className="text-sm text-muted">ยังไม่มีประกาศในช่วงนี้ — ติดตามประกาศทางการได้จากลิงก์ด้านล่าง</p>
        ) : (
          <ul className="divide-y divide-border">
            {current.map((a) => (
              <li key={a.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge level={LEVEL[a.level]?.level ?? "unknown"}>{LEVEL[a.level]?.name ?? a.level}</Badge>
                  <span className="text-xs text-muted">มีผล {fmtTime(a.effective_at)}</span>
                </div>
                <p className="mt-1 font-semibold">{a.title}</p>
                {a.maeklong_cms !== null && <p className="tnum text-sm">ระบายเขื่อนแม่กลอง <b>{fmt(a.maeklong_cms)}</b> ลบ.ม./วินาที</p>}
                {a.body && <p className="mt-1 whitespace-pre-line text-sm text-muted">{a.body}</p>}
                {a.source_url && (
                  <a href={a.source_url} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-block text-sm text-accent underline">
                    แหล่งข่าว
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
        {past.length > 0 && (
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-muted">ประกาศที่หมดอายุแล้ว ({past.length})</summary>
            <ul className="mt-1 space-y-1 text-muted">
              {past.map((a) => <li key={a.id}>{fmtTime(a.effective_at)} · {a.title}</li>)}
            </ul>
          </details>
        )}
      </Card>

      <Card>
        <SectionTitle>เบอร์ฉุกเฉิน</SectionTitle>
        <ul className="grid gap-2 sm:grid-cols-2">
          {NATIONAL.map((c) => (
            <li key={c.tel}>
              <a href={tel(c.tel)} className="block rounded-xl border border-border px-3 py-2 hover:border-accent">
                <span className="block text-xs text-muted">{c.name}</span>
                <span className="tnum font-semibold">{c.tel}</span>
                {c.note && <span className="block text-xs text-muted">{c.note}</span>}
              </a>
            </li>
          ))}
        </ul>
        <h3 className="mb-2 mt-4 text-sm font-semibold">สำนักงานป้องกันและบรรเทาสาธารณภัยจังหวัด</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {Object.entries(PROVINCE_DDPM).map(([p, c]) => (
            <li key={p} className="rounded-xl border border-border px-3 py-2">
              <span className="block text-xs text-muted">จ.{p}</span>
              {c ? (
                <a href={tel(c.tel)} className="tnum font-semibold hover:text-accent">{c.note ?? c.tel}</a>
              ) : (
                <span className="text-sm">โทร <a href="tel:1784" className="font-semibold hover:text-accent">1784</a> (ประสานถึงจังหวัด)</span>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">ตรวจสอบจากเว็บไซต์ ปภ. (disaster.go.th) เมื่อ 4 ต.ค. 2569</p>
      </Card>

      <Card>
        <SectionTitle>แหล่งข้อมูลและประกาศทางการ</SectionTitle>
        <ul className="divide-y divide-border">
          {OFFICIAL_LINKS.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-baseline justify-between gap-3 py-2 hover:text-accent">
                <span className="font-semibold">{l.name}</span>
                <span className="shrink-0 text-xs text-muted">{l.note} ↗</span>
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
