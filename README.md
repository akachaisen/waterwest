# WaterWest

ติดตามลุ่มน้ำแม่กลอง: เขื่อนวชิราลงกรณ / ศรีนครินทร์ → เขื่อนแม่กลอง → ราชบุรี → ปากอ่าวสมุทรสงคราม
แผนออกแบบทั้งหมด: [../DESIGN_เว็บติดตามน้ำแม่กลอง.md](../DESIGN_เว็บติดตามน้ำแม่กลอง.md)

## ขั้นที่ 1: สคริปต์ดึงข้อมูล (ยังไม่มีเว็บ)

ต้องมี Node.js 20 ขึ้นไป ไม่ต้องติดตั้ง package เพิ่ม

```bash
npm run snapshot
```

ผลลัพธ์:
- `data/latest.md` ตารางสถานะทั้งเส้นทางน้ำ (อ่านง่าย)
- `data/latest.json` ข้อมูลเดียวกันในรูป JSON (เว็บในขั้นถัดไปจะใช้ไฟล์นี้)
- `data/history/snapshot-*.json` เก็บทุกครั้งที่รัน (ใช้ดูแนวโน้มในขั้นที่ 2)

| ไฟล์ | หน้าที่ |
|---|---|
| `ingest/stations.mjs` | ทะเบียนสถานี 21 จุด เรียงต้นน้ำ→ปลายน้ำ, เขื่อน, จุดฝน, CCTV |
| `ingest/sources.mjs` | ตัวดึงข้อมูลแต่ละแหล่ง |
| `ingest/snapshot.mjs` | รวมข้อมูล จัดสถานะสี กฎเตือนภัยต้นแบบ เขียนไฟล์ |

## แหล่งข้อมูล
| แหล่ง | Endpoint | ใช้ทำอะไร |
|---|---|---|
| กรมชลประทาน SWOC | `bigdata-swoc.rid.go.th/api/ma/pier/all/get_pier_data` | สถานี K.*, TK.* เทียบตลิ่ง แนวโน้ม ปริมาณ (รวม K.2B ตัวเมืองราชบุรี) |
| ThaiWater (สสน.) | `api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load` | สถานี กฟผ. (MKVKD/MKSND), สสน. (RAJ, MKG) |
| กรมชลประทาน อ่างเก็บน้ำ | `app.rid.go.th/reservoir/api/dam/public` | วชิราลงกรณ, ศรีนครินทร์ |
| กฟผ. | `water.egat.co.th/telemeter/schematic/index.php` (HTML) | ความจุลำน้ำ, ระดับเขื่อนแม่กลอง |
| Open-Meteo | `api.open-meteo.com`, `marine-api.open-meteo.com` | ฝน 3 วัน, ระดับน้ำทะเล (แบบจำลอง) |
| กฟผ. CCTV | `vrkdam.egat.co.th/cctv/image1.php`, `image2.php` | ตรวจว่ากล้องใช้งานได้ |

## ขั้นที่ 2: ฐานข้อมูล + ดึงอัตโนมัติทุก 15 นาที
- `supabase/schema.sql` ตาราง stations, readings, dam_daily, rain_forecast, sea_level, ingest_runs + view `latest_readings` · อ่านได้สาธารณะ เขียนได้เฉพาะ secret key
- `ingest/store.mjs` บันทึกผ่าน Supabase REST แบบ upsert (รันซ้ำไม่เกิดข้อมูลซ้ำ) · ถ้าไม่ตั้งค่า env จะข้ามการบันทึก
- `.github/workflows/ingest.yml` GitHub Actions กดรันเองได้ (ปิดการรันตามเวลาแล้ว) · สรุปผลแสดงในหน้า Actions
- ตรวจคุณภาพข้อมูล: ตัดค่าที่เป็นไปไม่ได้, เทียบปริมาณกับ กฟผ., เวลาในอนาคต → บันทึกเหตุผลในคอลัมน์ `qc`
- วิธีตั้งค่า: [docs/SETUP_ขั้นที่2.md](docs/SETUP_ขั้นที่2.md)

## ตัวตั้งเวลาหลัก: Supabase Edge Function + Cron
GitHub Actions cron บน repo นี้รันจริงแค่ทุก 4–5 ชม. จึงย้ายตัวตั้งเวลาหลักไปที่ Supabase · GitHub เหลือไว้กดรันเอง และมี `watchdog.yml` เฝ้าทุกชั่วโมง แจ้ง LINE ผู้ดูแลถ้า Supabase หยุด
- `ingest/core.mjs` โค้ดรวบรวมข้อมูล ใช้ร่วมกันทั้ง Node และ Edge Function
- `supabase/functions/ingest/index.ts` Edge Function — ไม่ต้องใช้คีย์เรียก (verify_jwt ปิด) แต่จะข้ามถ้ารอบล่าสุดยังไม่ถึง 8 นาที
- สร้างไฟล์ deploy: `npm run build:function` → `supabase/functions/ingest/dist/index.js` (วางใน Dashboard → Edge Functions → ingest → Code)
- `supabase/cron.sql` ตั้งเวลา Supabase Cron นาทีที่ 2, 17, 32, 47 ของทุกชั่วโมง
- ข้อมูลเขื่อน: ถ้าเรียก API กรมชลฯ ไม่ได้ (Deno บน Supabase เชื่อมต่อเว็บ กรมชลฯ ไม่ได้) จะใช้ข้อมูลชุดเดียวกันจาก ThaiWater แทน

## ขั้นที่ 3: เว็บ (Next.js) — หน้าภาพรวม + ผังเส้นทางน้ำ
อยู่ในโฟลเดอร์ `web/` (Next.js 16 + Tailwind 4, ฟอนต์ IBM Plex Sans Thai, รองรับมือถือและโหมดมืด)

```bash
cd web
npm install
npm run dev      # เปิด http://localhost:3000
```

- `/` ภาพรวม: สถานะรวมลุ่มน้ำ 4 ระดับ, ตัวเลขสำคัญ (เขื่อน 2 แห่ง, น้ำท้ายเขื่อนแม่กลอง, ราชบุรี, แควน้อย, บางคนที), สัญญาณเตือน, สถานะรายช่วงแม่น้ำ, ฝน, น้ำทะเลหนุน, เบอร์ฉุกเฉิน
- `/river` ผังเส้นทางน้ำ: แควน้อย/แควใหญ่ → จุดรวม → เขื่อนแม่กลอง → ปากอ่าว พร้อมเวลาเดินทางของมวลน้ำ (ประมาณการ)
- แหล่งข้อมูล (`web/lib/data.ts`): ถ้าตั้ง `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` จะอ่านจากฐานข้อมูล ไม่ตั้งจะอ่าน `data/latest.json` (รัน `npm run snapshot` ที่โฟลเดอร์หลักก่อน)

## กฎสถานะ / เตือนภัย (ต้นแบบ)
- สูงกว่าตลิ่ง = 🔴 ล้นตลิ่ง · ต่ำกว่าตลิ่งไม่ถึง 1 ม. = 🟠 ใกล้ตลิ่ง · นอกนั้น 🟢
- เตือน: K.37 เกินความจุลำน้ำ · K.55A เกิน 2,500 / 3,000 ลบ.ม./วิ · สถานีล้นตลิ่ง · เขื่อน ≥98% และน้ำเข้ามากกว่าระบาย · ฝนเหนืออ่าง 3 วัน ≥50 มม.
- ข้อมูลเก่ากว่า 3 ชม. ติดป้าย ⚠️เก่า
