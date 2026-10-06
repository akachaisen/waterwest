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
  { code: "K.31", src: "swoc", seg: "A", name: "\u0E1A\u0E49\u0E32\u0E19\u0E19\u0E49\u0E33\u0E42\u0E08\u0E19 \u0E44\u0E17\u0E23\u0E42\u0E22\u0E04 (\u0E2B\u0E49\u0E27\u0E22\u0E41\u0E21\u0E48\u0E19\u0E49\u0E33\u0E19\u0E49\u0E2D\u0E22)" },
  { code: "KRI01", src: "ddpm", seg: "A", name: "\u0E2A\u0E30\u0E1E\u0E32\u0E19\u0E1A\u0E49\u0E32\u0E19\u0E41\u0E21\u0E48\u0E19\u0E49\u0E33\u0E19\u0E49\u0E2D\u0E22 \u0E44\u0E17\u0E23\u0E42\u0E22\u0E04", cams: 2 },
  { code: "K.58", src: "swoc", egat: "VKD04", seg: "A", name: "\u0E1A\u0E49\u0E32\u0E19\u0E1B\u0E32\u0E01\u0E41\u0E0B\u0E07 \u0E44\u0E17\u0E23\u0E42\u0E22\u0E04" },
  { code: "KRI02", src: "ddpm", seg: "A", name: "\u0E2A\u0E30\u0E1E\u0E32\u0E19\u0E1B\u0E32\u0E01\u0E41\u0E01\u0E41\u0E0B\u0E07 \u0E44\u0E17\u0E23\u0E42\u0E22\u0E04", cams: 2 },
  { code: "K.10", src: "swoc", egat: "VKD05", seg: "A", name: "\u0E1A\u0E49\u0E32\u0E19\u0E25\u0E38\u0E48\u0E21\u0E2A\u0E38\u0E48\u0E21 \u0E44\u0E17\u0E23\u0E42\u0E22\u0E04" },
  { code: "KRI03", src: "ddpm", seg: "A", name: "\u0E2A\u0E30\u0E1E\u0E32\u0E19\u0E27\u0E31\u0E07\u0E42\u0E1E \u0E44\u0E17\u0E23\u0E42\u0E22\u0E04", cams: 2 },
  { code: "K.37", src: "swoc", egat: "VKD06", seg: "A", name: "\u0E1A\u0E49\u0E32\u0E19\u0E27\u0E31\u0E07\u0E40\u0E22\u0E47\u0E19 \u0E14\u0E48\u0E32\u0E19\u0E21\u0E30\u0E02\u0E32\u0E21\u0E40\u0E15\u0E35\u0E49\u0E22", key: true },
  { code: "K.25A", src: "swoc", seg: "A", name: "\u0E1A\u0E49\u0E32\u0E19\u0E04\u0E32 (\u0E15\u0E49\u0E19\u0E25\u0E33\u0E20\u0E32\u0E0A\u0E35)" },
  { code: "K.64", src: "swoc", seg: "A", name: "\u0E1A\u0E49\u0E32\u0E19\u0E17\u0E38\u0E48\u0E07\u0E41\u0E2B\u0E25\u0E21 \u0E2A\u0E27\u0E19\u0E1C\u0E36\u0E49\u0E07 (\u0E25\u0E33\u0E20\u0E32\u0E0A\u0E35)", lat: 13.61917, lon: 99.40722 },
  { code: "K.61", src: "swoc", seg: "A", name: "\u0E1A\u0E49\u0E32\u0E19\u0E14\u0E48\u0E32\u0E19\u0E17\u0E31\u0E1A\u0E15\u0E30\u0E42\u0E01 \u0E08\u0E2D\u0E21\u0E1A\u0E36\u0E07 (\u0E25\u0E33\u0E20\u0E32\u0E0A\u0E35)", lat: 13.69252, lon: 99.44974 },
  { code: "K.62", src: "swoc", seg: "A", name: "\u0E1A\u0E49\u0E32\u0E19\u0E2B\u0E19\u0E2D\u0E07\u0E44\u0E1C\u0E48 \u0E14\u0E48\u0E32\u0E19\u0E21\u0E30\u0E02\u0E32\u0E21\u0E40\u0E15\u0E35\u0E49\u0E22 (\u0E25\u0E33\u0E20\u0E32\u0E0A\u0E35)" },
  { code: "KRI04", src: "ddpm", seg: "A", name: "\u0E2A\u0E30\u0E1E\u0E32\u0E19\u0E27\u0E31\u0E14\u0E2B\u0E34\u0E19\u0E41\u0E17\u0E48\u0E19 \u0E25\u0E33\u0E20\u0E32\u0E0A\u0E35 \u0E14\u0E48\u0E32\u0E19\u0E21\u0E30\u0E02\u0E32\u0E21\u0E40\u0E15\u0E35\u0E49\u0E22", cams: 2 },
  { code: "KRI05", src: "ddpm", seg: "A", name: "\u0E2A\u0E30\u0E1E\u0E32\u0E19\u0E2B\u0E19\u0E2D\u0E07\u0E2B\u0E0D\u0E49\u0E32 \u0E40\u0E21\u0E37\u0E2D\u0E07\u0E01\u0E32\u0E0D\u0E08\u0E19\u0E1A\u0E38\u0E23\u0E35", cams: 2 },
  { code: "K.49", src: "swoc", seg: "B", name: "\u0E1A\u0E49\u0E32\u0E19\u0E22\u0E32\u0E07\u0E2A\u0E39\u0E07 \u0E1A\u0E48\u0E2D\u0E1E\u0E25\u0E2D\u0E22 (\u0E25\u0E33\u0E15\u0E30\u0E40\u0E1E\u0E34\u0E19)" },
  { code: "KRI09", src: "ddpm", seg: "B", name: "\u0E2A\u0E30\u0E1E\u0E32\u0E19 \u0E22\u0E18. \u0E2B\u0E19\u0E2D\u0E07\u0E1B\u0E23\u0E37\u0E2D (\u0E25\u0E33\u0E15\u0E30\u0E40\u0E1E\u0E34\u0E19)", cams: 2 },
  { code: "KRI06", src: "ddpm", seg: "B", name: "\u0E2A\u0E30\u0E1E\u0E32\u0E19\u0E1A\u0E49\u0E32\u0E19\u0E0A\u0E48\u0E2D\u0E07\u0E2A\u0E30\u0E40\u0E14\u0E32", cams: 2 },
  { code: "KRI07", src: "ddpm", seg: "B", name: "\u0E25\u0E32\u0E14\u0E2B\u0E0D\u0E49\u0E32 (\u0E2A\u0E30\u0E1E\u0E32\u0E19\u0E2B\u0E25\u0E27\u0E07\u0E1E\u0E48\u0E2D\u0E25\u0E33\u0E43\u0E22)", cams: 2 },
  { code: "K.35A", src: "swoc", egat: "SND02", seg: "B", name: "\u0E1A\u0E49\u0E32\u0E19\u0E2B\u0E19\u0E2D\u0E07\u0E1A\u0E31\u0E27 \u0E40\u0E21\u0E37\u0E2D\u0E07\u0E01\u0E32\u0E0D\u0E08\u0E19\u0E1A\u0E38\u0E23\u0E35", key: true },
  { code: "K.12", src: "swoc", egat: "SND06", seg: "B", name: "\u0E1A\u0E49\u0E32\u0E19\u0E17\u0E38\u0E48\u0E07\u0E19\u0E32\u0E19\u0E32\u0E07\u0E2B\u0E23\u0E2D\u0E01 (\u0E25\u0E33\u0E15\u0E30\u0E40\u0E1E\u0E34\u0E19)" },
  { code: "K.3A", src: "swoc", seg: "C", name: "\u0E2B\u0E19\u0E49\u0E32\u0E28\u0E32\u0E25\u0E32\u0E01\u0E25\u0E32\u0E07 \u0E08.\u0E01\u0E32\u0E0D\u0E08\u0E19\u0E1A\u0E38\u0E23\u0E35" },
  { code: "MKSND03", src: "tw", egat: "SND03", seg: "C", name: "\u0E27\u0E31\u0E14\u0E44\u0E0A\u0E22\u0E0A\u0E38\u0E21\u0E1E\u0E25\u0E0A\u0E19\u0E30\u0E2A\u0E07\u0E04\u0E23\u0E32\u0E21 (\u0E27\u0E31\u0E14\u0E43\u0E15\u0E49)" },
  { code: "K.11A", src: "swoc", seg: "E", name: "\u0E1A\u0E49\u0E32\u0E19\u0E27\u0E31\u0E07\u0E02\u0E19\u0E32\u0E22 \u0E17\u0E48\u0E32\u0E21\u0E48\u0E27\u0E07" },
  { code: "K.63", src: "swoc", seg: "E", name: "\u0E1A\u0E49\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48 \u0E17\u0E48\u0E32\u0E21\u0E48\u0E27\u0E07", lat: 13.92983, lon: 99.66823 },
  { code: "KRI08", src: "ddpm", seg: "E", name: "\u0E2A\u0E27\u0E19\u0E2A\u0E32\u0E18\u0E32\u0E23\u0E13\u0E30 \u0E23.10 \u0E17\u0E48\u0E32\u0E21\u0E48\u0E27\u0E07", cams: 2 },
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
    if (dams.some((k) => !(out.get(k.id)?.percent_storage > 0))) throw new Error(`\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E02\u0E37\u0E48\u0E2D\u0E19\u0E01\u0E23\u0E21\u0E0A\u0E25\u0E2F \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ${j.date} \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E04\u0E23\u0E1A`);
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
var HYD = "https://hyd-app.rid.go.th/webservice";
var thaiDateBE = (d) => {
  const t = new Date(d.getTime() + 7 * 36e5);
  return `${String(t.getUTCDate()).padStart(2, "0")}/${String(t.getUTCMonth() + 1).padStart(2, "0")}/${t.getUTCFullYear() + 543}`;
};
async function hydPost(path, body, form = false) {
  const res = await fetch(`${HYD}/${path}`, {
    method: "POST",
    headers: { "User-Agent": UA, "Content-Type": form ? "application/x-www-form-urlencoded" : "application/json; charset=utf-8" },
    body,
    signal: AbortSignal.timeout(45e3)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
  return res.json();
}
async function ridHourlyDay(d) {
  const tc = thaiDateBE(d);
  const model = await hydPost("HDService.svc/GetColModelAllHL", JSON.stringify({ hydro: { UtokID: "7", BasinID: "14", TimeCurrent: tc } }));
  const form = new URLSearchParams({ "DW[UtokID]": "7", "DW[BasinID]": "14", "DW[TimeCurrent]": tc, _search: "false", rows: "100", page: "1", sidx: "indexhourly", sord: "asc" });
  const data = await hydPost("getGroupHourlyWaterLevelReportAllHL.ashx", form.toString(), true);
  const t = new Date(d.getTime() + 7 * 36e5);
  const codes = model.groupHeadersStationCode.map((x) => x.titleText.trim());
  const prov = (model.groupHeadersStationProvince ?? []).map((x) => x.titleText);
  const out = /* @__PURE__ */ new Map();
  codes.forEach((code, i) => {
    const n = i + 1;
    const wlLabel = model.colModel.find((c) => c.name === `wlvalues${n}`)?.label ?? "";
    const qLabel = model.colModel.find((c) => c.name === `qvalues${n}`)?.label ?? "";
    const points = (data.rows ?? []).filter((r) => r[`wlvalues${n}`] !== null && r[`wlvalues${n}`] !== void 0).map((r) => ({
      // ชั่วโมงในตาราง (เวลาไทย) · 24.00 = เที่ยงคืนวันถัดไป
      time: new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), Number(r.hourlytime) - 7)).toISOString(),
      wl: +Number(r[`wlvalues${n}`]).toFixed(2),
      q: num(r[`qvalues${n}`])
    }));
    out.set(code, {
      bank: num(wlLabel.match(/ระดับตลิ่ง\s*(-?[\d.]+)/)?.[1]),
      zg: num(wlLabel.match(/ZG\s*([+-]?[\d.]+)/)?.[1]),
      qMax: num(qLabel.match(/ปริมาณ\s*([\d.]+)/)?.[1]),
      province: prov[i] ?? null,
      points
    });
  });
  return out;
}
function ridPoint(st, p) {
  return {
    wl_msl: st.zg !== null ? +(st.zg + p.wl).toFixed(3) : null,
    bank_msl: st.zg !== null && st.bank !== null ? +(st.zg + st.bank).toFixed(3) : null,
    diff_bank: st.bank !== null ? +(p.wl - st.bank).toFixed(3) : null
  };
}
async function ridHistoryRows(d, codes) {
  const cutoff = Date.now() - 3 * 36e5;
  const rows = [];
  for (const [code, st] of await ridHourlyDay(d)) {
    if (!codes.has(code)) continue;
    for (const p of st.points) {
      if (Date.parse(p.time) > cutoff) continue;
      const v = ridPoint(st, p);
      rows.push({ station_code: code, source: "RID-HYD", measured_at: p.time, wl: v.wl_msl, bank: v.bank_msl, diff_bank: v.diff_bank, pct_bank: null, q: p.q, trend: null, qc: "backfill" });
    }
  }
  return rows;
}
async function fetchRidHourly(now = /* @__PURE__ */ new Date()) {
  const latest = (day) => {
    const out = /* @__PURE__ */ new Map();
    for (const [code, st] of day) {
      const pts = st.points;
      if (!pts.length) continue;
      const last = pts[pts.length - 1];
      const prev3 = pts.length > 3 ? pts[pts.length - 4] : pts[0];
      const ch = last.wl - prev3.wl;
      out.set(code, {
        source: "RID-HYD",
        time: last.time,
        ...ridPoint(st, last),
        pct_bank: null,
        trend: pts.length < 2 ? null : ch > 0.02 ? "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E02\u0E36\u0E49\u0E19" : ch < -0.02 ? "\u0E25\u0E14\u0E25\u0E07" : "\u0E04\u0E07\u0E17\u0E35\u0E48",
        q: last.q,
        q_max: st.qMax,
        province: st.province
      });
    }
    return out;
  };
  const today = latest(await ridHourlyDay(now));
  if (today.size >= 5) return today;
  return latest(await ridHourlyDay(new Date(now.getTime() - 864e5)));
}
var DDPM = "https://cctv.disaster.go.th/api/v1";
async function fetchDdpm(codes, provinces = ["71", "70", "75", "74"]) {
  const want = new Set(codes);
  const lists = await Promise.all(provinces.map((p) => get(`${DDPM}/stations?provCode=${p}&limit=100`, { timeout: 3e4 })));
  const found = lists.flatMap((l) => l.data ?? []).filter((s) => want.has(s.code));
  const out = /* @__PURE__ */ new Map();
  await Promise.all(
    found.map(async (s) => {
      const raw = await get(`${DDPM}/stations/${encodeURIComponent(s.code)}`, { timeout: 3e4 });
      const d = raw?.data ?? raw ?? {};
      const h = d.histories?.[0];
      const level = num(h?.level ?? s.currentWaterLevel);
      const bank = num(s.riverBankLevel);
      if (!h || h.isOnline === 0 || s.status !== 1 || level === null) return;
      const diff = bank !== null ? +(level - bank).toFixed(3) : null;
      const bankMsl = num(s.dpmRiverBankLevel);
      out.set(s.code, {
        source: "DDPM",
        time: h.timeStamp ? (/* @__PURE__ */ new Date(`${String(h.timeStamp).replace(/Z?$/, "Z")}`)).toISOString() : null,
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
        ddpm_status: s.waterLevelStatus ?? null
        // ป้ายระดับของ ปภ. 1–5
      });
    })
  );
  return out;
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
    cctv: checkCctv(CCTV),
    ridHourly: fetchRidHourly(),
    ddpm: fetchDdpm(STATIONS.filter((s) => s.src === "ddpm").map((s) => s.code))
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
    const primary = st.src === "ddpm" ? src.ddpm : st.src === "swoc" ? src.swoc : src.thaiwater;
    const fallback = st.src === "ddpm" ? null : st.src === "swoc" ? src.thaiwater : src.swoc;
    let rec = primary?.get(st.code) ?? fallback?.get(st.code) ?? null;
    const hyd = st.src === "swoc" ? src.ridHourly?.get(st.code) : null;
    if (hyd && (!rec?.time || new Date(hyd.time) > new Date(rec.time))) rec = { ...rec, ...hyd, q_max: hyd.q_max ?? rec?.q_max ?? null };
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
      lat: rec.lat ?? st.lat ?? null,
      lon: rec.lon ?? st.lon ?? null,
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
  for (const g of snapshot.rain_obs ?? []) {
    if (!g.upstream || !g.max) continue;
    if (g.max.mm >= 90) out.push({ key: `rainobs:${g.id}`, level: "yellow", text: `\u0E1D\u0E19\u0E27\u0E31\u0E14\u0E44\u0E14\u0E49 24 \u0E0A\u0E21. ${g.name} \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 ${fmt2(g.max.mm)} \u0E21\u0E21. (${g.max.name} \u0E2D.${g.max.amphoe})` });
    else if (g.heavy >= 3) out.push({ key: `rainobs:${g.id}`, level: "yellow", text: `\u0E1D\u0E19\u0E2B\u0E19\u0E31\u0E01 24 \u0E0A\u0E21. ${g.name} ${g.heavy} \u0E2A\u0E16\u0E32\u0E19\u0E35 \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 ${fmt2(g.max.mm)} \u0E21\u0E21. (\u0E2D.${g.max.amphoe})` });
  }
  const t0 = new Date(snapshot.generated_at).getTime();
  const hi = (snapshot.tide?.highs ?? []).find((h) => h.diff >= 0 && new Date(h.time).getTime() - t0 <= 24 * 36e5);
  if (hi) {
    const at = new Date(hi.time).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    out.push({ key: "tide:MKG006", level: "yellow", text: `\u0E19\u0E49\u0E33\u0E17\u0E30\u0E40\u0E25\u0E2B\u0E19\u0E38\u0E19\u0E2A\u0E39\u0E07: \u0E04\u0E32\u0E14\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E19\u0E49\u0E33\u0E17\u0E35\u0E48${snapshot.tide.station.name} \u0E2A\u0E39\u0E07\u0E01\u0E27\u0E48\u0E32\u0E15\u0E25\u0E34\u0E48\u0E07 ${fmt2(hi.diff, 2)} \u0E21. \u0E23\u0E32\u0E27 ${at} \u0E19.` });
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
  const L = [`\u{1F30A} WaterWest \xB7 \u0E25\u0E38\u0E48\u0E21\u0E19\u0E49\u0E33\u0E41\u0E21\u0E48\u0E01\u0E25\u0E2D\u0E07`, `${t} \u0E19.`];
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

// ingest/health.mjs
var DOWN_RUNS = 4;
var GAP_MIN = 60;
var STALE_LIMIT = 5;
var SOURCE_NAME = {
  swoc: "\u0E01\u0E23\u0E21\u0E0A\u0E25\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19 (\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E19\u0E49\u0E33)",
  thaiwater: "ThaiWater (\u0E2A\u0E2A\u0E19.)",
  ridDams: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E02\u0E37\u0E48\u0E2D\u0E19",
  egat: "\u0E01\u0E1F\u0E1C. \u0E42\u0E17\u0E23\u0E21\u0E32\u0E15\u0E23",
  rain: "\u0E1D\u0E19\u0E04\u0E32\u0E14\u0E01\u0E32\u0E23\u0E13\u0E4C",
  sea: "\u0E19\u0E49\u0E33\u0E17\u0E30\u0E40\u0E25\u0E2B\u0E19\u0E38\u0E19",
  cctv: "\u0E01\u0E25\u0E49\u0E2D\u0E07 CCTV"
};
var staleCount = (run) => (run.alerts ?? []).filter((a) => a.level === "info").length;
var QUIET_UNTIL_H = 8;
var thaiHour = (iso) => (new Date(iso).getUTCHours() + 7) % 24;
var staleBad = (r) => thaiHour(r.started_at) >= QUIET_UNTIL_H && staleCount(r) >= STALE_LIMIT;
var fmtGap = (min) => min >= 120 ? `${(min / 60).toFixed(1)} \u0E0A\u0E21.` : `${Math.round(min)} \u0E19\u0E32\u0E17\u0E35`;
function transition(window, bad) {
  if (window.length < DOWN_RUNS + 1) return null;
  const recent = window.slice(0, DOWN_RUNS);
  if (recent.every(bad) && !bad(window[DOWN_RUNS])) return "down";
  if (!bad(window[0]) && window.slice(1, DOWN_RUNS + 1).every(bad)) return "up";
  return null;
}
function evaluateHealth(snapshot, previous) {
  const current = { started_at: snapshot.generated_at, sources: snapshot.sources, alerts: snapshot.alerts };
  const window = [current, ...previous];
  const notes = [];
  const prevAt = previous[0]?.started_at ? new Date(previous[0].started_at) : null;
  const gapMin = prevAt ? (new Date(snapshot.generated_at) - prevAt) / 6e4 : 0;
  if (gapMin > GAP_MIN) notes.push({ kind: "gap", text: `\u0E23\u0E30\u0E1A\u0E1A\u0E2B\u0E22\u0E38\u0E14\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E1B ${fmtGap(gapMin)} \u2014 \u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E17\u0E33\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27` });
  for (const [key, status] of Object.entries(snapshot.sources)) {
    const t2 = transition(window, (r) => r.sources?.[key] !== void 0 && r.sources[key] !== "ok");
    const name = SOURCE_NAME[key] ?? key;
    if (t2 === "down") notes.push({ kind: "down", text: `${name} \u0E43\u0E0A\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E48\u0E2D\u0E40\u0E19\u0E37\u0E48\u0E2D\u0E07 ~1 \u0E0A\u0E21. (${String(status).slice(0, 80)})` });
    if (t2 === "up") notes.push({ kind: "up", text: `${name} \u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49\u0E41\u0E25\u0E49\u0E27` });
  }
  const t = transition(window, staleBad);
  if (t === "down") notes.push({ kind: "down", text: `\u0E2A\u0E16\u0E32\u0E19\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E01\u0E48\u0E32 (\u0E40\u0E01\u0E34\u0E19 3 \u0E0A\u0E21.) ${staleCount(current)} \u0E08\u0E38\u0E14 \u0E15\u0E48\u0E2D\u0E40\u0E19\u0E37\u0E48\u0E2D\u0E07 ~1 \u0E0A\u0E21.` });
  if (t === "up") notes.push({ kind: "up", text: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E16\u0E32\u0E19\u0E35\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E41\u0E25\u0E49\u0E27" });
  return notes;
}
async function checkHealth(db, snapshot) {
  const url = `${db.url}/rest/v1/ingest_runs?select=started_at,sources,alerts&started_at=lt.${encodeURIComponent(snapshot.generated_at)}&order=started_at.desc&limit=${DOWN_RUNS + 1}`;
  const res = await fetch(url, { headers: db.headers });
  if (!res.ok) throw new Error(`\u0E2D\u0E48\u0E32\u0E19 ingest_runs \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08: HTTP ${res.status}`);
  return evaluateHealth(snapshot, await res.json());
}
function formatHealth(notes, snapshot, webUrl) {
  const t = new Date(snapshot.generated_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const icon = { down: "\u274C", up: "\u2705", gap: "\u26A0\uFE0F" };
  const L = ["\u{1F6E0} WaterWest \xB7 \u0E41\u0E08\u0E49\u0E07\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E23\u0E30\u0E1A\u0E1A", `${t} \u0E19.`, ""];
  for (const n of notes) L.push(`${icon[n.kind]} ${n.text}`);
  if (webUrl) L.push("", `\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A: ${webUrl}`);
  return L.join("\n").slice(0, 4900);
}
async function pushLine(token, to, text) {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ to, messages: [{ type: "text", text }] }),
    signal: AbortSignal.timeout(2e4)
  });
  if (!res.ok) throw new Error(`LINE push HTTP ${res.status} ${await res.text()}`);
}

// ingest/quota.mjs
var API = "https://api.line.me/v2/bot";
async function lineGet(token, path) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15e3) });
  if (!res.ok) throw new Error(`LINE ${path} HTTP ${res.status}`);
  return res.json();
}
var jstDate = (d) => new Date(d.getTime() + 9 * 36e5).toISOString().slice(0, 10).replace(/-/g, "");
var thaiMonth = (d) => new Date(d.getTime() + 7 * 36e5).toISOString().slice(0, 7);
async function fetchQuota(token, now = /* @__PURE__ */ new Date()) {
  const [quota, usage] = await Promise.all([lineGet(token, "/message/quota"), lineGet(token, "/message/quota/consumption")]);
  let reach = null;
  let followers = null;
  try {
    const f = await lineGet(token, `/insight/followers?date=${jstDate(new Date(now.getTime() - 864e5))}`);
    if (f.status === "ready") {
      followers = f.followers ?? null;
      reach = f.targetedReaches ?? (f.followers != null ? f.followers - (f.blocks ?? 0) : null);
    }
  } catch {
  }
  return { limit: quota.type === "limited" ? quota.value : null, used: usage.totalUsage, reach, followers };
}
function quotaLevel({ limit, used, reach }) {
  if (limit == null) return 0;
  const left = limit - used;
  const per = Math.max(1, reach ?? 1);
  if (left < per) return 100;
  if (used / limit >= 0.95 || left < 2 * per) return 95;
  if (used / limit >= 0.8) return 80;
  return 0;
}
function formatQuota(q, level) {
  const per = Math.max(1, q.reach ?? 1);
  const left = q.limit - q.used;
  const head = { 80: "\u{1F7E1} \u0E43\u0E0A\u0E49\u0E42\u0E04\u0E27\u0E15\u0E32\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27 80%", 95: "\u{1F7E0} \u0E42\u0E04\u0E27\u0E15\u0E32\u0E43\u0E01\u0E25\u0E49\u0E2B\u0E21\u0E14", 100: "\u{1F534} \u0E42\u0E04\u0E27\u0E15\u0E32\u0E44\u0E21\u0E48\u0E1E\u0E2D\u0E2A\u0E48\u0E07\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E04\u0E23\u0E31\u0E49\u0E07\u0E16\u0E31\u0E14\u0E44\u0E1B" }[level];
  return [
    "\u{1F4CA} WaterWest \xB7 \u0E42\u0E04\u0E27\u0E15\u0E32\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21 LINE",
    head,
    "",
    `\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49\u0E43\u0E0A\u0E49\u0E44\u0E1B ${q.used.toLocaleString("en-US")} / ${q.limit.toLocaleString("en-US")} \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21 (${Math.round(q.used / q.limit * 100)}%)`,
    `\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A ${q.reach ?? "?"} \u0E04\u0E19 \u2192 \u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19 1 \u0E04\u0E23\u0E31\u0E49\u0E07\u0E43\u0E0A\u0E49 ~${per} \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21`,
    `\u0E2A\u0E48\u0E07\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E44\u0E14\u0E49\u0E2D\u0E35\u0E01\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 ${Math.max(0, Math.floor(left / per))} \u0E04\u0E23\u0E31\u0E49\u0E07`,
    "",
    level >= 95 ? "\u0E16\u0E49\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E19\u0E49\u0E33\u0E21\u0E32 \u0E1E\u0E34\u0E08\u0E32\u0E23\u0E13\u0E32\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1E\u0E47\u0E01\u0E40\u0E01\u0E08\u0E43\u0E19 LINE OA Manager \u2192 Settings \u2192 Monthly plan (\u0E42\u0E04\u0E27\u0E15\u0E32\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E15\u0E49\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19)" : "\u0E42\u0E04\u0E27\u0E15\u0E32\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E15\u0E49\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19"
  ].join("\n");
}
async function syncQuota(db, token, adminId, now = /* @__PURE__ */ new Date()) {
  const month = thaiMonth(now);
  const q = await fetchQuota(token, now);
  const prev = await fetch(`${db.url}/rest/v1/line_quota?select=*&month=eq.${month}`, { headers: db.headers }).then((r) => {
    if (!r.ok) throw new Error(`\u0E2D\u0E48\u0E32\u0E19 line_quota \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08: HTTP ${r.status}`);
    return r.json();
  });
  const old = prev[0];
  const row = {
    month,
    quota: q.limit,
    used: q.used,
    reach: q.reach ?? old?.reach ?? null,
    followers: q.followers ?? old?.followers ?? null,
    warned: old?.warned ?? 0,
    checked_at: now.toISOString()
  };
  const level = quotaLevel({ limit: row.quota, used: row.used, reach: row.reach });
  let sent = false;
  if (level > row.warned && adminId) {
    await pushLine(token, adminId, formatQuota({ limit: row.quota, used: row.used, reach: row.reach }, level));
    row.warned = level;
    sent = true;
  }
  const res = await fetch(`${db.url}/rest/v1/line_quota?on_conflict=month`, {
    method: "POST",
    headers: { ...db.headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(row)
  });
  if (!res.ok) throw new Error(`\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 line_quota \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08: HTTP ${res.status} ${await res.text()}`);
  return { used: row.used, limit: row.quota, reach: row.reach, level, sent };
}

// ingest/daily.mjs
var SEND_FROM_H = 6;
var SEND_UNTIL_H = 9;
var RESERVE_ALERTS = 3;
var LEVEL = { red: "\u{1F534} \u0E27\u0E34\u0E01\u0E24\u0E15", orange: "\u{1F7E0} \u0E40\u0E15\u0E37\u0E2D\u0E19\u0E20\u0E31\u0E22", yellow: "\u{1F7E1} \u0E40\u0E1D\u0E49\u0E32\u0E23\u0E30\u0E27\u0E31\u0E07" };
var RANK2 = { yellow: 1, orange: 2, red: 3 };
var KEY_STATIONS = [
  ["K.37", "\u0E41\u0E04\u0E27\u0E19\u0E49\u0E2D\u0E22 \u0E1A\u0E49\u0E32\u0E19\u0E27\u0E31\u0E07\u0E40\u0E22\u0E47\u0E19"],
  ["K.35A", "\u0E41\u0E04\u0E27\u0E43\u0E2B\u0E0D\u0E48 \u0E1A\u0E49\u0E32\u0E19\u0E2B\u0E19\u0E2D\u0E07\u0E1A\u0E31\u0E27"],
  ["K.55A", "\u0E1A\u0E49\u0E32\u0E19\u0E42\u0E1B\u0E48\u0E07"],
  ["RAJ001", "\u0E42\u0E1E\u0E18\u0E32\u0E23\u0E32\u0E21"],
  ["K.2B", "\u0E15\u0E31\u0E27\u0E40\u0E21\u0E37\u0E2D\u0E07\u0E23\u0E32\u0E0A\u0E1A\u0E38\u0E23\u0E35"],
  ["K.57", "\u0E1A\u0E32\u0E07\u0E04\u0E19\u0E17\u0E35"]
];
var TRIBUTARIES = [
  ["\u0E25\u0E33\u0E20\u0E32\u0E0A\u0E35", ["K.25A", "K.64", "K.61", "K.62", "KRI04"]],
  ["\u0E25\u0E33\u0E15\u0E30\u0E40\u0E1E\u0E34\u0E19", ["K.49", "KRI09", "K.12"]]
];
var fmt3 = (n, d = 0) => Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
var thai = (d) => new Date(d.getTime() + 7 * 36e5);
var thaiDate = (d) => thai(d).toISOString().slice(0, 10);
var hm = (iso, now) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const t = d.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" });
  return thaiDate(d) === thaiDate(now) ? `${t} \u0E19.` : `${d.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short" })} ${t} \u0E19.`;
};
var bankText = (d) => d > 0 ? `\u0E2A\u0E39\u0E07\u0E01\u0E27\u0E48\u0E32\u0E15\u0E25\u0E34\u0E48\u0E07 ${fmt3(d, 2)} \u0E21.` : `\u0E15\u0E48\u0E33\u0E01\u0E27\u0E48\u0E32\u0E15\u0E25\u0E34\u0E48\u0E07 ${fmt3(-d, 2)} \u0E21.`;
var arrow = (trend) => trend === "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E02\u0E36\u0E49\u0E19" ? " \u2191" : trend === "\u0E25\u0E14\u0E25\u0E07" ? " \u2193" : trend === "\u0E17\u0E23\u0E07\u0E15\u0E31\u0E27" || trend === "\u0E04\u0E07\u0E17\u0E35\u0E48" ? " \u2192" : "";
function formatDaily(snapshot, active, webUrl, now = new Date(snapshot.generated_at)) {
  const day = now.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const worst = active.reduce((w, a) => RANK2[a.level] > (RANK2[w] ?? 0) ? a.level : w, null);
  const watch = active.filter((a) => RANK2[a.level] >= RANK2.orange).length;
  const L = [`\u{1F305} WaterWest \xB7 \u0E2A\u0E23\u0E38\u0E1B\u0E40\u0E0A\u0E49\u0E32 ${day}`, `\u0E20\u0E32\u0E1E\u0E23\u0E27\u0E21\u0E25\u0E38\u0E48\u0E21\u0E19\u0E49\u0E33\u0E41\u0E21\u0E48\u0E01\u0E25\u0E2D\u0E07: ${worst ? `${LEVEL[worst]}${watch ? ` (${watch} \u0E08\u0E38\u0E14)` : ""}` : "\u{1F7E2} \u0E1B\u0E01\u0E15\u0E34"}`];
  const by = Object.fromEntries(snapshot.stations.map((s) => [s.code, s]));
  L.push("", "\u{1F4A7} \u0E23\u0E30\u0E14\u0E31\u0E1A\u0E19\u0E49\u0E33 (\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E27\u0E31\u0E14)");
  for (const [code, name] of KEY_STATIONS) {
    const s = by[code];
    if (!s || s.missing) {
      L.push(`\u2022 ${name}: \u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25`);
      continue;
    }
    const bank2 = s.diff_bank == null ? "" : bankText(s.diff_bank);
    const q = s.q ? ` \xB7 ${fmt3(s.q)} \u0E25\u0E1A.\u0E21./\u0E27\u0E34` : "";
    L.push(`\u2022 ${name}: ${bank2 || "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E48\u0E32\u0E40\u0E17\u0E35\u0E22\u0E1A\u0E15\u0E25\u0E34\u0E48\u0E07"}${q}${arrow(s.trend)} (${hm(s.time, now)}${s.stale ? " \u26A0\uFE0F\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E01\u0E48\u0E32" : ""})`);
  }
  const tribs = TRIBUTARIES.map(([river, codes]) => {
    const live = codes.map((c) => by[c]).filter((s) => s && !s.missing && !s.stale && s.diff_bank != null);
    return [river, live.reduce((w, s) => !w || s.diff_bank > w.diff_bank ? s : w, null), live.length];
  });
  if (tribs.some(([, s]) => s)) {
    L.push("", "\u3030\uFE0F \u0E25\u0E33\u0E19\u0E49\u0E33\u0E2A\u0E32\u0E02\u0E32 (\u0E08\u0E38\u0E14\u0E19\u0E49\u0E33\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14\u0E40\u0E17\u0E35\u0E22\u0E1A\u0E15\u0E25\u0E34\u0E48\u0E07)");
    for (const [river, s, n] of tribs) {
      if (!s) {
        L.push(`\u2022 ${river}: \u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25`);
        continue;
      }
      const place = s.name.replace(/\s*\((ต้น)?(ลำภาชี|ลำตะเพิน)\)|\s*(ลำภาชี|ลำตะเพิน)\s*/g, " ").trim();
      L.push(`\u2022 ${river}: ${bankText(s.diff_bank)}${arrow(s.trend)} \u0E17\u0E35\u0E48${place} (${hm(s.time, now)} \xB7 ${n} \u0E2A\u0E16\u0E32\u0E19\u0E35)`);
    }
  }
  const dams = (snapshot.dams ?? []).filter((d) => !d.missing);
  if (dams.length) {
    const dDate = dams[0].date ? (/* @__PURE__ */ new Date(`${dams[0].date}T00:00:00+07:00`)).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short" }) : "-";
    L.push("", `\u{1F3DE} \u0E40\u0E02\u0E37\u0E48\u0E2D\u0E19 (\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ${dDate})`);
    for (const d of dams) L.push(`\u2022 ${d.name.replace("\u0E40\u0E02\u0E37\u0E48\u0E2D\u0E19", "")} ${fmt3(d.pct, 1)}% \xB7 \u0E40\u0E02\u0E49\u0E32 ${fmt3(d.inflow_cms)} / \u0E23\u0E30\u0E1A\u0E32\u0E22 ${fmt3(d.outflow_cms)} \u0E25\u0E1A.\u0E21./\u0E27\u0E34`);
  }
  const obs = (snapshot.rain_obs ?? []).filter((g) => g.max);
  if (snapshot.rain_obs) {
    L.push("", `\u{1F327} \u0E1D\u0E19\u0E27\u0E31\u0E14\u0E44\u0E14\u0E49\u0E08\u0E23\u0E34\u0E07 24 \u0E0A\u0E21. (\u0E2A\u0E16\u0E32\u0E19\u0E35\u0E27\u0E31\u0E14\u0E1D\u0E19 \u0E13 ${hm(snapshot.rain_obs_at, now)})`);
    if (!obs.length) L.push("\u2022 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E16\u0E32\u0E19\u0E35\u0E43\u0E19\u0E25\u0E38\u0E48\u0E21\u0E19\u0E49\u0E33\u0E41\u0E21\u0E48\u0E01\u0E25\u0E2D\u0E07\u0E27\u0E31\u0E14\u0E1D\u0E19\u0E44\u0E14\u0E49");
    for (const g of obs) L.push(`\u2022 ${g.name}: \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 ${fmt3(g.max.mm, 1)} \u0E21\u0E21. (\u0E2D.${g.max.amphoe})${g.heavy ? ` \xB7 \u0E1D\u0E19\u0E2B\u0E19\u0E31\u0E01 ${g.heavy} \u0E2A\u0E16\u0E32\u0E19\u0E35` : ""}`);
  }
  const rain = (snapshot.rain ?? []).filter((p) => p.days?.length);
  if (rain.length) {
    L.push("", `\u{1F326} \u0E1D\u0E19\u0E04\u0E32\u0E14\u0E01\u0E32\u0E23\u0E13\u0E4C 3 \u0E27\u0E31\u0E19 (Open-Meteo \u0E13 ${hm(snapshot.generated_at, now)})`);
    for (const p of rain) L.push(`\u2022 ${p.name}: ${fmt3(p.days.slice(1, 4).reduce((a, b) => a + (b.mm ?? 0), 0))} \u0E21\u0E21.`);
  }
  const tide = snapshot.tide;
  const bank = (d) => d >= 0 ? `\u0E2A\u0E39\u0E07\u0E01\u0E27\u0E48\u0E32\u0E15\u0E25\u0E34\u0E48\u0E07 ${fmt3(d, 2)} \u0E21.` : `\u0E15\u0E48\u0E33\u0E01\u0E27\u0E48\u0E32\u0E15\u0E25\u0E34\u0E48\u0E07 ${fmt3(-d, 2)} \u0E21.`;
  if (tide?.highs?.length) {
    L.push("", `\u{1F30A} \u0E19\u0E49\u0E33\u0E17\u0E30\u0E40\u0E25\u0E2B\u0E19\u0E38\u0E19 ${tide.station.name} (\u0E04\u0E32\u0E14\u0E08\u0E32\u0E01\u0E04\u0E48\u0E32\u0E27\u0E31\u0E14\u0E08\u0E23\u0E34\u0E07 \xB10.2 \u0E21.)`);
    for (const h of tide.highs.slice(0, 2)) L.push(`\u2022 ${hm(h.time, now)} ${bank(h.diff)}`);
  } else {
    const sea = snapshot.sea?.next24h ?? [];
    const highs = sea.filter((r, i) => i > 0 && i < sea.length - 1 && r.m >= sea[i - 1].m && r.m > sea[i + 1].m);
    if (highs.length) L.push("", `\u{1F30A} \u0E19\u0E49\u0E33\u0E17\u0E30\u0E40\u0E25\u0E02\u0E36\u0E49\u0E19\u0E2A\u0E39\u0E07\u0E17\u0E35\u0E48\u0E1B\u0E32\u0E01\u0E41\u0E21\u0E48\u0E01\u0E25\u0E2D\u0E07 (\u0E41\u0E1A\u0E1A\u0E08\u0E33\u0E25\u0E2D\u0E07): ${highs.slice(0, 2).map((r) => `${hm(r.time, now)} ${fmt3(r.m, 2)} \u0E21.`).join(", ")}`);
  }
  const top = [...active].filter((a) => RANK2[a.level] >= RANK2.orange).sort((a, b) => RANK2[b.level] - RANK2[a.level]).slice(0, 3);
  if (top.length) {
    L.push("", "\u26A0\uFE0F \u0E08\u0E38\u0E14\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E27\u0E31\u0E07");
    for (const a of top) L.push(`\u2022 ${LEVEL[a.level]}: ${a.text}`);
  }
  if (webUrl) L.push("", `\u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14: ${webUrl}`);
  L.push("\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28\u0E17\u0E32\u0E07\u0E01\u0E32\u0E23 \xB7 \u0E09\u0E38\u0E01\u0E40\u0E09\u0E34\u0E19\u0E42\u0E17\u0E23 1784");
  L.push(`\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15 ${hm(snapshot.generated_at, now)} \xB7 Hoysang Naja`);
  return L.join("\n").slice(0, 4900);
}
async function rest(db, path, init) {
  const res = await fetch(`${db.url}/rest/v1/${path}`, { ...init, headers: { ...db.headers, ...init?.headers ?? {} } });
  if (!res.ok) throw new Error(`${path.split("?")[0]} HTTP ${res.status} ${await res.text()}`);
  return init?.method === "POST" ? null : res.json();
}
async function maybeSendDaily(db, snapshot, active, { token, webUrl, enabled = true }) {
  const now = new Date(snapshot.generated_at);
  const h = thai(now).getUTCHours();
  if (!enabled) return { status: "\u0E1B\u0E34\u0E14\u0E2D\u0E22\u0E39\u0E48 (DAILY_SUMMARY=off)" };
  if (h < SEND_FROM_H || h >= SEND_UNTIL_H) return { status: "\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E2A\u0E48\u0E07" };
  const date = thaiDate(now);
  const done = await rest(db, `daily_summary?select=status&date=eq.${date}`);
  if (done.length) return { status: `\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49${done[0].status === "sent" ? "\u0E2A\u0E48\u0E07\u0E41\u0E25\u0E49\u0E27" : "\u0E02\u0E49\u0E32\u0E21\u0E41\u0E25\u0E49\u0E27"}` };
  if (!token) return { status: "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 LINE_CHANNEL_ACCESS_TOKEN" };
  const save = (row) => rest(db, "daily_summary?on_conflict=date", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ date, ...row })
  });
  const [q] = await rest(db, `line_quota?select=*&month=eq.${thaiMonth(now)}`);
  if (q?.quota != null) {
    const per = Math.max(1, q.reach ?? 1);
    if (q.warned >= 80 || q.quota - q.used - per < per * RESERVE_ALERTS) {
      const note = `\u0E42\u0E04\u0E27\u0E15\u0E32\u0E40\u0E2B\u0E25\u0E37\u0E2D ${q.quota - q.used} \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21 (\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A ${per} \u0E04\u0E19) \u2014 \u0E40\u0E01\u0E47\u0E1A\u0E44\u0E27\u0E49\u0E2A\u0E48\u0E07\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E20\u0E31\u0E22`;
      await save({ status: "skipped", note });
      return { status: "\u0E02\u0E49\u0E32\u0E21", note };
    }
  }
  const text = formatDaily(snapshot, active, webUrl, now);
  await sendLine(token, text);
  await save({ status: "sent", sent_at: now.toISOString(), text });
  return { status: "\u0E2A\u0E48\u0E07\u0E41\u0E25\u0E49\u0E27" };
}

// ingest/rainobs.mjs
var URL_24H = "https://api-v3.thaiwater.net/api/v1/thaiwater30/public/rain_24h";
var UA2 = "WaterWest/0.1 (non-commercial Mae Klong flood monitoring)";
var FETCH_EVERY_MIN = 55;
var MAX_AGE_H = 6;
var RAIN_GROUPS = [
  { id: "khwaeyai", name: "\u0E41\u0E04\u0E27\u0E43\u0E2B\u0E0D\u0E48\u0E15\u0E2D\u0E19\u0E1A\u0E19 (\u0E2D\u0E38\u0E49\u0E21\u0E1C\u0E32\u0E07\u2013\u0E28\u0E23\u0E35\u0E2A\u0E27\u0E31\u0E2A\u0E14\u0E34\u0E4C)", subs: ["1401", "1402", "1403", "1404", "1405", "1406", "1407"], upstream: true },
  { id: "khwaenoi_up", name: "\u0E41\u0E04\u0E27\u0E19\u0E49\u0E2D\u0E22\u0E15\u0E2D\u0E19\u0E1A\u0E19 (\u0E2A\u0E31\u0E07\u0E02\u0E25\u0E30\u0E1A\u0E38\u0E23\u0E35\u2013\u0E17\u0E2D\u0E07\u0E1C\u0E32\u0E20\u0E39\u0E21\u0E34)", subs: ["1410", "1411"], upstream: true },
  { id: "taphoen", name: "\u0E25\u0E33\u0E15\u0E30\u0E40\u0E1E\u0E34\u0E19 (\u0E14\u0E48\u0E32\u0E19\u0E0A\u0E49\u0E32\u0E07\u2013\u0E1A\u0E48\u0E2D\u0E1E\u0E25\u0E2D\u0E22)", subs: ["1408"] },
  { id: "khwaenoi_low", name: "\u0E41\u0E04\u0E27\u0E19\u0E49\u0E2D\u0E22\u0E15\u0E2D\u0E19\u0E25\u0E48\u0E32\u0E07 (\u0E17\u0E2D\u0E07\u0E1C\u0E32\u0E20\u0E39\u0E21\u0E34\u2013\u0E44\u0E17\u0E23\u0E42\u0E22\u0E04)", subs: ["1412", "1413"] },
  { id: "lower", name: "\u0E01\u0E32\u0E0D\u0E08\u0E19\u0E1A\u0E38\u0E23\u0E35\u2013\u0E23\u0E32\u0E0A\u0E1A\u0E38\u0E23\u0E35\u2013\u0E2A\u0E21\u0E38\u0E17\u0E23\u0E2A\u0E07\u0E04\u0E23\u0E32\u0E21", subs: [] }
  // ที่เหลือทั้งหมด
];
var groupOf = (sub) => (RAIN_GROUPS.find((g) => g.subs.includes(sub)) ?? RAIN_GROUPS[RAIN_GROUPS.length - 1]).id;
var HEAVY_MM = 35;
async function fetchRainObs(now = /* @__PURE__ */ new Date()) {
  const res = await fetch(URL_24H, { headers: { "User-Agent": UA2 }, signal: AbortSignal.timeout(9e4) });
  if (!res.ok) throw new Error(`ThaiWater rain_24h HTTP ${res.status}`);
  const j = await res.json();
  const rows = [];
  for (const r of j.data ?? []) {
    if (!/แม่กลอง/.test(r.basin?.basin_name?.th ?? "")) continue;
    const at = /* @__PURE__ */ new Date(`${String(r.rainfall_datetime).replace(" ", "T")}:00+07:00`);
    if (!(r.rain_24h > 0) || (now - at) / 36e5 > MAX_AGE_H) continue;
    rows.push({
      station_id: r.station.id,
      name: r.station.tele_station_name?.th ?? "",
      amphoe: r.geocode?.amphoe_name?.th ?? "",
      province: r.geocode?.province_name?.th ?? "",
      agency: r.agency?.agency_shortname?.th?.trim() ?? "",
      sub_basin: r.station.sub_basin_id ?? "",
      grp: groupOf(r.station.sub_basin_id ?? ""),
      lat: r.station.tele_station_lat,
      lon: r.station.tele_station_long,
      mm_24h: r.rain_24h,
      measured_at: at.toISOString(),
      checked_at: now.toISOString()
    });
  }
  return rows;
}
function summarizeRainObs(rows) {
  return RAIN_GROUPS.map((g) => {
    const a = rows.filter((r) => r.grp === g.id).sort((x, y) => y.mm_24h - x.mm_24h);
    return {
      id: g.id,
      name: g.name,
      upstream: !!g.upstream,
      stations: a.length,
      heavy: a.filter((r) => r.mm_24h >= HEAVY_MM).length,
      max: a[0] ? { mm: Number(a[0].mm_24h), name: a[0].name, amphoe: a[0].amphoe, at: a[0].measured_at } : null
    };
  });
}
var MARKER_ID = 0;
var marker = (now) => ({
  station_id: MARKER_ID,
  name: "checked",
  amphoe: "",
  province: "",
  agency: "",
  sub_basin: "",
  grp: "meta",
  lat: null,
  lon: null,
  mm_24h: 0,
  measured_at: now.toISOString(),
  checked_at: now.toISOString()
});
async function syncRainObs(db, now = /* @__PURE__ */ new Date()) {
  const cur = await fetch(`${db.url}/rest/v1/rain_obs?select=*`, { headers: db.headers }).then((r) => {
    if (!r.ok) throw new Error(`\u0E2D\u0E48\u0E32\u0E19 rain_obs \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08: HTTP ${r.status}`);
    return r.json();
  });
  const m = cur.find((r) => r.station_id === MARKER_ID);
  const stations = cur.filter((r) => r.station_id !== MARKER_ID);
  if (m && (now - new Date(m.checked_at)) / 6e4 < FETCH_EVERY_MIN) {
    return { fetched: false, groups: summarizeRainObs(stations), checked_at: m.checked_at };
  }
  const rows = [marker(now), ...await fetchRainObs(now)];
  const up = await fetch(`${db.url}/rest/v1/rain_obs?on_conflict=station_id`, {
    method: "POST",
    headers: { ...db.headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows)
  });
  if (!up.ok) throw new Error(`\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 rain_obs \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08: HTTP ${up.status} ${await up.text()}`);
  const del = await fetch(`${db.url}/rest/v1/rain_obs?checked_at=lt.${encodeURIComponent(now.toISOString())}`, { method: "DELETE", headers: db.headers });
  if (!del.ok) throw new Error(`\u0E25\u0E1A rain_obs \u0E40\u0E01\u0E48\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08: HTTP ${del.status}`);
  return { fetched: true, groups: summarizeRainObs(rows.slice(1)), checked_at: now.toISOString() };
}

// ingest/tide.mjs
var TIDE_STATION = { code: "MKG006", name: "\u0E2A\u0E30\u0E1E\u0E32\u0E19\u0E1E\u0E23\u0E30\u0E23\u0E32\u0E21\u0E2A\u0E2D\u0E07 \u0E2A\u0E21\u0E38\u0E17\u0E23\u0E2A\u0E07\u0E04\u0E23\u0E32\u0E21" };
var FIT_HOURS = 72;
var MIN_POINTS = 36;
var UA3 = "WaterWest/0.1 (non-commercial Mae Klong flood monitoring)";
var MODEL_URL = "https://marine-api.open-meteo.com/v1/marine?latitude=13.36&longitude=100.0&hourly=sea_level_height_msl&timezone=GMT&past_days=3&forecast_days=2";
var hourOf = (ms) => Math.floor(ms / 36e5);
function fitTide(model, obs, nowMs = Date.now()) {
  const now = hourOf(nowMs);
  const hours = [...obs.keys()].filter((h) => h > now - FIT_HOURS && h <= now);
  let best = null;
  for (let lag = 0; lag <= 3; lag++) {
    let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const h of hours) {
      const x = model.get(h - lag), y = obs.get(h);
      if (x == null || y == null) continue;
      n++;
      sx += x;
      sy += y;
      sxx += x * x;
      sxy += x * y;
    }
    if (n < MIN_POINTS || sxx - sx * sx / n <= 0) continue;
    const a = (sxy - sx * sy / n) / (sxx - sx * sx / n);
    const b = (sy - a * sx) / n;
    let se = 0;
    for (const h of hours) {
      const x = model.get(h - lag), y = obs.get(h);
      if (x != null && y != null) se += (a * x + b - y) ** 2;
    }
    const rmse = Math.sqrt(se / n);
    if (!best || rmse < best.rmse) best = { lag, a, b, rmse, n };
  }
  if (!best || best.a < 0.3) return null;
  const pred = [];
  for (let h = now - 24; h <= now + 48; h++) {
    const x = model.get(h - best.lag);
    if (x != null) pred.push([h, +(best.a * x + best.b).toFixed(3)]);
  }
  const highs = [];
  for (let i = 1; i < pred.length - 1; i++) {
    const [h, v] = pred[i];
    if (h >= now && v >= pred[i - 1][1] && v > pred[i + 1][1]) highs.push({ time: new Date(h * 36e5).toISOString(), diff: v });
  }
  return { ...best, rmse: +best.rmse.toFixed(3), pred: pred.map(([h, v]) => [h * 36e5, v]), highs };
}
async function fetchModel() {
  const res = await fetch(MODEL_URL, { headers: { "User-Agent": UA3 }, signal: AbortSignal.timeout(3e4) });
  if (!res.ok) throw new Error(`Open-Meteo marine HTTP ${res.status}`);
  const j = await res.json();
  return new Map(j.hourly.time.map((t, i) => [hourOf((/* @__PURE__ */ new Date(`${t}:00Z`)).getTime()), j.hourly.sea_level_height_msl[i]]).filter(([, v]) => v != null));
}
async function fetchObs(db, nowMs = Date.now()) {
  const since = new Date(nowMs - (FIT_HOURS + 2) * 36e5).toISOString();
  const res = await fetch(`${db.url}/rest/v1/readings?select=measured_at,diff_bank&station_code=eq.${TIDE_STATION.code}&measured_at=gte.${since}&diff_bank=not.is.null&order=measured_at.asc&limit=2000`, { headers: db.headers });
  if (!res.ok) throw new Error(`\u0E2D\u0E48\u0E32\u0E19 readings ${TIDE_STATION.code} \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08: HTTP ${res.status}`);
  const sum = /* @__PURE__ */ new Map();
  for (const r of await res.json()) {
    const h = hourOf(new Date(r.measured_at).getTime());
    const [s, n] = sum.get(h) ?? [0, 0];
    sum.set(h, [s + Number(r.diff_bank), n + 1]);
  }
  return new Map([...sum].map(([h, [s, n]]) => [h, s / n]));
}
async function tideFromStation(db, nowMs = Date.now()) {
  const [model, obs] = await Promise.all([fetchModel(), fetchObs(db, nowMs)]);
  const f = fitTide(model, obs, nowMs);
  if (!f) return null;
  return { station: TIDE_STATION, lag_h: f.lag, rmse: f.rmse, n: f.n, highs: f.highs.slice(0, 4), fitted_at: new Date(nowMs).toISOString() };
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
Deno.serve(async (req) => {
  const env = { SUPABASE_URL: Deno.env.get("SUPABASE_URL"), SUPABASE_SECRET_KEY: secretKey() };
  const db = dbConfig(env);
  if (!db) return json({ error: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E48\u0E32 SUPABASE_URL / \u0E04\u0E35\u0E22\u0E4C" }, 500);
  const ridParam = new URL(req.url).searchParams.get("rid_day");
  const ridDay = ridParam === null ? NaN : Number(ridParam);
  if (Number.isInteger(ridDay) && ridDay >= 0 && ridDay <= 60) {
    const codes = new Set(STATIONS.filter((s) => s.src === "swoc").map((s) => s.code));
    const rows = await ridHistoryRows(new Date(Date.now() - ridDay * 864e5), codes);
    return json({ rid_day: ridDay, saved: await upsert(db, "readings", rows) });
  }
  const last = await fetch(`${db.url}/rest/v1/ingest_runs?select=started_at&order=started_at.desc&limit=1`, { headers: db.headers }).then((r) => r.json()).catch(() => []);
  const lastAt = last?.[0]?.started_at ? new Date(last[0].started_at).getTime() : 0;
  const gapMin = (Date.now() - lastAt) / 6e4;
  if (gapMin < MIN_GAP_MIN) return json({ skipped: true, reason: `\u0E23\u0E2D\u0E1A\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14\u0E40\u0E21\u0E37\u0E48\u0E2D ${gapMin.toFixed(1)} \u0E19\u0E32\u0E17\u0E35\u0E01\u0E48\u0E2D\u0E19` });
  const snapshot = await collect();
  const saved = await store(snapshot, env);
  const failed = Object.entries(snapshot.sources).filter(([, v]) => v !== "ok").map(([k]) => k);
  let rainObs = {};
  try {
    const r = await syncRainObs(db, new Date(snapshot.generated_at));
    Object.assign(snapshot, { rain_obs: r.groups, rain_obs_at: r.checked_at });
    rainObs = { fetched: r.fetched, checked_at: r.checked_at };
  } catch (e) {
    rainObs = { error: String(e.message ?? e) };
  }
  let tide = {};
  try {
    const t = await tideFromStation(db, new Date(snapshot.generated_at).getTime());
    Object.assign(snapshot, { tide: t });
    tide = t ? { lag_h: t.lag_h, rmse: t.rmse, highs: t.highs.length } : { status: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E16\u0E32\u0E19\u0E35\u0E44\u0E21\u0E48\u0E1E\u0E2D \u0E43\u0E0A\u0E49\u0E41\u0E1A\u0E1A\u0E08\u0E33\u0E25\u0E2D\u0E07\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27" };
  } catch (e) {
    tide = { error: String(e.message ?? e) };
  }
  const token = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
  let alerts = {};
  let active = [];
  try {
    const sync = await syncAlerts(db, snapshot, { lineReady: !!token });
    active = sync.active;
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
  const adminId = Deno.env.get("LINE_ADMIN_USER_ID");
  let health = {};
  try {
    const notes = await checkHealth(db, snapshot);
    let line = notes.length ? "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 LINE_ADMIN_USER_ID" : "\u0E1B\u0E01\u0E15\u0E34";
    if (notes.length && token && adminId) {
      const webUrl = Deno.env.get("WEB_URL");
      await pushLine(token, adminId, formatHealth(notes, snapshot, webUrl ? new URL("/admin", webUrl).href : void 0));
      line = "\u0E2A\u0E48\u0E07\u0E41\u0E25\u0E49\u0E27";
    }
    health = { notes: notes.map((n) => n.text), line };
  } catch (e) {
    health = { error: String(e.message ?? e) };
  }
  let quota = {};
  if (token) {
    try {
      quota = await syncQuota(db, token, adminId);
    } catch (e) {
      quota = { error: String(e.message ?? e) };
    }
  }
  let daily = {};
  try {
    const webUrl = Deno.env.get("WEB_URL");
    daily = await maybeSendDaily(db, snapshot, active, {
      token,
      webUrl: webUrl ? new URL("/", webUrl).href : void 0,
      enabled: Deno.env.get("DAILY_SUMMARY") !== "off"
    });
  } catch (e) {
    daily = { error: String(e.message ?? e) };
  }
  return json({ ok: true, generated_at: snapshot.generated_at, saved, failed, alerts, health, quota, daily, rainObs, tide });
});
