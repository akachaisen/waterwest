// ขั้นที่ 1–2: ดึงข้อมูลทุกแหล่ง → บันทึก data/latest.json + data/latest.md → บันทึกลงฐานข้อมูล (ถ้าตั้งค่าไว้)
// รัน: npm run snapshot   (เพิ่ม --quiet เพื่อไม่พิมพ์ตาราง)

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collect, renderMarkdown } from './core.mjs';
import { store } from './store.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  const snapshot = await collect();

  const dataDir = join(ROOT, 'data');
  const histDir = join(dataDir, 'history');
  await mkdir(histDir, { recursive: true });
  const stamp = snapshot.generated_at.replace(/[:.]/g, '-').slice(0, 16);
  await writeFile(join(dataDir, 'latest.json'), JSON.stringify(snapshot, null, 2));
  await writeFile(join(histDir, `snapshot-${stamp}.json`), JSON.stringify(snapshot));
  const md = renderMarkdown(snapshot);
  await writeFile(join(dataDir, 'latest.md'), md);
  if (!process.argv.includes('--quiet')) console.log(md);

  const saved = await store(snapshot);
  console.log(saved.skipped ? `ฐานข้อมูล: ข้าม (${saved.reason})` : `ฐานข้อมูล: บันทึกแล้ว ${JSON.stringify(saved)}`);
  const all = Object.entries(snapshot.sources);
  const failed = all.filter(([, v]) => v !== 'ok');
  console.log(`แหล่งข้อมูล: ${all.length - failed.length}/${all.length} สำเร็จ${failed.length ? ' · ล้มเหลว: ' + failed.map(([k]) => k).join(', ') : ''}`);
  // ล้มเหลวทั้งหมด = ให้ job แจ้ง error (แหล่งเดียวล่มไม่ถือว่าล้มเหลว)
  if (failed.length === all.length) process.exit(2);
}

main().catch((e) => {
  console.error('snapshot ล้มเหลว:', e);
  process.exit(1);
});
