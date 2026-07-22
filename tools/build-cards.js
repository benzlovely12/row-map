#!/usr/bin/env node
/* สแกนโฟลเดอร์เมืองหารูปการ์ด แล้วสร้าง cards.json
   กติกาชื่อไฟล์:  ชื่อการ์ด_เลเวล.png   เช่น  yoyo_40.png , thief_bug_20.png , fabre_0.png
   - ตัวเลขท้ายสุดคือเลเวลที่ต้องมี (0 = ไม่มีเงื่อนไข)
   - ที่เหลือคือชื่อการ์ด (ขีดล่างจะกลายเป็นช่องว่าง)
   - วางไว้ในโฟลเดอร์เมืองตรงๆ หรือใน <เมือง>/cards/ ก็ได้
   รัน:  node tools/build-cards.js
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'cards.json');
const IMG_RE = /\.(png|jpe?g|webp|gif)$/i;
const NAME_RE = /^(.+)_(\d+)$/;
const SKIP = /_full_map/i;

/* โฟลเดอร์เมือง = โฟลเดอร์ชั้นบนสุดที่ไม่ขึ้นต้นด้วยจุด และไม่ใช่โฟลเดอร์ระบบ */
const IGNORE = new Set(['tools', 'node_modules', '.git', '.github']);

function titleCase(s) {
  return s.split(/[_\s]+/).filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function scanDir(dir, relPrefix, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (e) { return; }

  for (const e of entries) {
    if (e.isDirectory()) {
      if (e.name.toLowerCase() === 'cards') {
        scanDir(path.join(dir, e.name), relPrefix + '/' + e.name, out);
      }
      continue;
    }
    if (!IMG_RE.test(e.name)) continue;
    if (SKIP.test(e.name)) continue;

    const base = e.name.replace(IMG_RE, '');
    const m = base.match(NAME_RE);
    if (!m) continue;

    out.push({
      key: base,
      name: titleCase(m[1]),
      lv: parseInt(m[2], 10),
      file: relPrefix + '/' + e.name
    });
  }
}

const result = {};
for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!e.isDirectory()) continue;
  if (e.name.startsWith('.') || IGNORE.has(e.name)) continue;

  const cards = [];
  scanDir(path.join(ROOT, e.name), e.name, cards);
  if (!cards.length) continue;

  cards.sort((a, b) => (a.lv - b.lv) || a.name.localeCompare(b.name));
  result[e.name] = cards;
}

const json = JSON.stringify(result, null, 2) + '\n';
const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
if (prev === json) {
  console.log('cards.json ไม่มีอะไรเปลี่ยน');
} else {
  fs.writeFileSync(OUT, json);
  console.log('เขียน cards.json แล้ว');
}

const total = Object.values(result).reduce((a, v) => a + v.length, 0);
console.log(`พบการ์ด ${total} ใบ ใน ${Object.keys(result).length} โฟลเดอร์`);
for (const [k, v] of Object.entries(result)) console.log(`  ${k}: ${v.length}`);
