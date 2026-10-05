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

-- ขั้นที่ 6: สถานะเตือนภัย (1 แถวต่อเหตุ เช่น bank:K.55A, dam:200402) — ใช้กันการแจ้ง LINE ซ้ำ
create table if not exists alert_state (
  key            text primary key,
  level          text not null,          -- yellow / orange / red
  text           text not null,
  first_seen     timestamptz not null,
  last_seen      timestamptz not null,
  active         boolean not null default true,
  cleared_at     timestamptz,
  notified_level text,                   -- ระดับสูงสุดที่แจ้ง LINE ไปแล้วในรอบเหตุการณ์นี้
  notified_at    timestamptz,
  clear_notified boolean not null default true
);
create index if not exists alert_state_active on alert_state (active, last_seen desc);

-- ขั้นที่ 8.6: ประกาศที่ผู้ดูแลกรอกเอง (เช่น ตัวเลขระบายเขื่อนแม่กลองจากประกาศทางการ)
create table if not exists announcements (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  title         text not null,
  body          text,
  level         text not null default 'info',    -- info / yellow / orange / red
  source_url    text,
  maeklong_cms  numeric,                          -- ระบายเขื่อนแม่กลอง (ลบ.ม./วิ) ถ้าเป็นประกาศเรื่องนี้
  effective_at  timestamptz not null default now(),
  expires_at    timestamptz
);
create index if not exists announcements_time on announcements (effective_at desc);

-- โควตาข้อความ LINE รายเดือน (Edge Function อัปเดตทุกรอบ) · ไม่มี policy อ่านสาธารณะ — อ่านได้เฉพาะ secret key (หน้าหลังบ้าน)
create table if not exists line_quota (
  month       text primary key,          -- YYYY-MM ตามเวลาไทย
  quota       int,                       -- โควตาต่อเดือน (null = ไม่จำกัด)
  used        int not null,              -- ใช้ไปแล้วเดือนนี้
  reach       int,                       -- ผู้รับ broadcast (= ข้อความที่ใช้ต่อการแจ้งเตือน 1 ครั้ง)
  followers   int,
  warned      int not null default 0,    -- ระดับเตือนที่แจ้งผู้ดูแลแล้ว: 0 / 80 / 95 / 100
  checked_at  timestamptz not null
);
alter table line_quota enable row level security;

-- สรุปสถานการณ์รายวัน (ส่ง LINE 06:00 น. วันละครั้ง) · อ่านได้เฉพาะ secret key
create table if not exists daily_summary (
  date     date primary key,             -- วันที่ตามเวลาไทย
  status   text not null,                -- sent / skipped
  sent_at  timestamptz,
  note     text,                         -- เหตุผลที่ข้าม (เช่น โควตาใกล้หมด)
  text     text                          -- ข้อความที่ส่ง
);
alter table daily_summary enable row level security;

-- ค่าล่าสุดของแต่ละสถานี (ใช้ในหน้าเว็บ)
create or replace view latest_readings with (security_invoker = true) as
select distinct on (r.station_code)
  r.*, s.name, s.seg, s.is_key, s.capacity
from readings r
join stations s on s.code = r.station_code
order by r.station_code, r.measured_at desc;

-- ค่าเฉลี่ยรายชั่วโมง (ใช้ทำกราฟ — รวมทุกแหล่งของสถานีเดียวกัน)
create or replace view readings_hourly with (security_invoker = true) as
select
  station_code,
  date_trunc('hour', measured_at) as hour,
  round(avg(diff_bank), 3) as diff_bank,
  round(avg(q), 1)         as q,
  count(*)                 as n
from readings
group by station_code, date_trunc('hour', measured_at);

-- ข้อมูลเป็นสาธารณะ: ทุกคนอ่านได้ เขียนได้เฉพาะสคริปต์ (secret key ข้าม RLS)
alter table stations      enable row level security;
alter table readings      enable row level security;
alter table dam_daily     enable row level security;
alter table rain_forecast enable row level security;
alter table sea_level     enable row level security;
alter table ingest_runs   enable row level security;
alter table alert_state   enable row level security;
alter table announcements enable row level security;

do $$
declare t text;
begin
  foreach t in array array['stations','readings','dam_daily','rain_forecast','sea_level','ingest_runs','alert_state','announcements'] loop
    if not exists (select 1 from pg_policies where tablename = t and policyname = 'public read') then
      execute format('create policy "public read" on %I for select using (true)', t);
    end if;
  end loop;
end $$;
