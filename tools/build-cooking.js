#!/usr/bin/env node
/* สแกนโฟลเดอร์เมืองหารูปเมนูอาหาร แล้วสร้าง cooking.json
   กติกาชื่อไฟล์:  ชื่อเมนู_เลเวล.png   เช่น  steak_50.png , fried_rice_20.png , apple_0.png
   - ตัวเลขท้ายสุดคือเลเวลที่ต้องมี (0 = ไม่มีเงื่อนไข)
   - ที่เหลือคือชื่อเมนู (ขีดล่างจะกลายเป็นช่องว่าง)
   - วางรูปไว้ในโฟลเดอร์  <เมือง>/cooking/  เท่านั้น (แยกจาก cards)
   รัน:  node tools/build-cooking.js
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'cooking.json');
const IMG_RE = /\.(png|jpe?g|webp|gif)$/i;
const NAME_RE = /^(.+)_(\d+)$/;
const SKIP = /_full_map/i;

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
      if (e.name.toLowerCase() === 'cooking') {
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

  const cooks = [];
  scanDir(path.join(ROOT, e.name), e.name, cooks);
  if (!cooks.length) continue;

  cooks.sort((a, b) => (a.lv - b.lv) || a.name.localeCompare(b.name));
  result[e.name] = cooks;
}

const json = JSON.stringify(result, null, 2) + '\n';
const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
if (prev === json) {
  console.log('cooking.json ไม่มีอะไรเปลี่ยน');
} else {
  fs.writeFileSync(OUT, json);
  console.log('เขียน cooking.json แล้ว');
}

const total = Object.values(result).reduce((a, v) => a + v.length, 0);
console.log(`พบเมนูอาหาร ${total} อย่าง ใน ${Object.keys(result).length} โฟลเดอร์`);
for (const [k, v] of Object.entries(result)) console.log(`  ${k}: ${v.length}`);
