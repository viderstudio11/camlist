// node scripts/make-icons.js — writes icons/icon.svg and PNGs (180/192/512) with zero dependencies.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };

function png(size, draw) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      // 2x2 supersampling for smoother edges
      let r = 0, g = 0, b = 0, a = 0;
      for (const [dx, dy] of [[.25, .25], [.75, .25], [.25, .75], [.75, .75]]) {
        const [pr, pg, pb, pa] = draw((x + dx) / size, (y + dy) / size);
        r += pr * pa; g += pg * pa; b += pb * pa; a += pa;
      }
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = a ? Math.round(r / a) : 0; raw[o + 1] = a ? Math.round(g / a) : 0; raw[o + 2] = a ? Math.round(b / a) : 0; raw[o + 3] = Math.round(a / 4);
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const inRounded = (u, v, r, x0 = 0, y0 = 0, x1 = 1, y1 = 1) => {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hw = (x1 - x0) / 2 - r, hh = (y1 - y0) / 2 - r;
  const x = Math.abs(u - cx), y = Math.abs(v - cy);
  if (x <= hw + r && y <= hh) return true; if (x <= hw && y <= hh + r) return true;
  return Math.hypot(x - hw, y - hh) <= r;
};
const inCircle = (u, v, cx, cy, r) => Math.hypot(u - cx, v - cy) <= r;

// Dark rounded tile, white camera body, red lens ring with dark pupil, red record dot.
function draw(u, v) {
  if (!inRounded(u, v, .22)) return [0, 0, 0, 0];
  if (inCircle(u, v, .58, .54, .07)) return [13, 14, 16, 255];
  if (inCircle(u, v, .58, .54, .14)) return [224, 38, 43, 255];
  if (inCircle(u, v, .27, .45, .035)) return [224, 38, 43, 255];
  if (inRounded(u, v, .03, .16, .34, .84, .74) || inRounded(u, v, .02, .30, .26, .50, .36)) return [242, 242, 242, 255];
  return [13, 14, 16, 255];
}

mkdirSync('icons', { recursive: true });
for (const s of [180, 192, 512]) writeFileSync(`icons/icon-${s}.png`, png(s, draw));
writeFileSync('icons/icon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#0d0e10"/><rect x="30" y="26" width="20" height="10" rx="2" fill="#f2f2f2"/><rect x="16" y="34" width="68" height="40" rx="6" fill="#f2f2f2"/><circle cx="58" cy="54" r="14" fill="#e0262b"/><circle cx="58" cy="54" r="7" fill="#0d0e10"/><circle cx="27" cy="45" r="3.5" fill="#e0262b"/></svg>`);
console.log('icons written');
