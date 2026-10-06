// ตัวดึงข้อมูลจากแต่ละแหล่ง — แต่ละฟังก์ชันคืนค่าข้อมูลที่แปลงแล้ว หรือ throw ถ้าดึงไม่ได้

const UA = 'WaterWest/0.1 (non-commercial Mae Klong flood monitoring)';

async function get(url, { type = 'json', timeout = 60000 } = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  if (type === 'json') return res.json();
  if (type === 'text') return res.text();
  return res;
}

const num = (v) => {
  if (v === null || v === undefined || v === '' || v === '-' || v === 'N/A') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

// "2026-10-02 19:00" (เวลาไทย) → ISO +07:00
const twTime = (s) => (s ? `${s.replace(' ', 'T')}:00+07:00` : null);

// ThaiWater (สสน.) — ระดับน้ำทั่วประเทศ
export async function fetchThaiWater() {
  const j = await get('https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load', { timeout: 90000 });
  const out = new Map();
  for (const r of j.waterlevel_data.data) {
    const s = r.station;
    const wl = num(r.waterlevel_msl);
    const bank = num(s.min_bank);
    const prev = num(r.waterlevel_msl_previous);
    out.set(s.tele_station_oldcode, {
      source: 'ThaiWater',
      agency: r.agency?.agency_shortname?.th ?? null,
      name: s.tele_station_name?.th ?? null,
      river: r.river_name ?? null,
      province: r.geocode?.province_name?.th ?? null,
      lat: s.tele_station_lat, lon: s.tele_station_long,
      time: twTime(r.waterlevel_datetime),
      wl_msl: wl,
      bank_msl: bank,
      diff_bank: wl !== null && bank ? +(wl - bank).toFixed(2) : null,
      q: num(r.discharge),
      q_max: num(s.qmax),
      pct_bank: num(r.storage_percent),
      trend: wl !== null && prev !== null ? (wl > prev + 0.01 ? 'เพิ่มขึ้น' : wl < prev - 0.01 ? 'ลดลง' : 'คงที่') : null,
    });
  }
  return out;
}

// กรมชลประทาน SWOC — สถานีวัดน้ำเทียบตลิ่ง
export async function fetchSwoc() {
  const j = await get('https://bigdata-swoc.rid.go.th/api/ma/pier/all/get_pier_data?date=&basin=&province=&region=&rid=', { timeout: 90000 });
  const out = new Map();
  for (const r of j.data) {
    out.set(r.station_code, {
      source: 'RID-SWOC',
      agency: r.agency ?? null,
      name: r.station_detail?.trim() ?? null,
      river: r.river ?? null,
      province: r.province_t ?? null,
      lat: r.latitude, lon: r.longitude,
      time: r.hourly_time_utc,
      wl_msl: num(r.wl_values_msl),
      bank_msl: num(r.brae_level_msl),
      diff_bank: num(r.pier_diff),
      q: num(r.q_values),
      q_max: num(r.q_max),
      pct_bank: num(r.wl_percent),
      trend: r.wl_trend ?? null,
      q_trend: r.q_trend ?? null,
      wl_change_24h: num(r.wlval_diff_yd),
    });
  }
  return out;
}

// กฟผ. — ตารางโทรมาตรลุ่มน้ำแม่กลอง (HTML) ใช้เอาความจุลำน้ำ + สถานีเขื่อนแม่กลอง
export async function fetchEgat() {
  const html = await get('https://water.egat.co.th/telemeter/schematic/index.php', { type: 'text' });
  const out = new Map();
  const rowRe = /<tr><td>\d+<\/td>(.*?)<\/tr>/g;
  for (const m of html.matchAll(rowRe)) {
    const cells = [...m[1].matchAll(/<td>(.*?)<\/td>/g)].map((c) => c[1].trim());
    if (cells.length < 7) continue;
    const [code, name, wl_m, wl_msl, q, when, cap] = cells;
    // "02-10-2569 20:00:00" (พ.ศ.) → ISO
    const t = when.match(/(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})/);
    const time = t ? `${+t[3] - 543}-${t[2]}-${t[1]}T${t[4]}:${t[5]}:00+07:00` : null;
    if (!out.has(code)) out.set(code, { name, wl_m: num(wl_m), wl_msl: num(wl_msl), q: num(q), time, capacity: num(cap) });
  }
  if (out.size === 0) throw new Error('อ่านตาราง กฟผ. ไม่ได้ (รูปแบบหน้าเว็บอาจเปลี่ยน)');
  return out;
}

// กรมชลประทาน — อ่างเก็บน้ำขนาดใหญ่ (หน่วย ล้าน ลบ.ม. / ล้าน ลบ.ม.ต่อวัน)
// สำรอง: ถ้าเรียก กรมชลฯ ไม่ได้ (เช่น Deno บน Supabase ไม่รองรับ cipher แบบ CBC ของเว็บ กรมชลฯ) ใช้ข้อมูลเขื่อนชุดเดียวกันจาก ThaiWater
export async function fetchRidDams(dams = []) {
  try {
    const j = await get('https://app.rid.go.th/reservoir/api/dam/public');
    const out = new Map();
    for (const reg of j.data) for (const d of reg.dam) out.set(d.id, { ...d, date: j.date, via: 'RID' });
    // ช่วงเช้ากรมชลฯ อาจลงรายการของวันใหม่ไว้ก่อนแต่ยังไม่มีตัวเลข (ค่าว่าง/0) — ถือว่าไม่ได้ข้อมูล แล้วไปใช้ ThaiWater
    if (dams.some((k) => !(out.get(k.id)?.percent_storage > 0))) throw new Error(`ข้อมูลเขื่อนกรมชลฯ วันที่ ${j.date} ยังไม่ครบ`);
    return out;
  } catch (e) {
    if (!dams.length) throw e;
    const j = await get('https://api-v3.thaiwater.net/api/v1/thaiwater30/public/thailand_main', { timeout: 90000 });
    const out = new Map();
    for (const x of j.dam.data.data) {
      const d = dams.find((k) => k.twId === x.dam?.id);
      if (!d) continue;
      out.set(d.id, {
        id: d.id, name: d.name, date: x.dam_date, via: 'ThaiWater',
        storage: x.dam.normal_storage, volume: x.dam_storage, percent_storage: x.dam_storage_percent,
        inflow: x.dam_inflow, outflow: x.dam_released,
      });
    }
    if (!out.size) throw e;
    return out;
  }
}

// กรมชลประทาน — ข้อมูลอุทกวิทยารายชั่วโมง (hyd-app.rid.go.th) ศูนย์อุทกวิทยาภาคตะวันตก (Utok 7) ลุ่มน้ำแม่กลอง (Basin 14)
// สาธารณะ ไม่ต้องเข้าระบบ · ค่าใหม่กว่า SWOC ราว 1–2 ชม. · 20 สถานี มีระดับน้ำ ตลิ่ง (จากหัวคอลัมน์) และปริมาณน้ำ
// หัวคอลัมน์ระดับ: "ระดับตลิ่ง 8.00 ม. ZG+60.600 ม.(รสม.)" → ตลิ่ง (ไม้วัด) และศูนย์เสาระดับ ZG (ม.รทก.)
const HYD = 'https://hyd-app.rid.go.th/webservice';
const thaiDateBE = (d) => {
  const t = new Date(d.getTime() + 7 * 36e5);
  return `${String(t.getUTCDate()).padStart(2, '0')}/${String(t.getUTCMonth() + 1).padStart(2, '0')}/${t.getUTCFullYear() + 543}`;
};
async function hydPost(path, body, form = false) {
  const res = await fetch(`${HYD}/${path}`, {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json; charset=utf-8' },
    body,
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
  return res.json();
}
export async function fetchRidHourly(now = new Date()) {
  const day = async (d) => {
    const tc = thaiDateBE(d);
    const dw = { UtokID: '7', BasinID: '14', TimeCurrent: tc };
    const model = await hydPost('HDService.svc/GetColModelAllHL', JSON.stringify({ hydro: dw }));
    const form = new URLSearchParams({ 'DW[UtokID]': '7', 'DW[BasinID]': '14', 'DW[TimeCurrent]': tc, _search: 'false', rows: '100', page: '1', sidx: 'indexhourly', sord: 'asc' });
    const data = await hydPost('getGroupHourlyWaterLevelReportAllHL.ashx', form.toString(), true);
    return { model, rows: data.rows ?? [], date: new Date(now.getTime() + 7 * 36e5 - (now - d)) };
  };
  const parse = ({ model, rows }, d) => {
    const codes = model.groupHeadersStationCode.map((x) => x.titleText.trim());
    const prov = (model.groupHeadersStationProvince ?? []).map((x) => x.titleText);
    const out = new Map();
    codes.forEach((code, i) => {
      const n = i + 1;
      const wlLabel = model.colModel.find((c) => c.name === `wlvalues${n}`)?.label ?? '';
      const qLabel = model.colModel.find((c) => c.name === `qvalues${n}`)?.label ?? '';
      const bank = num(wlLabel.match(/ระดับตลิ่ง\s*(-?[\d.]+)/)?.[1]);
      const zg = num(wlLabel.match(/ZG\s*([+-]?[\d.]+)/)?.[1]);
      const qMax = num(qLabel.match(/ปริมาณ\s*([\d.]+)/)?.[1]);
      const pts = rows.filter((r) => r[`wlvalues${n}`] !== null && r[`wlvalues${n}`] !== undefined);
      if (!pts.length) return;
      const last = pts[pts.length - 1];
      const prev3 = pts.length > 3 ? pts[pts.length - 4] : pts[0];
      const wl = +Number(last[`wlvalues${n}`]).toFixed(2);
      const ch = wl - Number(prev3[`wlvalues${n}`]);
      const hour = Number(last.hourlytime);
      // เวลาในตาราง = ชั่วโมงของวันนั้น (เวลาไทย) · 24.00 = เที่ยงคืนวันถัดไป
      const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour - 7));
      out.set(code, {
        source: 'RID-HYD',
        time: t.toISOString(),
        wl_msl: zg !== null ? +(zg + wl).toFixed(3) : null,
        bank_msl: zg !== null && bank !== null ? +(zg + bank).toFixed(3) : null,
        diff_bank: bank !== null ? +(wl - bank).toFixed(3) : null,
        pct_bank: null,
        trend: pts.length < 2 ? null : ch > 0.02 ? 'เพิ่มขึ้น' : ch < -0.02 ? 'ลดลง' : 'คงที่',
        q: num(last[`qvalues${n}`]),
        q_max: qMax,
        province: prov[i] ?? null,
      });
    });
    return out;
  };
  const thaiToday = new Date(now.getTime() + 7 * 36e5);
  const today = parse(await day(now), thaiToday);
  if (today.size >= 5) return today;
  // หลังเที่ยงคืนตารางวันใหม่ยังว่าง → ใช้ของเมื่อวาน
  const y = new Date(now.getTime() - 86400e3);
  return parse(await day(y), new Date(y.getTime() + 7 * 36e5));
}

// ปภ. — ระบบเฝ้าระวังภัยพิบัติตามลุ่มน้ำ (cctv.disaster.go.th) · สถานีวัดระดับน้ำ (ไม้วัด) พร้อมกล้อง อัปเดตทุก 5 นาที
// ระดับน้ำเป็นค่าไม้วัดของแต่ละสถานี → ใช้ "เทียบตลิ่ง" (ระดับ − ตลิ่ง ในหน่วยเดียวกัน) · wl_msl คำนวณจากระดับตลิ่ง ม.รทก. ของ ปภ.
// เวลาวัดใช้ histories[0].timeStamp (UTC) จากหน้ารายละเอียดสถานี
const DDPM = 'https://cctv.disaster.go.th/api/v1';
export async function fetchDdpm(codes, provinces = ['71', '70', '75', '74']) {
  const want = new Set(codes);
  const lists = await Promise.all(provinces.map((p) => get(`${DDPM}/stations?provCode=${p}&limit=100`, { timeout: 30000 })));
  const found = lists.flatMap((l) => l.data ?? []).filter((s) => want.has(s.code));
  const out = new Map();
  await Promise.all(
    found.map(async (s) => {
      const raw = await get(`${DDPM}/stations/${encodeURIComponent(s.code)}`, { timeout: 30000 });
      const d = raw?.data ?? raw ?? {};
      const h = d.histories?.[0];
      const level = num(h?.level ?? s.currentWaterLevel);
      const bank = num(s.riverBankLevel);
      if (!h || h.isOnline === 0 || s.status !== 1 || level === null) return; // สถานีออฟไลน์/ไม่มีค่า
      const diff = bank !== null ? +(level - bank).toFixed(3) : null;
      const bankMsl = num(s.dpmRiverBankLevel);
      out.set(s.code, {
        source: 'DDPM',
        time: h.timeStamp ? new Date(`${String(h.timeStamp).replace(/Z?$/, 'Z')}`).toISOString() : null,
        wl_msl: bankMsl && diff !== null ? +(bankMsl + diff).toFixed(3) : null,
        bank_msl: bankMsl || null,
        diff_bank: diff,
        pct_bank: null,
        trend: null,
        q: null,
        river: s.basin ?? null,
        province: s.provName ?? null,
        lat: num(s.latitude),
        lon: num(s.longitude),
        ddpm_status: s.waterLevelStatus ?? null, // ป้ายระดับของ ปภ. 1–5
      });
    }),
  );
  return out;
}

// Open-Meteo — ฝนรายวัน (เมื่อวาน + 3 วันข้างหน้า)
export async function fetchRain(points) {
  const lat = points.map((p) => p.lat).join(',');
  const lon = points.map((p) => p.lon).join(',');
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,precipitation_probability_max&timezone=Asia%2FBangkok&past_days=1&forecast_days=4`;
  const j = await get(url);
  const arr = Array.isArray(j) ? j : [j];
  return points.map((p, i) => ({
    ...p,
    days: arr[i].daily.time.map((d, k) => ({
      date: d,
      mm: arr[i].daily.precipitation_sum[k],
      prob: arr[i].daily.precipitation_probability_max[k],
    })),
  }));
}

// Open-Meteo Marine — ระดับน้ำทะเลแบบจำลอง (ค่าประมาณ ไม่ใช่ตารางน้ำทางการ)
export async function fetchSeaLevel(p) {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${p.lat}&longitude=${p.lon}&hourly=sea_level_height_msl&timezone=Asia%2FBangkok&forecast_days=2`;
  const j = await get(url);
  const now = Date.now();
  const rows = j.hourly.time
    .map((t, i) => ({ time: `${t}:00+07:00`, m: j.hourly.sea_level_height_msl[i] }))
    .filter((r) => r.m !== null && new Date(r.time).getTime() >= now - 3600e3)
    .slice(0, 24);
  const peak = rows.reduce((a, b) => (b.m > a.m ? b : a), rows[0]);
  return { ...p, next24h: rows, peak };
}

// CCTV — ตรวจว่ากล้องตอบสนอง (ไม่ดาวน์โหลดเก็บ)
export async function checkCctv(cams) {
  return Promise.all(
    cams.map(async (c) => {
      try {
        const res = await get(`${c.url}?t=${Date.now()}`, { type: 'raw', timeout: 20000 });
        const buf = await res.arrayBuffer();
        return { ...c, ok: true, contentType: res.headers.get('content-type'), bytes: buf.byteLength };
      } catch (e) {
        return { ...c, ok: false, error: String(e.message ?? e) };
      }
    }),
  );
}
