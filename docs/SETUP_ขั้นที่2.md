# ขั้นที่ 2 — ตั้งค่าฐานข้อมูลและการดึงข้อมูลอัตโนมัติ (ฟรีทั้งหมด)

ใช้เวลาราว 15–20 นาที ลุงทำส่วนที่ต้องสมัคร/ล็อกอินเอง (ข้อ A–C) แล้วส่งให้ผมทำต่อ (ข้อ D)

## A. สร้างฐานข้อมูล Supabase
1. เข้า https://supabase.com → **Start your project** → สมัครด้วยบัญชี GitHub (หรืออีเมล)
2. **New project**
   - Name: `waterwest`
   - Database Password: ตั้งรหัสยาว ๆ แล้ว **จดเก็บเอง** (ผมไม่ต้องใช้)
   - Region: **Southeast Asia (Singapore)**
   - Plan: **Free**
3. รอสร้างเสร็จ (~2 นาที) → เมนูซ้าย **SQL Editor** → **New query**
4. เปิดไฟล์ `supabase/schema.sql` ในโฟลเดอร์นี้ คัดลอกทั้งหมดไปวาง → **Run** → ต้องขึ้น "Success"
5. เมนู **Project Settings → API Keys** จดไว้ 2 ค่า:
   - **Project URL** (เช่น `https://abcd1234.supabase.co`) — อยู่ที่ Project Settings → Data API
   - **Secret key** (`sb_secret_...`) — ⚠️ เป็นความลับ ห้ามส่งในแชท ห้ามโพสต์ที่ไหน

## B. สร้าง GitHub repository
1. เข้า https://github.com → สมัคร/ล็อกอิน
2. **New repository**
   - Name: `waterwest`
   - เลือก **Public** (แนะนำ: GitHub Actions ฟรีไม่จำกัดนาทีสำหรับ public repo — ถ้าเป็น Private จะได้ 2,000 นาที/เดือน ซึ่ง**ไม่พอ**กับการรันทุก 15 นาที)
   - ไม่ต้องติ๊ก README
   - โค้ดไม่มีความลับอยู่ในไฟล์ (ความลับเก็บใน Secrets ข้อ C)

## C. ใส่ความลับใน GitHub (ลุงทำเอง)
repo `waterwest` → **Settings → Secrets and variables → Actions → New repository secret** สร้าง 2 ตัว:
| Name | Value |
|---|---|
| `SUPABASE_URL` | Project URL จากข้อ A5 |
| `SUPABASE_SECRET_KEY` | Secret key จากข้อ A5 |

## D. ส่งต่อให้ผม
บอกผมว่า "ตั้งค่าเสร็จแล้ว" พร้อม **ชื่อ GitHub username** (ไม่ต้องส่ง key) แล้วผมจะ:
1. สร้าง git commit แรกและ push โค้ดขึ้น repo (ลุงอาจต้องล็อกอิน GitHub ในหน้าต่างที่เด้งขึ้นมา 1 ครั้ง)
2. สั่งรัน workflow ครั้งแรก แล้วตรวจว่าข้อมูลเข้า Supabase จริง
3. ตรวจว่าตั้งเวลาทุก 15 นาทีทำงาน

## ทดสอบในเครื่องตัวเอง (ไม่บังคับ)
คัดลอก `.env.example` เป็น `.env` ใส่ค่าจริง แล้วรัน `npm run snapshot` — ไฟล์ `.env` ถูกกันไม่ให้ขึ้น GitHub แล้ว

## หมายเหตุ
- Supabase ฟรี: ฐานข้อมูล 500 MB · ประมาณการใช้ ~2,000 แถว/วัน (~1–2 MB/วัน) พอใช้หลายเดือน — ขั้นถัดไปจะทำสรุปรายชั่วโมงและลบข้อมูลดิบเก่า
- Supabase ฟรีจะพักโปรเจกต์ถ้าไม่มีการใช้งาน 7 วัน — การเขียนข้อมูลทุก 15 นาทีน่าจะกันไว้ได้ ผมจะเฝ้าดูให้
- GitHub cron อาจคลาดเคลื่อน 5–15 นาทีช่วงคนใช้มาก เป็นเรื่องปกติ
