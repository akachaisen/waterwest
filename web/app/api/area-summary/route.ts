import type { NextRequest } from "next/server";
import { analyze, nearestTambon, resolvePlace } from "@/lib/area";
import { getSnapshot } from "@/lib/data";
import { LEVEL_TEXT } from "@/lib/status";

// สรุปสั้นของพื้นที่หนึ่ง สำหรับการ์ด "แถวบ้านคุณ" หน้าแรก
//  ?href=/area/<id>[?lat=..&lon=..]  หรือ  ?lat=..&lon=.. (ใช้ตำแหน่ง → ตำบลที่ใกล้ที่สุด ไม่เก็บพิกัด)
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  let href = q.get("href") ?? "";
  if (!href && q.get("lat") && q.get("lon")) {
    const t = nearestTambon(Number(q.get("lat")), Number(q.get("lon")));
    if (!t) return Response.json({ error: "outside" }, { status: 404 });
    href = `/area/${t.id}`;
  }
  const u = new URL(href, "http://x");
  const m = u.pathname.match(/^\/area\/([^/]+)$/);
  const place = m ? resolvePlace(decodeURIComponent(m[1]), u.searchParams.get("lat") ?? undefined, u.searchParams.get("lon") ?? undefined) : null;
  if (!place) return Response.json({ error: "not found" }, { status: 404 });

  const s = await getSnapshot();
  const r = analyze(place, s);
  return Response.json(
    {
      href: `${u.pathname}${u.search}`,
      name: place.name,
      sub: place.sub,
      // ไม่มีสถานีอ้างอิง = ประเมินไม่ได้ (ไม่แสดงว่า "ปกติ")
      level: r.ref ? r.level : "unknown",
      levelText: r.ref ? LEVEL_TEXT[r.level] : "ไม่มีข้อมูล",
      river: { name: r.river.name, distKm: Math.round(r.river.distKm * 10) / 10, type: r.river.type },
      ref: r.ref ? { code: r.ref.code, name: r.ref.name, diffBank: r.ref.diffBank, trend: r.ref.trend, time: r.ref.time, stale: r.ref.stale, sign: r.ref.sign } : null,
      eta: r.eta ? { from: r.eta.from.name, hours: Math.round(r.eta.hours), at: r.eta.at } : null,
      tide: r.tide,
      generatedAt: s.generatedAt,
    },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } },
  );
}
