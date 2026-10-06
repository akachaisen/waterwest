// ทะเบียนสถานีตามเส้นทางน้ำ เรียงจากต้นน้ำไปปลายน้ำ
// src: 'swoc' = กรมชลฯ SWOC, 'tw' = ThaiWater (สสน.), 'ddpm' = ปภ. (cctv.disaster.go.th มีกล้อง) · egat = รหัสในตารางโทรมาตร กฟผ. (ใช้ดึงความจุลำน้ำ)
// cams = จำนวนกล้องของสถานี ปภ. (ภาพ: /api/webrtc/public-frame.jpeg?src=<code>-01)

export const SEGMENTS = [
  { id: 'A', name: 'แควน้อย ท้ายเขื่อนวชิราลงกรณ' },
  { id: 'B', name: 'แควใหญ่ ท้ายเขื่อนศรีนครินทร์/ท่าทุ่งนา' },
  { id: 'C', name: 'จุดรวมแม่น้ำ จ.กาญจนบุรี' },
  { id: 'D', name: 'เขื่อนแม่กลอง (ท่าม่วง)' },
  { id: 'E', name: 'ท้ายเขื่อนแม่กลอง – บ้านโป่ง – โพธาราม – ราชบุรี' },
  { id: 'F', name: 'สมุทรสงคราม – ปากอ่าวไทย' },
];

export const STATIONS = [
  { code: 'MKVKD01', src: 'tw', egat: 'VKD01', seg: 'A', name: 'อ.ทองผาภูมิ' },
  { code: 'MKVKD02', src: 'tw', egat: 'VKD02', seg: 'A', name: 'บ้านหินดาด' },
  { code: 'K.54', src: 'swoc', egat: 'VKD03', seg: 'A', name: 'บ้านลิ่นถิ่น ทองผาภูมิ' },
  { code: 'KRI01', src: 'ddpm', seg: 'A', name: 'สะพานบ้านแม่น้ำน้อย ไทรโยค', cams: 2 },
  { code: 'K.58', src: 'swoc', egat: 'VKD04', seg: 'A', name: 'บ้านปากแซง ไทรโยค' },
  { code: 'KRI02', src: 'ddpm', seg: 'A', name: 'สะพานปากแกแซง ไทรโยค', cams: 2 },
  { code: 'K.10', src: 'swoc', egat: 'VKD05', seg: 'A', name: 'บ้านลุ่มสุ่ม ไทรโยค' },
  { code: 'KRI03', src: 'ddpm', seg: 'A', name: 'สะพานวังโพ ไทรโยค', cams: 2 },
  { code: 'K.37', src: 'swoc', egat: 'VKD06', seg: 'A', name: 'บ้านวังเย็น ด่านมะขามเตี้ย', key: true },
  { code: 'KRI04', src: 'ddpm', seg: 'A', name: 'สะพานวัดหินแท่น ลำภาชี ด่านมะขามเตี้ย', cams: 2 },
  { code: 'KRI05', src: 'ddpm', seg: 'A', name: 'สะพานหนองหญ้า เมืองกาญจนบุรี', cams: 2 },
  { code: 'KRI09', src: 'ddpm', seg: 'B', name: 'สะพาน ยธ. หนองปรือ (ลำตะเพิน)', cams: 2 },
  { code: 'KRI06', src: 'ddpm', seg: 'B', name: 'สะพานบ้านช่องสะเดา', cams: 2 },
  { code: 'KRI07', src: 'ddpm', seg: 'B', name: 'ลาดหญ้า (สะพานหลวงพ่อลำใย)', cams: 2 },
  { code: 'K.35A', src: 'swoc', egat: 'SND02', seg: 'B', name: 'บ้านหนองบัว เมืองกาญจนบุรี', key: true },
  { code: 'K.12', src: 'swoc', egat: 'SND06', seg: 'B', name: 'บ้านทุ่งนานางหรอก (ลำตะเพิน)' },
  { code: 'K.3A', src: 'swoc', seg: 'C', name: 'หน้าศาลากลาง จ.กาญจนบุรี' },
  { code: 'MKSND03', src: 'tw', egat: 'SND03', seg: 'C', name: 'วัดไชยชุมพลชนะสงคราม (วัดใต้)' },
  { code: 'K.11A', src: 'swoc', seg: 'E', name: 'บ้านวังขนาย ท่าม่วง' },
  { code: 'KRI08', src: 'ddpm', seg: 'E', name: 'สวนสาธารณะ ร.10 ท่าม่วง', cams: 2 },
  { code: 'K.55A', src: 'swoc', seg: 'E', name: 'สะพานค่ายหลวง บ้านโป่ง', key: true },
  { code: 'RAJ002', src: 'tw', seg: 'E', name: 'บ้านโป่ง' },
  { code: 'K.56A', src: 'swoc', seg: 'E', name: 'สะพานบ้านหม้อ-สร้อยฟ้า โพธาราม' },
  { code: 'RAJ001', src: 'tw', seg: 'E', name: 'โพธาราม' },
  { code: 'K.2B', src: 'swoc', seg: 'E', name: 'สะพานธนะรัชต์ ตัวเมืองราชบุรี', key: true },
  { code: 'K.57', src: 'swoc', seg: 'F', name: 'บ้านกระดังงา บางคนที' },
  { code: 'TK.72', src: 'swoc', seg: 'F', name: 'วัดบางคนฑีใน' },
  { code: 'TK.74', src: 'swoc', seg: 'F', name: 'โรงเรียนบ้านลาดใหญ่ เมืองสมุทรสงคราม' },
  { code: 'MKG006', src: 'tw', seg: 'F', name: 'พระรามสอง สมุทรสงคราม' },
  { code: 'PTT002', src: 'swoc', seg: 'F', name: 'สะพานข้ามคลองโคน' },
];

// เขื่อน (ข้อมูลจาก API อ่างเก็บน้ำ กรมชลฯ)
export const DAMS = [
  { id: '200402', twId: 15, name: 'เขื่อนวชิราลงกรณ', short: 'VRK' },
  { id: '200401', twId: 14, name: 'เขื่อนศรีนครินทร์', short: 'SNR' },
];

// จุดพยากรณ์ฝน (Open-Meteo)
export const RAIN_POINTS = [
  { id: 'vrk', name: 'เหนืออ่างวชิราลงกรณ', lat: 14.95, lon: 98.55 },
  { id: 'snr', name: 'เหนืออ่างศรีนครินทร์', lat: 14.85, lon: 98.95 },
  { id: 'rbr', name: 'ตัวเมืองราชบุรี / เจดีย์หัก', lat: 13.536, lon: 99.80 },
];

export const SEA_POINT = { name: 'ปากแม่น้ำแม่กลอง', lat: 13.36, lon: 100.0 };

export const CCTV = [
  { id: 'vrk1', name: 'สันเขื่อนวชิราลงกรณ', url: 'https://vrkdam.egat.co.th/cctv/image1.php' },
  { id: 'vrk2', name: 'ท้ายน้ำโรงไฟฟ้า-แม่น้ำแควน้อย', url: 'https://vrkdam.egat.co.th/cctv/image2.php' },
];
