#!/usr/bin/env node
// Pulls Utopia's WooCommerce Store API into data/catalog.json (4 departments only).
// Usage: node scripts/fetch-catalog.js [--dry-run] [--limit N]
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const API = 'https://utopiacam.com/wp-json/wc/store/v1';
const DEPTS = [
  { he: 'מצלמות', slug: 'cameras', en: 'Cameras' },
  { he: 'עדשות', slug: 'lenses', en: 'Lenses' },
  { he: 'גריפ', slug: 'grip', en: 'Grip' },
  { he: 'אביזרים', slug: 'accessories', en: 'Accessories' },
];
// Virtual "Video" department carved out of Accessories: monitors, wireless video, recorders, converters/matrix.
// Matched by (decoded) subcategory name so it survives Utopia renumbering ids.
export const VIDEO_DEPT = { id: 900001, slug: 'video', he: 'וידאו', en: 'Video', order: 2.5 };
const VIDEO_SUBCATS = ['מוניטורים', 'וידאו אלחוטי', 'מקליטים וכרטיסים', 'Converters', 'Mixers & Matrix'];
const SUBCAT_EN = {
  'חצובות': 'Tripods & Heads', 'אביזרים כלליים': 'General Accessories', 'סוללות וספקים': 'Batteries & Power',
  'סוללות': 'Batteries', 'ספקים ומטענים': 'Chargers & PSU', 'מקליטים וכרטיסים': 'Recorders & Media',
  'מוניטורים': 'Monitors', 'ויופיינדרים': 'Viewfinders', 'וידאו אלחוטי': 'Wireless Video', 'מטבוקסים': 'Matte Boxes',
  'פולופוקוס': 'Follow Focus', 'פילטרים': 'Filters', 'תת ימי': 'Underwater', 'תת-ימי': 'Underwater',
  'סטים': 'Lens Sets', 'פולופוקוס אלחוטי': 'Wireless Follow Focus', 'פולופוקוס ידני': 'Manual Follow Focus', 'ראש שמן': 'Fluid Heads', 'רגלי חצובה': 'Tripod Legs', 'מתאמי עדשה': 'Lens Adapters', "עדשות וינטג'": 'Vintage Lenses', 'עדשות וינטג’': 'Vintage Lenses',
};
const BRAND_DISPLAY = {
  arri: 'ARRI', sony: 'Sony', canon: 'Canon', red: 'RED', 'blackmagic-design': 'Blackmagic Design', blackmagic: 'Blackmagic Design',
  panasonic: 'Panasonic', dji: 'DJI', gopro: 'GoPro', insta360: 'Insta360', zeiss: 'ZEISS', cooke: 'Cooke', angenieux: 'Angénieux',
  fujinon: 'Fujinon', fujifilm: 'Fujifilm', sigma: 'Sigma', leica: 'Leica', laowa: 'Laowa', teradek: 'Teradek', smallhd: 'SmallHD',
  atomos: 'Atomos', tilta: 'Tilta', smallrig: 'SmallRig', sachtler: 'Sachtler', oconnor: "O'Connor", 'wooden-camera': 'Wooden Camera',
  'bright-tangerine': 'Bright Tangerine', easyrig: 'Easyrig', freefly: 'Freefly', tiffen: 'Tiffen', hollyland: 'Hollyland',
  aputure: 'Aputure', nikon: 'Nikon', vinten: 'Vinten', cartoni: 'Cartoni', manfrotto: 'Manfrotto', 'preston-cinema': 'Preston',
  portkeys: 'Portkeys', shape: 'SHAPE', matthews: 'Matthews', samyang: 'Samyang', fxlion: 'FXLion', avenger: 'Avenger', 'ronford-baker': 'Ronford-Baker', utopia: 'Utopia', 'e-image': 'E-Image', kupo: 'Kupo', 'core-swx': 'Core SWX', 'anton-bauer': 'Anton/Bauer', ikan: 'ikan', nanlite: 'Nanlite', godox: 'Godox', dzofilm: 'DZOFILM', sirui: 'Sirui', nisi: 'NiSi', tokina: 'Tokina', tamron: 'Tamron',
};

export const decodeEntities = (s = '') => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .trim();

export const brandSlug = (name = '') => name.toLowerCase().trim()
  .replace(/['’]/g, '').replace(/[^a-z0-9֐-׿]+/g, '-').replace(/^-+|-+$/g, '');

const safeDecode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };

export function buildDeptIndex(categories) {
  const byId = new Map(categories.map(c => [c.id, { ...c, name: decodeEntities(c.name), dslug: safeDecode(c.slug) }]));
  const children = new Map();
  for (const c of byId.values()) {
    if (!children.has(c.parent)) children.set(c.parent, []);
    children.get(c.parent).push(c);
  }
  const departments = [];
  const descendants = new Map();
  DEPTS.forEach((d, order) => {
    const root = [...byId.values()].find(c => c.parent === 0 && (c.dslug === d.he || c.name === d.he));
    if (!root) return;
    const set = new Set([root.id]);
    const stack = [root.id];
    while (stack.length) {
      const id = stack.pop();
      for (const ch of children.get(id) || []) { if (!set.has(ch.id)) { set.add(ch.id); stack.push(ch.id); } }
    }
    descendants.set(root.id, set);
    const subcategories = [...set].filter(id => id !== root.id).map(id => byId.get(id)).map(c => ({
      id: c.id, parent: c.parent === root.id ? null : c.parent,
      he: c.name, en: SUBCAT_EN[c.name] || c.name, count: c.count,
    })).sort((a, b) => b.count - a.count);
    departments.push({ id: root.id, slug: d.slug, he: d.he, en: d.en, order: order + 1, subcategories });
  });
  carveVideo(departments, descendants, children, byId);
  return { departments, descendants, byId };
}

// Moves the VIDEO_SUBCATS subtrees (and their descendants) from Accessories into a virtual Video department.
function carveVideo(departments, descendants, children, byId) {
  const acc = departments.find(d => d.slug === 'accessories');
  if (!acc) return;
  const roots = acc.subcategories.filter(s => VIDEO_SUBCATS.includes(s.he) || VIDEO_SUBCATS.includes(s.en));
  if (!roots.length) return;
  const set = new Set();
  const stack = roots.map(r => r.id);
  while (stack.length) { const id = stack.pop(); if (set.has(id)) continue; set.add(id); for (const ch of children.get(id) || []) stack.push(ch.id); }
  const subcategories = acc.subcategories.filter(s => set.has(s.id)).map(s => ({ ...s, parent: roots.some(r => r.id === s.id) ? null : s.parent }));
  acc.subcategories = acc.subcategories.filter(s => !set.has(s.id));
  const accSet = descendants.get(acc.id);
  for (const id of set) accSet.delete(id);
  descendants.set(VIDEO_DEPT.id, new Set([VIDEO_DEPT.id, ...set]));
  departments.push({ ...VIDEO_DEPT, subcategories });
  departments.sort((a, b) => a.order - b.order);
  departments.forEach((d, i) => { d.order = i + 1; });
}

export function normalizeProduct(raw, idx) {
  const catIds = new Set((raw.categories || []).map(c => c.id));
  const dept = idx.departments.find(d => [...idx.descendants.get(d.id)].some(id => catIds.has(id)));
  if (!dept) return null;
  const subcats = [...idx.descendants.get(dept.id)].filter(id => id !== dept.id && catIds.has(id));
  const attr = (raw.attributes || []).find(a => a.name === 'מותג');
  const brandName = attr?.terms?.[0]?.name ? decodeEntities(attr.terms[0].name) : null;
  return {
    id: raw.id, name: decodeEntities(raw.name), brand: brandName ? brandSlug(brandName) : null,
    dept: dept.id, subcats, image: raw.images?.[0]?.thumbnail || null, url: raw.permalink || null, sku: raw.sku || '',
    _brandName: brandName,
  };
}

async function getJSON(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    const res = await fetch(url, { headers: { 'user-agent': 'camlist-fetch/1.0' } });
    if (res.ok) return { data: await res.json(), total: Number(res.headers.get('x-wp-totalpages') || 1) };
    if (i === tries || (res.status < 500 && res.status !== 429)) throw new Error(`${res.status} ${url}`);
    await new Promise(r => setTimeout(r, 1000 * i));
  }
}

async function getAll(path, limit) {
  const out = [];
  let page = 1, pages = 1;
  do {
    const { data, total } = await getJSON(`${API}/${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    out.push(...data); pages = total; page++;
    process.stdout.write(`\r${path.split('?')[0]}: page ${page - 1}/${pages}   `);
    await new Promise(r => setTimeout(r, 300));
  } while (page <= pages && (!limit || page <= limit));
  process.stdout.write('\n');
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry-run');
  const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : 0;
  const idx = buildDeptIndex(await getAll('products/categories'));
  if (idx.departments.length < DEPTS.length) throw new Error(`Found ${idx.departments.length}/4 departments`);
  const rawProducts = await getAll('products', limit);
  const brandNames = new Map();
  const products = [];
  for (const raw of rawProducts) {
    const p = normalizeProduct(raw, idx);
    if (!p) continue;
    if (p.brand) brandNames.set(p.brand, brandNames.get(p.brand) || p._brandName);
    delete p._brandName;
    products.push(p);
  }
  const order = new Map(idx.departments.map(d => [d.id, d.order]));
  products.sort((a, b) => order.get(a.dept) - order.get(b.dept) || (a.brand || '~').localeCompare(b.brand || '~') || a.name.localeCompare(b.name));
  const brands = [...brandNames].map(([id, first]) => ({ id, name: BRAND_DISPLAY[id] || first, count: products.filter(p => p.brand === id).length }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const catalog = { generatedAt: new Date().toISOString(), source: 'https://utopiacam.com', departments: idx.departments, brands, products };

  console.log('\nSummary:');
  for (const d of idx.departments) {
    const n = products.filter(p => p.dept === d.id).length;
    console.log(`  ${d.en.padEnd(12)} ${n}`);
    if (n === 0 && !limit) { console.error(`Department ${d.en} has 0 products — aborting`); process.exit(2); }
  }
  console.log(`  brands       ${brands.length}`);
  console.log(`  no brand     ${products.filter(p => !p.brand).length}`);
  console.log(`  no image     ${products.filter(p => !p.image).length}`);
  console.log(`  total        ${products.length}`);
  if (dry) { console.log('(dry run — not written)'); return; }
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  mkdirSync(join(root, 'data'), { recursive: true });
  writeFileSync(join(root, 'data', 'catalog.json'), JSON.stringify(catalog, null, 1));
  console.log('Wrote data/catalog.json');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(e => { console.error(e); process.exit(1); });
}
