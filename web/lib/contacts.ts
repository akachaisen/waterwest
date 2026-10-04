// เบอร์ติดต่อ — ใส่เฉพาะเบอร์ที่ตรวจสอบจากแหล่งทางการแล้ว (ตรวจเมื่อ 4 ต.ค. 2569)

export type Contact = { name: string; tel: string; note?: string };

export const NATIONAL: Contact[] = [
  { name: "สายด่วน ปภ. (สาธารณภัย/น้ำท่วม)", tel: "1784", note: "24 ชม. · LINE @1784DDPM" },
  { name: "การแพทย์ฉุกเฉิน", tel: "1669" },
  { name: "เหตุด่วนเหตุร้าย", tel: "191" },
  { name: "สายด่วนกรมชลประทาน", tel: "1460" },
  { name: "เขื่อนวชิราลงกรณ (กฟผ.)", tel: "034-599077", note: "สอบถามการระบายน้ำ" },
];

// สำนักงาน ปภ. จังหวัด — จาก https://www.disaster.go.th/contact/province
// (หน้าดังกล่าวยังไม่มีกาญจนบุรีและสมุทรสาคร จึงให้ใช้สายด่วน 1784 ซึ่งประสานถึงทุกจังหวัด)
export const PROVINCE_DDPM: Record<string, Contact | null> = {
  ราชบุรี: { name: "ปภ.จังหวัดราชบุรี", tel: "032-332571", note: "0-3233-2571-3" },
  สมุทรสงคราม: { name: "ปภ.จังหวัดสมุทรสงคราม", tel: "034-715835" },
  กาญจนบุรี: null,
  สมุทรสาคร: null,
};

export const OFFICIAL_LINKS: { name: string; url: string; note: string }[] = [
  { name: "กรมป้องกันและบรรเทาสาธารณภัย (ปภ.)", url: "https://www.disaster.go.th/", note: "ประกาศภัย คำสั่งอพยพ" },
  { name: "กรมชลประทาน", url: "https://www.rid.go.th/", note: "ข่าวการระบายน้ำ" },
  { name: "อ่างเก็บน้ำขนาดใหญ่ (กรมชลประทาน)", url: "https://app.rid.go.th/reservoir/", note: "ข้อมูลเขื่อนรายวัน" },
  { name: "ระดับน้ำเทียบตลิ่ง (กรมชลประทาน)", url: "https://bigdata-swoc.rid.go.th/pier/all", note: "สถานีวัดน้ำทั่วประเทศ" },
  { name: "ระบบโทรมาตรลุ่มน้ำแม่กลอง (กฟผ.)", url: "https://water.egat.co.th/telemeter/schematic/index.php", note: "ผังน้ำ เขื่อน สถานี" },
  { name: "เขื่อนวชิราลงกรณ (กฟผ.)", url: "https://vrkdam.egat.co.th/index.php", note: "CCTV ประกาศของเขื่อน" },
  { name: "คลังข้อมูลน้ำแห่งชาติ (สสน.)", url: "https://www.thaiwater.net/", note: "ภาพรวมน้ำทั้งประเทศ" },
  { name: "กรมอุตุนิยมวิทยา", url: "https://www.tmd.go.th/", note: "พยากรณ์และประกาศเตือนภัยอากาศ" },
];
