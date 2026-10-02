-- WaterWest ขั้นที่ 2: ฐานข้อมูลเก็บประวัติ (Supabase / PostgreSQL)
-- วิธีใช้: Supabase → SQL Editor → วางไฟล์นี้ทั้งไฟล์ → Run (รันซ้ำได้ ไม่ลบข้อมูลเดิม)

-- ทะเบียนสถานี (อัปเดตทุกรอบจากสคริปต์)
create table if not exists stations (
  code            text primary key,
  name            text not null,
  seg             text not null,
  river           text,
  province        text,
  lat             double precision,
  lon             double precision,
  capacity        numeric,          -- ความจุลำน้ำ ลบ.ม./วิ
  capacity_source text,
  is_key          boolean not null default false,
  updated_at      timestamptz not null default now()
);

-- ค่าวัดระดับน้ำ (1 แถว ต่อ สถานี/แหล่ง/เวลาวัด — ดึงซ้ำทุก 15 นาทีก็ไม่ซ้ำ)
create table if not exists readings (
  id           bigint generated always as identity primary key,
  station_code text not null references stations(code),
  source       text not null,
  measured_at  timestamptz not null,
  wl           numeric,               -- ระดับน้ำ (ม.) ส่วนใหญ่ ม.รทก.
  bank         numeric,               -- ระดับตลิ่ง
  diff_bank    numeric,               -- + = สูงกว่าตลิ่ง
  pct_bank     numeric,
  q            numeric,               -- ปริมาณน้ำ ลบ.ม./วิ
  trend        text,
  qc           text,                  -- หมายเหตุตรวจคุณภาพข้อมูล
  ingested_at  timestamptz not null default now(),
  unique (station_code, source, measured_at)
);
create index if not exists readings_station_time on readings (station_code, measured_at desc);

-- เขื่อนรายวัน (อัปเดตทับภายในวันเดียวกัน)
create table if not exists dam_daily (
  dam_id         text not null,
  name           text not null,
  date           date not null,
  volume         numeric,   -- ล้าน ลบ.ม.
  normal_storage numeric,
  pct            numeric,
  inflow_mcm     numeric,   -- ล้าน ลบ.ม./วัน
  outflow_mcm    numeric,
  updated_at     timestamptz not null default now(),
  primary key (dam_id, date)
);

-- พยากรณ์ฝน (เก็บแยกตามวันที่ออกพยากรณ์ เพื่อเทียบความแม่นภายหลัง)
create table if not exists rain_forecast (
  point_id      text not null,
  forecast_date date not null,
  issued_on     date not null,
  mm            numeric,
  prob          numeric,
  updated_at    timestamptz not null default now(),
  primary key (point_id, forecast_date, issued_on)
);

-- ระดับน้ำทะเลแบบจำลอง (ค่าล่าสุดทับค่าเดิม)
create table if not exists sea_level (
  point      text not null,
  at         timestamptz not null,
  m          numeric,
  updated_at timestamptz not null default now(),
  primary key (point, at)
);

-- บันทึกการรันแต่ละรอบ (สถานะแหล่งข้อมูล + สัญญาณเตือน ณ รอบนั้น)
create table if not exists ingest_runs (
  id           bigint generated always as identity primary key,
  started_at   timestamptz not null,
  sources      jsonb not null,
  alerts       jsonb not null,
  n_readings   int not null,
  maeklong_q   numeric       -- ปริมาณที่ K.55A (แทนการระบายเขื่อนแม่กลอง)
);
create index if not exists ingest_runs_time on ingest_runs (started_at desc);

-- ค่าล่าสุดของแต่ละสถานี (ใช้ในหน้าเว็บ)
create or replace view latest_readings as
select distinct on (r.station_code)
  r.*, s.name, s.seg, s.is_key, s.capacity
from readings r
join stations s on s.code = r.station_code
order by r.station_code, r.measured_at desc;

-- ข้อมูลเป็นสาธารณะ: ทุกคนอ่านได้ เขียนได้เฉพาะสคริปต์ (secret key ข้าม RLS)
alter table stations      enable row level security;
alter table readings      enable row level security;
alter table dam_daily     enable row level security;
alter table rain_forecast enable row level security;
alter table sea_level     enable row level security;
alter table ingest_runs   enable row level security;

do $$
declare t text;
begin
  foreach t in array array['stations','readings','dam_daily','rain_forecast','sea_level','ingest_runs'] loop
    if not exists (select 1 from pg_policies where tablename = t and policyname = 'public read') then
      execute format('create policy "public read" on %I for select using (true)', t);
    end if;
  end loop;
end $$;
