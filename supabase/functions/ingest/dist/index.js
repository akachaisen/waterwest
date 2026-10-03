// ingest/stations.mjs
var SEGMENTS = [
  { id: "A", name: "\u0E41\u0E04\u0E27\u0E19\u0E49\u0E2D\u0E22 \u0E17\u0E49\u0E32\u0E22\u0E40\u0E02\u0E37\u0E48\u0E2D\u0E19\u0E27\u0E0A\u0E34\u0E23\u0E32\u0E25\u0E07\u0E01\u0E23\u0E13" },
  { id: "B", name: "\u0E41\u0E04\u0E27\u0E43\u0E2B\u0E0D\u0E48 \u0E17\u0E49\u0E32\u0E22\u0E40\u0E02\u0E37\u0E48\u0E2D\u0E19\u0E28\u0E23\u0E35\u0E19\u0E04\u0E23\u0E34\u0E19\u0E17\u0E23\u0E4C/\u0E17\u0E48\u0E32\u0E17\u0E38\u0E48\u0E07\u0E19\u0E32" },
  { id: "C", name: "\u0E08\u0E38\u0E14\u0E23\u0E27\u0E21\u0E41\u0E21\u0E48\u0E19\u0E49\u0E33 \u0E08.\u0E01\u0E32\u0E0D\u0E08\u0E19\u0E1A\u0E38\u0E23\u0E35" },
  { id: "D", name: "\u0E40\u0E02\u0E37\u0E48\u0E2D\u0E19\u0E41\u0E21\u0E48\u0E01\u0E25\u0E2D\u0E07 (\u0E17\u0E48\u0E32\u0E21\u0E48\u0E27\u0E07)" },
  { id: "E", name: "\u0E17\u0E49\u0E32\u0E22\u0E40\u0E02\u0E37\u0E48\u0E2D\u0E19\u0E41\u0E21\u0E48\u0E01\u0E25\u0E2D\u0E07 \u2013 \u0E1A\u0E49\u0E32\u0E19\u0E42\u0E1B\u0E48\u0E07 \u2013 \u0E42\u0E1E\u0E18\u0E32\u0E23\u0E32\u0E21 \u2013 \u0E23\u0E32\u0E0A\u0E1A\u0E38\u0E23\u0E35" },
  { id: "F", name: "\u0E2A\u0E21\u0E38\u0E17\u0E23\u0E2A\u0E07\u0E04\u0E23\u0E32\u0E21 \u2013 \u0E1B\u0E32\u0E01\u0E2D\u0E48\u0E32\u0E27\u0E44\u0E17\u0E22" }
];
var STATIONS = [
  { code: "MKVKD01", src: "tw", egat: "VKD01", seg: "A", name: "\u0E2D.\u0E17\u0E2D\u0E07\u0E1C\u0E32\u0E20\u0E39\u0E21\u0E34" },
  { code: "MKVKD02", src: "tw", egat: "VKD02", seg: "A", name: "\u0E1A\u0E49\u0E32\u0E19\u0E2B\u0E34\u0E19\u0E14\u0E32\u0E14" },
  { code: "K.54", src: "swoc", egat: "VKD03", seg: "A", name: "\u0E1A\u0E49\u0E32\u0E19\u0E25\u0E34\u0E48\u0E19\u0E16\u0E34\u0E48\u0E19 \u0E17\u0E2D\u0E07\u0E1C\u0E32\u0E20\u0E39\u0E21\u0E34" },
  { code: "K.58", src: "swoc", egat: "VKD04", seg: "A", name: "\u0E1A\u0E49\u0E32\u0E19\u0E1B\u0E32\u0E01\u0E41\u0E0B\u0E07 \u0E44\u0E17\u0E23\u0E42\u0E22\u0E04" },
  { code: "K.10", src: "swoc", egat: "VKD05", seg: "A", name: "\u0E1A\u0E49\u0E32\u0E19\u0E25\u0E38\u0E48\u0E21\u0E2A\u0E38\u0E48\u0E21 \u0E44\u0E17\u0E23\u0E42\u0E22\u0E04" },
  { code: "K.37", src: "swoc", egat: "VKD06", seg: "A", name: "\u0E1A\u0E49\u0E32\u0E19\u0E27\u0E31\u0E07\u0E40\u0E22\u0E47\u0E19 \u0E14\u0E48\u0E32\u0E19\u0E21\u0E30\u0E02\u0E32\u0E21\u0E40\u0E15\u0E35\u0E49\u0E22", key: true },
  { code: "K.35A", src: "swoc", egat: "SND02", seg: "B", name: "\u0E1A\u0E49\u0E32\u0E19\u0E2B\u0E19\u0E2D\u0E07\u0E1A\u0E31\u0E27 \u0E40\u0E21\u0E37\u0E2D\u0E07\u0E01\u0E32\u0E0D\u0E08\u0E19\u0E1A\u0E38\u0E23\u0E35", key: true },
  { code: "K.12", src: "swoc", egat: "SND06", seg: "B", name: "\u0E1A\u0E49\u0E32\u0E19\u0E17\u0E38\u0E48\u0E07\u0E19\u0E32\u0E19\u0E32\u0E07\u0E2B\u0E23\u0E2D\u0E01 (\u0E25\u0E33\u0E15\u0E30\u0E40\u0E1E\u0E34\u0E19)" },
  { code: "K.3A", src: "swoc", seg: "C", name: "\u0E2B\u0E19\u0E49\u0E32\u0E28\u0E32\u0E25\u0E32\u0E01\u0E25\u0E32\u0E07 \u0E08.\u0E01\u0E32\u0E0D\u0E08\u0E19\u0E1A\u0E38\u0E23\u0E35" },
  { code: "MKSND03", src: "tw", egat: "SND03", seg: "C", name: "\u0E27\u0E31\u0E14\u0E44\u0E0A\u0E22\u0E0A\u0E38\u0E21\u0E1E\u0E25\u0E0A\u0E19\u0E30\u0E2A\u0E07\u0E04\u0E23\u0E32\u0E21 (\u0E27\u0E31\u0E14\u0E43\u0E15\u0E49)" },
  { code: "K.11A", src: "swoc", seg: "E", name: "\u0E1A\u0E49\u0E32\u0E19\u0E27\u0E31\u0E07\u0E02\u0E19\u0E32\u0E22 \u0E17\u0E48\u0E32\u0E21\u0E48\u0E27\u0E07" },
  { code: "K.55A", src: "swoc", seg: "E", name: "\u0E2A\u0E30\u0E1E\u0E32\u0E19\u0E04\u0E48\u0E32\u0E22\u0E2B\u0E25\u0E27\u0E07 \u0E1A\u0E49\u0E32\u0E19\u0E42\u0E1B\u0E48\u0E07", key: true },
  { code: "RAJ002", src: "tw", seg: "E", name: "\u0E1A\u0E49\u0E32\u0E19\u0E42\u0E1B\u0E48\u0E07" },
  { code: "K.56A", src: "swoc", seg: "E", name: "\u0E2A\u0E30\u0E1E\u0E32\u0E19\u0E1A\u0E49\u0E32\u0E19\u0E2B\u0E21\u0E49\u0E2D-\u0E2A\u0E23\u0E49\u0E2D\u0E22\u0E1F\u0E49\u0E32 \u0E42\u0E1E\u0E18\u0E32\u0E23\u0E32\u0E21" },
  { code: "RAJ001", src: "tw", seg: "E", name: "\u0E42\u0E1E\u0E18\u0E32\u0E23\u0E32\u0E21" },
  { code: "K.2B", src: "swoc", seg: "E", name: "\u0E2A\u0E30\u0E1E\u0E32\u0E19\u0E18\u0E19\u0E30\u0E23\u0E31\u0E0A\u0E15\u0E4C \u0E15\u0E31\u0E27\u0E40\u0E21\u0E37\u0E2D\u0E07\u0E23\u0E32\u0E0A\u0E1A\u0E38\u0E23\u0E35", key: true },
  { code: "K.57", src: "swoc", seg: "F", name: "\u0E1A\u0E49\u0E32\u0E19\u0E01\u0E23\u0E30\u0E14\u0E31\u0E07\u0E07\u0E32 \u0E1A\u0E32\u0E07\u0E04\u0E19\u0E17\u0E35" },
  { code: "TK.72", src: "swoc", seg: "F", name: "\u0E27\u0E31\u0E14\u0E1A\u0E32\u0E07\u0E04\u0E19\u0E11\u0E35\u0E43\u0E19" },
  { code: "TK.74", src: "swoc", seg: "F", name: "\u0E42\u0E23\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19\u0E1A\u0E49\u0E32\u0E19\u0E25\u0E32\u0E14\u0E43\u0E2B\u0E0D\u0E48 \u0E40\u0E21\u0E37\u0E2D\u0E07\u0E2A\u0E21\u0E38\u0E17\u0E23\u0E2A\u0E07\u0E04\u0E23\u0E32\u0E21" },
  { code: "MKG006", src: "tw", seg: "F", name: "\u0E1E\u0E23\u0E30\u0E23\u0E32\u0E21\u0E2A\u0E2D\u0E07 \u0E2A\u0E21\u0E38\u0E17\u0E23\u0E2A\u0E07\u0E04\u0E23\u0E32\u0E21" },
  { code: "PTT002", src: "swoc", seg: "F", name: "\u0E2A\u0E30\u0E1E\u0E32\u0E19\u0E02\u0E49\u0E32\u0E21\u0E04\u0E25\u0E2D\u0E07\u0E42\u0E04\u0E19" }
];
var DAMS = [
  { id: "200402", twId: 15, name: "\u0E40\u0E02\u0E37\u0E48\u0E2D\u0E19\u0E27\u0E0A\u0E34\u0E23\u0E32\u0E25\u0E07\u0E01\u0E23\u0E13", short: "VRK" },
  { id: "200401", twId: 14, name: "\u0E40\u0E02\u0E37\u0E48\u0E2D\u0E19\u0E28\u0E23\u0E35\u0E19\u0E04\u0E23\u0E34\u0E19\u0E17\u0E23\u0E4C", short: "SNR" }
];
var RAIN_POINTS = [
  { id: "vrk", name: "\u0E40\u0E2B\u0E19\u0E37\u0E2D\u0E2D\u0E48\u0E32\u0E07\u0E27\u0E0A\u0E34\u0E23\u0E32\u0E25\u0E07\u0E01\u0E23\u0E13", lat: 14.95, lon: 98.55 },
  { id: "snr", name: "\u0E40\u0E2B\u0E19\u0E37\u0E2D\u0E2D\u0E48\u0E32\u0E07\u0E28\u0E23\u0E35\u0E19\u0E04\u0E23\u0E34\u0E19\u0E17\u0E23\u0E4C", lat: 14.85, lon: 98.95 },
  { id: "rbr", name: "\u0E15\u0E31\u0E27\u0E40\u0E21\u0E37\u0E2D\u0E07\u0E23\u0E32\u0E0A\u0E1A\u0E38\u0E23\u0E35 / \u0E40\u0E08\u0E14\u0E35\u0E22\u0E4C\u0E2B\u0E31\u0E01", lat: 13.536, lon: 99.8 }
];
var SEA_POINT = { name: "\u0E1B\u0E32\u0E01\u0E41\u0E21\u0E48\u0E19\u0E49\u0E33\u0E41\u0E21\u0E48\u0E01\u0E25\u0E2D\u0E07", lat: 13.36, lon: 100 };
var CCTV = [
  { id: "vrk1", name: "\u0E2A\u0E31\u0E19\u0E40\u0E02\u0E37\u0E48\u0E2D\u0E19\u0E27\u0E0A\u0E34\u0E23\u0E32\u0E25\u0E07\u0E01\u0E23\u0E13", url: "https://vrkdam.egat.co.th/cctv/image1.php" },
  { id: "vrk2", name: "\u0E17\u0E49\u0E32\u0E22\u0E19\u0E49\u0E33\u0E42\u0E23\u0E07\u0E44\u0E1F\u0E1F\u0E49\u0E32-\u0E41\u0E21\u0E48\u0E19\u0E49\u0E33\u0E41\u0E04\u0E27\u0E19\u0E49\u0E2D\u0E22", url: "https://vrkdam.egat.co.th/cctv/image2.php" }
];

// ingest/sources.mjs
var UA = "WaterWest/0.1 (non-commercial Mae Klong flood monitoring)";
async function get(url, { type = "json", timeout = 6e4 } = {}) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  if (type === "json") return res.json();
  if (type === "text") return res.text();
  return res;
}
var num = (v) => {
  if (v === null || v === void 0 || v === "" || v === "-" || v === "N/A") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};
var twTime = (s) => s ? `${s.replace(" ", "T")}:00+07:00` : null;
async function fetchThaiWater() {
  const j = await get("https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load", { timeout: 9e4 });
  const out = /* @__PURE__ */ new Map();
  for (const r of j.waterlevel_data.data) {
    const s = r.station;
    const wl = num(r.waterlevel_msl);
    const bank = num(s.min_bank);
    const prev = num(r.waterlevel_msl_previous);
    out.set(s.tele_station_oldcode, {
      source: "ThaiWater",
      agency: r.agency?.agency_shortname?.th ?? null,
      name: s.tele_station_name?.th ?? null,
      river: r.river_name ?? null,
      province: r.geocode?.province_name?.th ?? null,
      lat: s.tele_station_lat,
      lon: s.tele_station_long,
      time: twTime(r.waterlevel_datetime),
      wl_msl: wl,
      bank_msl: bank,
      diff_bank: wl !== null && bank ? +(wl - bank).toFixed(2) : null,
      q: num(r.discharge),
      q_max: num(s.qmax),
      pct_bank: num(r.storage_percent),
      trend: wl !== null && prev !== null ? wl > prev + 0.01 ? "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E02\u0E36\u0E49\u0E19" : wl < prev - 0.01 ? "\u0E25\u0E14\u0E25\u0E07" : "\u0E04\u0E07\u0E17\u0E35\u0E48" : null
    });
  }
  return out;
}
async function fetchSwoc() {
  const j = await get("https://bigdata-swoc.rid.go.th/api/ma/pier/all/get_pier_data?date=&basin=&province=&region=&rid=", { timeout: 9e4 });
  const out = /* @__PURE__ */ new Map();
  for (const r of j.data) {
    out.set(r.station_code, {
      source: "RID-SWOC",
      agency: r.agency ?? null,
      name: r.station_detail?.trim() ?? null,
      river: r.river ?? null,
      province: r.province_t ?? null,
      lat: r.latitude,
      lon: r.longitude,
      time: r.hourly_time_utc,
      wl_msl: num(r.wl_values_msl),
      bank_msl: num(r.brae_level_msl),
      diff_bank: num(r.pier_diff),
      q: num(r.q_values),
      q_max: num(r.q_max),
      pct_bank: num(r.wl_percent),
      trend: r.wl_trend ?? null,
      q_trend: r.q_trend ?? null,
      wl_change_24h: num(r.wlval_diff_yd)
    });
  }
  return out;
}
async function fetchEgat() {
  const html = await get("https://water.egat.co.th/telemeter/schematic/index.php", { type: "text" });
  const out = /* @__PURE__ */ new Map();
  const rowRe = /<tr><td>\d+<\/td>(.*?)<\/tr>/g;
  for (const m of html.matchAll(rowRe)) {
    const cells = [...m[1].matchAll(/<td>(.*?)<\/td>/g)].map((c) => c[1].trim());
    if (cells.length < 7) continue;
    const [code, name, wl_m, wl_msl, q, when, cap] = cells;
    const t = when.match(/(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})/);
    const time = t ? `${+t[3] - 543}-${t[2]}-${t[1]}T${t[4]}:${t[5]}:00+07:00` : null;
    if (!out.has(code)) out.set(code, { name, wl_m: num(wl_m), wl_msl: num(wl_msl), q: num(q), time, capacity: num(cap) });
  }
  if (out.size === 0) throw new Error("\u0E2D\u0E48\u0E32\u0E19\u0E15\u0E32\u0E23\u0E32\u0E07 \u0E01\u0E1F\u0E1C. \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 (\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E27\u0E47\u0E1A\u0E2D\u0E32\u0E08\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19)");
  return out;
}
async function fetchRidDams(dams = []) {
  try {
    const j = await get("https://app.rid.go.th/reservoir/api/dam/public");
    const out = /* @__PURE__ */ new Map();
    for (const reg of j.data) for (const d of reg.dam) out.set(d.id, { ...d, date: j.date, via: "RID" });
    return out;
  } catch (e) {
    if (!dams.length) throw e;
    const j = await get("https://api-v3.thaiwater.net/api/v1/thaiwater30/public/thailand_main", { timeout: 9e4 });
    const out = /* @__PURE__ */ new Map();
    for (const x of j.dam.data.data) {
      const d = dams.find((k) => k.twId === x.dam?.id);
      if (!d) continue;
      out.set(d.id, {
        id: d.id,
        name: d.name,
        date: x.dam_date,
        via: "ThaiWater",
        storage: x.dam.normal_storage,
        volume: x.dam_storage,
        percent_storage: x.dam_storage_percent,
        inflow: x.dam_inflow,
        outflow: x.dam_released
      });
    }
    if (!out.size) throw e;
    return out;
  }
}
async function fetchRain(points) {
  const lat = points.map((p) => p.lat).join(",");
  const lon = points.map((p) => p.lon).join(",");
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,precipitation_probability_max&timezone=Asia%2FBangkok&past_days=1&forecast_days=4`;
  const j = await get(url);
  const arr = Array.isArray(j) ? j : [j];
  return points.map((p, i) => ({
    ...p,
    days: arr[i].daily.time.map((d, k) => ({
      date: d,
      mm: arr[i].daily.precipitation_sum[k],
      prob: arr[i].daily.precipitation_probability_max[k]
    }))
  }));
}
async function fetchSeaLevel(p) {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${p.lat}&longitude=${p.lon}&hourly=sea_level_height_msl&timezone=Asia%2FBangkok&forecast_days=2`;
  const j = await get(url);
  const now = Date.now();
  const rows = j.hourly.time.map((t, i) => ({ time: `${t}:00+07:00`, m: j.hourly.sea_level_height_msl[i] })).filter((r) => r.m !== null && new Date(r.time).getTime() >= now - 36e5).slice(0, 24);
  const peak = rows.reduce((a, b) => b.m > a.m ? b : a, rows[0]);
  return { ...p, next24h: rows, peak };
}
async function checkCctv(cams) {
  return Promise.all(
    cams.map(async (c) => {
      try {
        const res = await get(`${c.url}?t=${Date.now()}`, { type: "raw", timeout: 2e4 });
        const buf = await res.arrayBuffer();
        return { ...c, ok: true, contentType: res.headers.get("content-type"), bytes: buf.byteLength };
      } catch (e) {
        return { ...c, ok: false, error: String(e.message ?? e) };
      }
    })
  );
}

// ingest/core.mjs
var STALE_HOURS = 3;
var fmt = (n, d = 0) => n === null || n === void 0 ? "-" : Number(n).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
var ageHours = (iso) => iso ? (Date.now() - new Date(iso).getTime()) / 36e5 : null;
function classify(diff) {
  if (diff === null) return { level: "unknown", label: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E25\u0E34\u0E48\u0E07" };
  if (diff > 0) return { level: "red", label: "\u0E25\u0E49\u0E19\u0E15\u0E25\u0E34\u0E48\u0E07" };
  if (diff > -1) return { level: "orange", label: "\u0E43\u0E01\u0E25\u0E49\u0E15\u0E25\u0E34\u0E48\u0E07" };
  return { level: "green", label: "\u0E1B\u0E01\u0E15\u0E34" };
}
async function collect() {
  const started = /* @__PURE__ */ new Date();
  const jobs = {
    thaiwater: fetchThaiWater(),
    swoc: fetchSwoc(),
    egat: fetchEgat(),
    ridDams: fetchRidDams(DAMS),
    rain: fetchRain(RAIN_POINTS),
    sea: fetchSeaLevel(SEA_POINT),
    cctv: checkCctv(CCTV)
  };
  const keys = Object.keys(jobs);
  const settled = await Promise.allSettled(Object.values(jobs));
  const src = {};
  const sourceStatus = {};
  settled.forEach((r, i) => {
    src[keys[i]] = r.status === "fulfilled" ? r.value : null;
    sourceStatus[keys[i]] = r.status === "fulfilled" ? "ok" : `error: ${r.reason?.message ?? r.reason}`;
  });
  const stations = STATIONS.map((st) => {
    const primary = st.src === "swoc" ? src.swoc : src.thaiwater;
    const fallback = st.src === "swoc" ? src.thaiwater : src.swoc;
    let rec = primary?.get(st.code) ?? fallback?.get(st.code) ?? null;
    const egat = st.egat ? src.egat?.get(st.egat) : null;
    if (!rec && egat) rec = { source: "EGAT", time: egat.time, wl_msl: egat.wl_msl, q: egat.q, diff_bank: null };
    if (!rec) return { ...st, missing: true, status: { level: "unknown", label: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25" } };
    const qc = [];
    let diff = rec.diff_bank;
    if (diff !== null && Math.abs(diff) >= 30) {
      qc.push(`\u0E15\u0E31\u0E14\u0E04\u0E48\u0E32\u0E40\u0E17\u0E35\u0E22\u0E1A\u0E15\u0E25\u0E34\u0E48\u0E07 ${diff} (\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E15\u0E25\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07)`);
      diff = null;
    }
    let q = rec.q;
    if (q !== null && (q < 0 || q > 2e4)) {
      qc.push(`\u0E15\u0E31\u0E14\u0E04\u0E48\u0E32\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13 ${q}`);
      q = null;
    }
    if (q === 0 && egat?.q > 10) {
      qc.push(`\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13 0 \u0E02\u0E31\u0E14\u0E01\u0E31\u0E1A \u0E01\u0E1F\u0E1C. (${egat.q}) \u2192 \u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32 \u0E01\u0E1F\u0E1C.`);
      q = egat.q;
    } else if (q === 0 && egat && !egat.q) {
      qc.push("\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13 0 \u0E41\u0E15\u0E48 \u0E01\u0E1F\u0E1C. \u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E48\u0E32 \u2192 \u0E16\u0E37\u0E2D\u0E27\u0E48\u0E32\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25");
      q = null;
    } else if (q !== null && egat?.q && Math.abs(q - egat.q) / egat.q > 0.2) qc.push(`\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13\u0E15\u0E48\u0E32\u0E07\u0E08\u0E32\u0E01 \u0E01\u0E1F\u0E1C. \u0E40\u0E01\u0E34\u0E19 20% (${q} vs ${egat.q})`);
    const age = ageHours(rec.time);
    if (age !== null && age < -1) qc.push("\u0E40\u0E27\u0E25\u0E32\u0E27\u0E31\u0E14\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E2D\u0E19\u0E32\u0E04\u0E15");
    const capacity = egat?.capacity ?? rec.q_max ?? null;
    const capacitySource = egat?.capacity ? "\u0E01\u0E1F\u0E1C." : rec.q_max ? "\u0E0A\u0E1B./\u0E2A\u0E2A\u0E19." : null;
    return {
      ...st,
      source: rec.source,
      river: rec.river,
      province: rec.province,
      lat: rec.lat,
      lon: rec.lon,
      time: rec.time,
      age_h: age !== null ? +age.toFixed(1) : null,
      stale: age !== null && age > STALE_HOURS,
      wl_msl: rec.wl_msl,
      bank_msl: rec.bank_msl,
      diff_bank: diff,
      pct_bank: rec.pct_bank,
      trend: rec.trend,
      q,
      capacity,
      capacity_source: capacitySource,
      q_pct: q && capacity ? +(q / capacity * 100).toFixed(0) : null,
      egat_q: egat?.q ?? null,
      qc,
      status: classify(diff)
    };
  });
  const dams = DAMS.map((d) => {
    const r = src.ridDams?.get(d.id);
    if (!r) return { ...d, missing: true };
    const free = r.storage - r.volume;
    const net = r.inflow - r.outflow;
    return {
      ...d,
      date: r.date,
      volume: r.volume,
      normal_storage: r.storage,
      pct: r.percent_storage,
      inflow_mcm_day: r.inflow,
      outflow_mcm_day: r.outflow,
      inflow_cms: +(r.inflow * 1e6 / 86400).toFixed(0),
      outflow_cms: +(r.outflow * 1e6 / 86400).toFixed(0),
      free_mcm: +free.toFixed(1),
      net_mcm_day: +net.toFixed(2),
      days_to_full: net > 0 ? +(free / net).toFixed(1) : null
    };
  });
  const maeklongDam = src.egat?.get("SND04") ?? null;
  const alerts = [];
  const byCode = Object.fromEntries(stations.map((s) => [s.code, s]));
  const k37 = byCode["K.37"];
  if (k37?.q && k37.capacity && k37.q > k37.capacity)
    alerts.push({ level: "red", text: `K.37 \u0E41\u0E04\u0E27\u0E19\u0E49\u0E2D\u0E22 ${fmt(k37.q)} \u0E40\u0E01\u0E34\u0E19\u0E04\u0E27\u0E32\u0E21\u0E08\u0E38\u0E25\u0E33\u0E19\u0E49\u0E33 ${fmt(k37.capacity)} \u0E25\u0E1A.\u0E21./\u0E27\u0E34` });
  const k55 = byCode["K.55A"];
  if (k55?.q > 3e3) alerts.push({ level: "red", text: `K.55A \u0E1A\u0E49\u0E32\u0E19\u0E42\u0E1B\u0E48\u0E07 ${fmt(k55.q)} \u0E25\u0E1A.\u0E21./\u0E27\u0E34 \u0E40\u0E01\u0E34\u0E19 3,000` });
  else if (k55?.q > 2500) alerts.push({ level: "orange", text: `K.55A \u0E1A\u0E49\u0E32\u0E19\u0E42\u0E1B\u0E48\u0E07 ${fmt(k55.q)} \u0E25\u0E1A.\u0E21./\u0E27\u0E34 \u0E40\u0E01\u0E34\u0E19 2,500` });
  for (const s of stations.filter((s2) => s2.status.level === "red"))
    alerts.push({ level: s.key ? "red" : "orange", text: `${s.code} ${s.name} \u0E2A\u0E39\u0E07\u0E01\u0E27\u0E48\u0E32\u0E15\u0E25\u0E34\u0E48\u0E07 ${fmt(s.diff_bank, 2)} \u0E21.` });
  for (const d of dams.filter((d2) => !d2.missing)) {
    if (d.pct >= 98 && d.net_mcm_day > 0)
      alerts.push({ level: "orange", text: `${d.name} ${fmt(d.pct, 1)}% \u0E19\u0E49\u0E33\u0E40\u0E02\u0E49\u0E32\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32\u0E23\u0E30\u0E1A\u0E32\u0E22 \u0E2D\u0E35\u0E01\u0E23\u0E32\u0E27 ${fmt(d.days_to_full, 1)} \u0E27\u0E31\u0E19\u0E08\u0E30\u0E16\u0E36\u0E07\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E40\u0E01\u0E47\u0E1A\u0E01\u0E31\u0E01 \u2192 \u0E2D\u0E32\u0E08\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E32\u0E22\u0E40\u0E1E\u0E34\u0E48\u0E21` });
  }
  for (const p of src.rain ?? []) {
    if (p.id === "rbr") continue;
    const next3 = p.days.slice(1, 4).reduce((a, b) => a + (b.mm ?? 0), 0);
    if (next3 >= 50) alerts.push({ level: "orange", text: `\u0E1D\u0E19\u0E04\u0E32\u0E14\u0E01\u0E32\u0E23\u0E13\u0E4C ${p.name} 3 \u0E27\u0E31\u0E19\u0E23\u0E27\u0E21 ${fmt(next3, 0)} \u0E21\u0E21.` });
  }
  for (const s of stations.filter((s2) => s2.stale))
    alerts.push({ level: "info", text: `${s.code} \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E01\u0E48\u0E32 ${fmt(s.age_h, 1)} \u0E0A\u0E21. (\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E49\u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19)` });
  const snapshot = {
    generated_at: started.toISOString(),
    sources: sourceStatus,
    segments: SEGMENTS,
    stations,
    dams,
    maeklong_dam: maeklongDam,
    maeklong_release_proxy: k55?.q ? { station: "K.55A", q: k55.q, time: k55.time, note: "\u0E43\u0E0A\u0E49\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13\u0E19\u0E49\u0E33\u0E17\u0E35\u0E48 K.55A \u0E41\u0E17\u0E19\u0E01\u0E32\u0E23\u0E23\u0E30\u0E1A\u0E32\u0E22\u0E40\u0E02\u0E37\u0E48\u0E2D\u0E19\u0E41\u0E21\u0E48\u0E01\u0E25\u0E2D\u0E07 (\u0E44\u0E21\u0E48\u0E21\u0E35 API \u0E17\u0E32\u0E07\u0E01\u0E32\u0E23)" } : null,
    rain: src.rain,
    sea: src.sea,
    cctv: src.cctv,
    alerts
  };
  return snapshot;
}

// ingest/store.mjs
function buildRows(s) {
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
    updated_at: s.generated_at
  }));
  const readings = s.stations.filter((x) => !x.missing && x.time).map((x) => ({
    station_code: x.code,
    source: x.source,
    measured_at: x.time,
    wl: x.wl_msl,
    bank: x.bank_msl ?? null,
    diff_bank: x.diff_bank,
    pct_bank: x.pct_bank ?? null,
    q: x.q,
    trend: x.trend ?? null,
    qc: x.qc?.length ? x.qc.join("; ") : null
  }));
  const dam_daily = s.dams.filter((d) => !d.missing).map((d) => ({
    dam_id: d.id,
    name: d.name,
    date: d.date,
    volume: d.volume,
    normal_storage: d.normal_storage,
    pct: d.pct,
    inflow_mcm: d.inflow_mcm_day,
    outflow_mcm: d.outflow_mcm_day,
    updated_at: s.generated_at
  }));
  const issued = new Date(s.generated_at).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const rain_forecast = (s.rain ?? []).flatMap(
    (p) => p.days.map((d) => ({ point_id: p.id, forecast_date: d.date, issued_on: issued, mm: d.mm, prob: d.prob, updated_at: s.generated_at }))
  );
  const sea_level = (s.sea?.next24h ?? []).map((r) => ({ point: "maeklong_mouth", at: r.time, m: r.m, updated_at: s.generated_at }));
  const ingest_runs = [
    {
      started_at: s.generated_at,
      sources: s.sources,
      alerts: s.alerts,
      n_readings: readings.length,
      maeklong_q: s.maeklong_release_proxy?.q ?? null
    }
  ];
  return { stations, readings, dam_daily, rain_forecast, sea_level, ingest_runs };
}
var CONFLICT = {
  stations: "code",
  readings: "station_code,source,measured_at",
  dam_daily: "dam_id,date",
  rain_forecast: "point_id,forecast_date,issued_on",
  sea_level: "point,at",
  ingest_runs: null,
  alert_state: "key"
};
function dbConfig(env = process.env) {
  const url = env.SUPABASE_URL?.replace(/\/$/, "");
  const key = env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  const headers = { apikey: key, "Content-Type": "application/json" };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  return { url, headers };
}
async function upsert(db, table, data) {
  const onConflict = CONFLICT[table];
  const qs = onConflict ? `?on_conflict=${onConflict}` : "";
  const prefer = onConflict ? "resolution=merge-duplicates,return=minimal" : "return=minimal";
  for (let i = 0; i < data.length; i += 1e3) {
    const res = await fetch(`${db.url}/rest/v1/${table}${qs}`, {
      method: "POST",
      headers: { ...db.headers, Prefer: prefer },
      body: JSON.stringify(data.slice(i, i + 1e3)),
      signal: AbortSignal.timeout(6e4)
    });
    if (!res.ok) throw new Error(`\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 ${table} \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08: HTTP ${res.status} ${await res.text()}`);
  }
  return data.length;
}
async function store(snapshot, env = process.env) {
  const db = dbConfig(env);
  if (!db) return { skipped: true, reason: "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 SUPABASE_URL / SUPABASE_SECRET_KEY" };
  const rows = buildRows(snapshot);
  const result = {};
  for (const table of ["stations", "readings", "dam_daily", "rain_forecast", "sea_level", "ingest_runs"]) {
    result[table] = rows[table].length ? await upsert(db, table, rows[table]) : 0;
  }
  return result;
}

// ingest/alerts.mjs
var RANK = { yellow: 1, orange: 2, red: 3 };
var LABEL = { red: "\u{1F534} \u0E27\u0E34\u0E01\u0E24\u0E15", orange: "\u{1F7E0} \u0E40\u0E15\u0E37\u0E2D\u0E19\u0E20\u0E31\u0E22", yellow: "\u{1F7E1} \u0E40\u0E1D\u0E49\u0E32\u0E23\u0E30\u0E27\u0E31\u0E07" };
var CLEAR_AFTER_MIN = 25;
var BANK_CLEAR_M = -0.15;
var fmt2 = (n, d = 0) => Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
function evaluate(snapshot, activeKeys = /* @__PURE__ */ new Set()) {
  const out = [];
  const by = Object.fromEntries(snapshot.stations.map((s) => [s.code, s]));
  for (const s of snapshot.stations) {
    if (s.missing || s.stale || s.diff_bank === null || s.diff_bank === void 0) continue;
    const key = `bank:${s.code}`;
    const over = s.diff_bank > 0 || activeKeys.has(key) && s.diff_bank > BANK_CLEAR_M;
    if (!over) continue;
    const rising = s.trend === "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E02\u0E36\u0E49\u0E19";
    const level = s.key ? rising ? "red" : "orange" : "yellow";
    const where = s.diff_bank > 0 ? `\u0E2A\u0E39\u0E07\u0E01\u0E27\u0E48\u0E32\u0E15\u0E25\u0E34\u0E48\u0E07 ${fmt2(s.diff_bank, 2)} \u0E21.` : `\u0E40\u0E1E\u0E34\u0E48\u0E07\u0E25\u0E14\u0E25\u0E07\u0E15\u0E48\u0E33\u0E01\u0E27\u0E48\u0E32\u0E15\u0E25\u0E34\u0E48\u0E07 (${fmt2(s.diff_bank, 2)} \u0E21.)`;
    out.push({ key, level, text: `${s.name} (${s.code}) ${where}${rising ? " \u0E41\u0E25\u0E30\u0E22\u0E31\u0E07\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E02\u0E36\u0E49\u0E19" : ""}` });
  }
  const k37 = by["K.37"];
  if (k37?.q && k37.capacity && k37.q > k37.capacity && !k37.stale)
    out.push({ key: "flow:K.37", level: "orange", text: `\u0E41\u0E04\u0E27\u0E19\u0E49\u0E2D\u0E22 K.37 \u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13 ${fmt2(k37.q)} \u0E40\u0E01\u0E34\u0E19\u0E04\u0E27\u0E32\u0E21\u0E08\u0E38\u0E25\u0E33\u0E19\u0E49\u0E33 ${fmt2(k37.capacity)} \u0E25\u0E1A.\u0E21./\u0E27\u0E34` });
  const mk = snapshot.maeklong_release_proxy;
  if (mk?.q > 3e3) out.push({ key: "flow:maeklong", level: "red", text: `\u0E19\u0E49\u0E33\u0E17\u0E49\u0E32\u0E22\u0E40\u0E02\u0E37\u0E48\u0E2D\u0E19\u0E41\u0E21\u0E48\u0E01\u0E25\u0E2D\u0E07 (K.55A) ${fmt2(mk.q)} \u0E25\u0E1A.\u0E21./\u0E27\u0E34 \u0E40\u0E01\u0E34\u0E19 3,000` });
  else if (mk?.q > 2500) out.push({ key: "flow:maeklong", level: "orange", text: `\u0E19\u0E49\u0E33\u0E17\u0E49\u0E32\u0E22\u0E40\u0E02\u0E37\u0E48\u0E2D\u0E19\u0E41\u0E21\u0E48\u0E01\u0E25\u0E2D\u0E07 (K.55A) ${fmt2(mk.q)} \u0E25\u0E1A.\u0E21./\u0E27\u0E34 \u0E40\u0E01\u0E34\u0E19 2,500` });
  for (const d of snapshot.dams ?? []) {
    if (d.missing) continue;
    if (d.pct >= 100) out.push({ key: `dam:${d.id}`, level: "red", text: `${d.name} \u0E40\u0E15\u0E47\u0E21\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E40\u0E01\u0E47\u0E1A\u0E01\u0E31\u0E01 (${fmt2(d.pct, 1)}%) \u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E32\u0E22\u0E40\u0E1E\u0E34\u0E48\u0E21` });
    else if (d.pct >= 98 && d.net_mcm_day > 0)
      out.push({ key: `dam:${d.id}`, level: "orange", text: `${d.name} ${fmt2(d.pct, 1)}% \u0E19\u0E49\u0E33\u0E40\u0E02\u0E49\u0E32\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32\u0E23\u0E30\u0E1A\u0E32\u0E22 \u0E23\u0E32\u0E27 ${fmt2(d.days_to_full ?? 0, 1)} \u0E27\u0E31\u0E19\u0E08\u0E30\u0E40\u0E15\u0E47\u0E21 \u2192 \u0E2D\u0E32\u0E08\u0E23\u0E30\u0E1A\u0E32\u0E22\u0E40\u0E1E\u0E34\u0E48\u0E21` });
  }
  for (const p of snapshot.rain ?? []) {
    if (p.id === "rbr") continue;
    const next3 = p.days.slice(1, 4).reduce((a, b) => a + (b.mm ?? 0), 0);
    if (next3 >= 50) out.push({ key: `rain:${p.id}`, level: "yellow", text: `\u0E1D\u0E19\u0E04\u0E32\u0E14\u0E01\u0E32\u0E23\u0E13\u0E4C${p.name} 3 \u0E27\u0E31\u0E19\u0E23\u0E27\u0E21 ${fmt2(next3)} \u0E21\u0E21.` });
  }
  return out;
}
async function syncAlerts(db, snapshot, { lineReady }) {
  const now = new Date(snapshot.generated_at);
  const prev = await fetch(`${db.url}/rest/v1/alert_state?select=*&or=(active.eq.true,clear_notified.eq.false)`, { headers: db.headers }).then((r) => {
    if (!r.ok) throw new Error(`\u0E2D\u0E48\u0E32\u0E19 alert_state \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08: HTTP ${r.status}`);
    return r.json();
  });
  const prevBy = new Map(prev.map((a) => [a.key, a]));
  const activeKeys = new Set(prev.filter((a) => a.active).map((a) => a.key));
  const current = evaluate(snapshot, activeKeys);
  const curKeys = new Set(current.map((c) => c.key));
  const rows = [];
  const raised = [];
  const cleared = [];
  for (const c of current) {
    const p = prevBy.get(c.key);
    const fresh = !p || !p.active;
    const row = {
      key: c.key,
      level: c.level,
      text: c.text,
      first_seen: fresh ? now.toISOString() : p.first_seen,
      last_seen: now.toISOString(),
      active: true,
      cleared_at: null,
      notified_level: fresh ? null : p.notified_level,
      notified_at: fresh ? null : p.notified_at,
      clear_notified: fresh ? true : p.clear_notified
    };
    if (RANK[c.level] >= RANK.orange && (!row.notified_level || RANK[c.level] > RANK[row.notified_level])) {
      raised.push({ ...c, escalated: !!row.notified_level });
      if (lineReady) {
        row.notified_level = c.level;
        row.notified_at = now.toISOString();
        row.clear_notified = false;
      }
    }
    rows.push(row);
  }
  for (const p of prev) {
    if (curKeys.has(p.key)) continue;
    if (p.active) {
      const goneMin = (now - new Date(p.last_seen)) / 6e4;
      if (goneMin < CLEAR_AFTER_MIN) continue;
      const row = { ...p, active: false, cleared_at: now.toISOString() };
      if (p.notified_level) {
        cleared.push(p);
        if (lineReady) row.clear_notified = true;
      } else row.clear_notified = true;
      rows.push(row);
    } else if (!p.clear_notified && p.notified_level) {
      cleared.push(p);
      if (lineReady) rows.push({ ...p, clear_notified: true });
    }
  }
  return { rows, raised, cleared, active: current };
}
function formatLine({ raised, cleared, active }, snapshot, webUrl) {
  if (!raised.length && !cleared.length) return null;
  const t = new Date(snapshot.generated_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const L = [`\u{1F30A} WaterWest \xB7 \u0E25\u0E38\u0E48\u0E21\u0E41\u0E21\u0E48\u0E01\u0E25\u0E2D\u0E07`, `${t} \u0E19.`];
  const list = (items, fn) => {
    const sorted = [...items].sort((a, b) => RANK[b.level] - RANK[a.level]);
    for (const a of sorted.slice(0, 8)) L.push(fn(a));
    if (sorted.length > 8) L.push(`\u2026\u0E41\u0E25\u0E30\u0E2D\u0E35\u0E01 ${sorted.length - 8} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23`);
  };
  if (raised.length) {
    L.push("", "\u26A0\uFE0F \u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E43\u0E2B\u0E21\u0E48");
    list(raised, (a) => `${LABEL[a.level]}${a.escalated ? " (\u0E23\u0E38\u0E19\u0E41\u0E23\u0E07\u0E02\u0E36\u0E49\u0E19)" : ""}: ${a.text}`);
  }
  if (cleared.length) {
    L.push("", "\u2705 \u0E04\u0E25\u0E35\u0E48\u0E04\u0E25\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27");
    list(
      cleared,
      (a) => a.key.startsWith("bank:") ? `\u2022 ${a.text.slice(0, a.text.indexOf(")") + 1)} \u0E25\u0E14\u0E25\u0E07\u0E15\u0E48\u0E33\u0E01\u0E27\u0E48\u0E32\u0E15\u0E25\u0E34\u0E48\u0E07\u0E41\u0E25\u0E49\u0E27` : `\u2022 \u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19\u0E40\u0E01\u0E13\u0E11\u0E4C\u0E41\u0E25\u0E49\u0E27: ${a.text}`
    );
  }
  const stillOn = active.filter((a) => RANK[a.level] >= RANK.orange).length;
  L.push("", `\u0E22\u0E31\u0E07\u0E40\u0E1D\u0E49\u0E32\u0E23\u0E30\u0E27\u0E31\u0E07\u0E2D\u0E22\u0E39\u0E48 ${stillOn} \u0E08\u0E38\u0E14`);
  if (webUrl) L.push(`\u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14: ${webUrl}`);
  L.push("\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28\u0E17\u0E32\u0E07\u0E01\u0E32\u0E23 \xB7 \u0E2A\u0E32\u0E22\u0E14\u0E48\u0E27\u0E19 \u0E1B\u0E20. 1784");
  return L.join("\n").slice(0, 4900);
}
async function sendLine(token, text) {
  const res = await fetch("https://api.line.me/v2/bot/message/broadcast", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ type: "text", text }] }),
    signal: AbortSignal.timeout(2e4)
  });
  if (!res.ok) throw new Error(`LINE HTTP ${res.status} ${await res.text()}`);
}

// supabase/functions/ingest/index.ts
var MIN_GAP_MIN = 8;
function secretKey() {
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keys) {
    try {
      const parsed = JSON.parse(keys);
      const first = Object.values(parsed)[0];
      if (first) return first;
    } catch {
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
}
var json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
Deno.serve(async () => {
  const env = { SUPABASE_URL: Deno.env.get("SUPABASE_URL"), SUPABASE_SECRET_KEY: secretKey() };
  const db = dbConfig(env);
  if (!db) return json({ error: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E48\u0E32 SUPABASE_URL / \u0E04\u0E35\u0E22\u0E4C" }, 500);
  const last = await fetch(`${db.url}/rest/v1/ingest_runs?select=started_at&order=started_at.desc&limit=1`, { headers: db.headers }).then((r) => r.json()).catch(() => []);
  const lastAt = last?.[0]?.started_at ? new Date(last[0].started_at).getTime() : 0;
  const gapMin = (Date.now() - lastAt) / 6e4;
  if (gapMin < MIN_GAP_MIN) return json({ skipped: true, reason: `\u0E23\u0E2D\u0E1A\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14\u0E40\u0E21\u0E37\u0E48\u0E2D ${gapMin.toFixed(1)} \u0E19\u0E32\u0E17\u0E35\u0E01\u0E48\u0E2D\u0E19` });
  const snapshot = await collect();
  const saved = await store(snapshot, env);
  const failed = Object.entries(snapshot.sources).filter(([, v]) => v !== "ok").map(([k]) => k);
  const token = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
  let alerts = {};
  try {
    const sync = await syncAlerts(db, snapshot, { lineReady: !!token });
    const text = formatLine(sync, snapshot, Deno.env.get("WEB_URL"));
    let line = "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E15\u0E49\u0E2D\u0E07\u0E41\u0E08\u0E49\u0E07";
    if (text && token) {
      await sendLine(token, text);
      line = "\u0E2A\u0E48\u0E07\u0E41\u0E25\u0E49\u0E27";
    } else if (text) line = "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 LINE_CHANNEL_ACCESS_TOKEN";
    await upsert(db, "alert_state", sync.rows);
    alerts = { active: sync.active.length, raised: sync.raised.length, cleared: sync.cleared.length, line };
  } catch (e) {
    alerts = { error: String(e.message ?? e) };
  }
  return json({ ok: true, generated_at: snapshot.generated_at, saved, failed, alerts });
});
