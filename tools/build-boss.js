#!/usr/bin/env node
/* สแกนโฟลเดอร์รูปบอส แล้วสร้าง boss.json (แคตตาล็อกรวม จัดกลุ่มตามเลเวลในเว็บ)
   โครงสร้างโฟลเดอร์:
     boss/mini/ชื่อบอส_เลเวล.png     -> ประเภท mini
     boss/elite/ชื่อบอส_เลเวล.png    -> ประเภท elite
   กติกาชื่อไฟล์:  ชื่อบอส_เลเวล.png   เช่น  eddga_25.png , orc_hero_30.png
   - ตัวเลขท้ายสุด = เลเวลของบอส
   - ที่เหลือ = ชื่อบอส (ขีดล่างเป็นช่องว่าง, คำพิมพ์ใหญ่ทั้งคำคงไว้ เช่น MVP)
   รัน:  node tools/build-boss.js
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'boss.json');
const IMG_RE = /\.(png|jpe?g|webp|gif)$/i;
const NAME_RE = /^(.+)_(\d+)$/;

function titleCase(s) {
  // แยกคำ camelCase: "AncientMummy" -> "Ancient Mummy", "MVPBoss" -> "MVP Boss"
  s = s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
  return s.split(/[_\s]+/).filter(Boolean)
    .map(w => (w.length >= 2 && w === w.toUpperCase() && /[A-Z]/.test(w)) ? w
      : w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function scan(type) {
  const dir = path.join(ROOT, 'boss', type);
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (e) { return []; }
  const out = [];
  for (const e of entries) {
    if (!e.isFile() || !IMG_RE.test(e.name)) continue;
    const base = e.name.replace(IMG_RE, '');
    const m = base.match(NAME_RE);
    if (!m) continue;
    out.push({
      key: type + '_' + base,
      name: titleCase(m[1]),
      lv: parseInt(m[2], 10),
      type: type,
      file: 'boss/' + type + '/' + e.name
    });
  }
  out.sort((a, b) => (a.lv - b.lv) || a.name.localeCompare(b.name));
  return out;
}

const result = { mini: scan('mini'), elite: scan('elite') };
const json = JSON.stringify(result, null, 2) + '\n';
const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
if (prev === json) console.log('boss.json ไม่มีอะไรเปลี่ยน');
else { fs.writeFileSync(OUT, json); console.log('เขียน boss.json แล้ว'); }
console.log(`พบบอส Mini ${result.mini.length} ตัว, Elite ${result.elite.length} ตัว`);
