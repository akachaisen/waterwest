-- ตั้งเวลาเรียก Edge Function "ingest" ทุก 15 นาที (นาทีที่ 2, 17, 32, 47) ด้วย Supabase Cron
-- วิธีใช้: Supabase → SQL Editor → วางไฟล์นี้ → Run (รันซ้ำได้ — จะแทนที่งานเดิมชื่อเดียวกัน)
-- ฟังก์ชันไม่ต้องใช้คีย์ (verify_jwt ปิด) และจะไม่ทำงานซ้ำถ้ารอบล่าสุดยังไม่ถึง 8 นาที

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'waterwest-ingest',
  '2,17,32,47 * * * *',
  $$
  select net.http_post(
    url := 'https://jvwxhxrtckfvflzrrsxe.supabase.co/functions/v1/ingest',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

-- ตรวจผล:
--   select jobname, schedule, active from cron.job;
--   select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
--   select started_at from ingest_runs order by started_at desc limit 5;
