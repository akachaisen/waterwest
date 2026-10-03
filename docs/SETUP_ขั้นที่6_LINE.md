# ขั้นที่ 6 — ตั้งค่า LINE Official Account เพื่อรับแจ้งเตือน (ฟรี)

ใช้เวลาราว 15 นาที · ลุงทำเองทั้งหมด เพราะต้องล็อกอิน LINE และมีรหัสลับ (Channel access token)

## 1. สร้าง LINE Official Account
1. เข้า https://manager.line.biz → ล็อกอินด้วยบัญชี LINE ของลุง
2. กด **สร้างบัญชี LINE Official Account** (Create a LINE Official Account)
3. กรอก
   - ชื่อบัญชี: `WaterWest แม่กลอง` (หรือชื่อที่ต้องการ — คนที่เพิ่มเพื่อนจะเห็นชื่อนี้)
   - หมวดหมู่: บริการสาธารณะ / ข่าวสาร (เลือกที่ใกล้เคียง)
4. สร้างเสร็จจะได้ **LINE ID** รูปแบบ `@123abcde` — จดไว้ (ไม่ใช่ความลับ)

## 2. เปิดใช้ Messaging API
1. ใน LINE OA Manager → **ตั้งค่า** (Settings) → **Messaging API**
2. กด **ใช้ Messaging API** (Enable Messaging API)
3. สร้าง Provider ใหม่ ชื่อ `WaterWest` → ตกลง

## 3. ออก Channel access token (รหัสลับ)
1. เข้า https://developers.line.biz/console/ → เลือก Provider `WaterWest` → เลือกช่องของ OA
2. แท็บ **Messaging API** → เลื่อนลงล่างสุด **Channel access token (long-lived)** → กด **Issue**
3. กดคัดลอก ⚠️ **ห้ามวางในแชท/ส่งให้ใคร**

## 4. เพิ่มเพื่อนก่อน (สำคัญ — ทำก่อนข้อ 5)
- ใน LINE OA Manager หน้าแรก มี QR / ลิงก์เพิ่มเพื่อน → สแกนด้วยมือถือของลุง
- ส่ง QR ให้ครอบครัว/เพื่อนบ้านที่อยากรับแจ้งเตือนด้วย
- (แนะนำ) ตั้งค่า → **การตอบกลับ** → ปิด "ข้อความตอบกลับอัตโนมัติ" เพื่อไม่ให้ OA ตอบข้อความทั่วไปเอง

## 5. ใส่รหัสลับใน Supabase
1. เข้า https://supabase.com/dashboard/project/jvwxhxrtckfvflzrrsxe/functions/secrets
2. **Add new secret**
   - Name: `LINE_CHANNEL_ACCESS_TOKEN`
   - Value: วาง token จากข้อ 3
3. กด **Save**

## 6. บอกผม
พิมพ์ **"ตั้ง LINE เสร็จแล้ว @xxxxxx"** (ใส่ LINE ID จากข้อ 1) — ผมจะ
- สั่งรันรอบถัดไปให้ส่งแจ้งเตือนที่ค้างอยู่ (เขื่อนวชิราลงกรณ 99%) → ลุงควรได้ข้อความใน LINE
- ใส่ปุ่ม/QR เพิ่มเพื่อนในหน้า "เตือนภัย" ของเว็บ

## หมายเหตุ
- LINE OA แพ็กเกจฟรีส่งข้อความได้จำนวนจำกัดต่อเดือน และนับตามจำนวนผู้รับ (1 ข้อความ × 5 คน = 5) — ดูยอดที่ใช้ได้ใน LINE OA Manager
- ระบบส่งเฉพาะเมื่อมีเหตุใหม่/รุนแรงขึ้น/คลี่คลาย และรวมเป็นข้อความเดียวต่อรอบ จึงใช้โควตาน้อย
- ถ้า token หลุด: กลับไปข้อ 3 กด Reissue แล้วใส่ค่าใหม่ในข้อ 5
