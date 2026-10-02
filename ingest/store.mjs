// บันทึก snapshot ลงฐานข้อมูล Supabase ผ่าน REST (PostgREST) — ไม่ต้องติดตั้ง package
// ต้องตั้งค่า env: SUPABASE_URL, SUPABASE_SECRET_KEY (ถ้าไม่ตั้ง จะข้ามการบันทึก)

export function buildRows(s) {
  const stations = s.stations.map((x) => ({
    code: x.code,
    name: x.name,
    seg: x.seg,
    river: x.river ?? null,
    province: x.province ?? null,
    lat: x.lat ?? null,
    lon: x.lon ?? null,
    capacity: x.capacity ?? null,
    capacity_source: x.capacity_source ?? null,
    is_key: !!x.key,
    updated_at: s.generated_at,
  }));

  const readings = s.stations
    .filter((x) => !x.missing && x.time)
    .map((x) => ({
      station_code: x.code,
      source: x.source,
      measured_at: x.time,
      wl: x.wl_msl,
      bank: x.bank_msl ?? null,
      diff_bank: x.diff_bank,
      pct_bank: x.pct_bank ?? null,
      q: x.q,
      trend: x.trend ?? null,
      qc: x.qc?.length ? x.qc.join('; ') : null,
    }));

  const dam_daily = s.dams
    .filter((d) => !d.missing)
    .map((d) => ({
      dam_id: d.id,
      name: d.name,
      date: d.date,
      volume: d.volume,
      normal_storage: d.normal_storage,
      pct: d.pct,
      inflow_mcm: d.inflow_mcm_day,
      outflow_mcm: d.outflow_mcm_day,
      updated_at: s.generated_at,
    }));

  const issued = new Date(s.generated_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  const rain_forecast = (s.rain ?? []).flatMap((p) =>
    p.days.map((d) => ({ point_id: p.id, forecast_date: d.date, issued_on: issued, mm: d.mm, prob: d.prob, updated_at: s.generated_at })),
  );

  const sea_level = (s.sea?.next24h ?? []).map((r) => ({ point: 'maeklong_mouth', at: r.time, m: r.m, updated_at: s.generated_at }));

  const ingest_runs = [
    {
      started_at: s.generated_at,
      sources: s.sources,
      alerts: s.alerts,
      n_readings: readings.length,
      maeklong_q: s.maeklong_release_proxy?.q ?? null,
    },
  ];

  return { stations, readings, dam_daily, rain_forecast, sea_level, ingest_runs };
}

// ตาราง → คอลัมน์ที่ใช้ตรวจซ้ำ (upsert) · ingest_runs เพิ่มแถวใหม่เสมอ
const CONFLICT = {
  stations: 'code',
  readings: 'station_code,source,measured_at',
  dam_daily: 'dam_id,date',
  rain_forecast: 'point_id,forecast_date,issued_on',
  sea_level: 'point,at',
  ingest_runs: null,
};

export async function store(snapshot, env = process.env) {
  const url = env.SUPABASE_URL?.replace(/\/$/, '');
  const key = env.SUPABASE_SECRET_KEY;
  if (!url || !key) return { skipped: true, reason: 'ยังไม่ได้ตั้งค่า SUPABASE_URL / SUPABASE_SECRET_KEY' };

  const headers = { apikey: key, 'Content-Type': 'application/json' };
  // คีย์แบบเก่า (JWT service_role) ต้องส่ง Authorization ด้วย · คีย์แบบใหม่ sb_secret_ ใช้ apikey อย่างเดียว
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;

  const rows = buildRows(snapshot);
  const result = {};
  // stations ต้องมาก่อน readings (foreign key)
  for (const table of ['stations', 'readings', 'dam_daily', 'rain_forecast', 'sea_level', 'ingest_runs']) {
    const data = rows[table];
    if (!data.length) { result[table] = 0; continue; }
    const onConflict = CONFLICT[table];
    const qs = onConflict ? `?on_conflict=${onConflict}` : '';
    const prefer = onConflict ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal';
    const res = await fetch(`${url}/rest/v1/${table}${qs}`, {
      method: 'POST',
      headers: { ...headers, Prefer: prefer },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`บันทึก ${table} ไม่สำเร็จ: HTTP ${res.status} ${await res.text()}`);
    result[table] = data.length;
  }
  return result;
}
