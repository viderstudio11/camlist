// "Build around a camera": camera profiles + rules that grade every catalog product against the active camera.
// Verdicts: native | adapter | partial | no | unknown (lens/media/battery we couldn't identify) | neutral (not subject to rules).
import { normalize } from './catalog.js';

const MOUNT_ALIASES = {
  'e': 'E', 'e-mount': 'E', 'e mount': 'E', 'sony e': 'E', 'sony e-mount': 'E', 'sony e mount': 'E', 'fe': 'E',
  'pl': 'PL', 'pl-mount': 'PL', 'pl mount': 'PL', 'arri pl': 'PL', 'lpl': 'LPL', 'lpl mount': 'LPL', 'lpl-mount': 'LPL',
  'ef': 'EF', 'ef mount': 'EF', 'ef-mount': 'EF', 'canon ef': 'EF', 'ef-s': 'EF', 'rf': 'RF', 'canon rf': 'RF', 'rf mount': 'RF',
  'l': 'L', 'l-mount': 'L', 'l mount': 'L', 'leica l': 'L', 'mft': 'MFT', 'm4/3': 'MFT', 'm43': 'MFT', 'micro four thirds': 'MFT', 'micro 4/3': 'MFT',
  'b4': 'B4', 'b4 2': 'B4', '2 3': 'B4', 'm': 'M', 'm-mount': 'M', 'leica m': 'M', 'g': 'G', 'gfx': 'G', 'g-mount': 'G', 'g mount': 'G',
  'f': 'F', 'nikon f': 'F', 'z': 'Z', 'nikon z': 'Z', 'x': 'X', 'fuji x': 'X', 'x-mount': 'X', 'dl': 'DL', 'dl-mount': 'DL',
};
const MOUNT_NAME_RX = [
  ['LPL', /\blpl\b/i], ['PL', /\bpl\b(?!\s*\/?\s*e)|pl-mount|pl mount/i], ['EF', /\bef\b|ef-mount|ef mount/i], ['RF', /\brf\b(?!\s*(tx|rx|venue))/i],
  ['E', /\be-?mount\b|\bsony e\b|\bfe\b(?=\s*\d)|\(e\)|\be\/|\/e\b/i], ['L', /\bl-?mount\b|\bleica l\b/i], ['MFT', /\bmft\b|micro four thirds|\bm4\/3\b|\bm43\b/i],
  ['B4', /\bb4\b|2\/3/i], ['G', /\bg-?mount\b|\bgfx\b/i], ['M', /\bm-?mount\b|\bleica m\b/i], ['DL', /\bdl-?mount\b/i], ['F', /\bnikon f\b|\bf-?mount\b/i], ['Z', /\bnikon z\b|\bz-?mount\b/i],
];
const SUBCAT_MOUNT = { 'PL-Mount': 'PL', 'HDSLR E-Mount': 'E', 'HDSLR EF-Mount': 'EF', 'Broadcast / ENG B4-Mount': 'B4', 'MFT M4/3': 'MFT', 'L-Mount': 'L', 'G-Mount': 'G', 'M-Mount': 'M' };
const SUBCAT_FORMAT = { 'Full Frame': 'FF', '35mm Prime': 'S35', '35mm Zoom': 'S35', 'Broadcast / ENG B4-Mount': '2/3', '16mm': '16', 'MFT M4/3': 'MFT', 'G-Mount': 'MF', 'Medium Format': 'MF' };

export const MEDIA = {
  'CFexpress A': /cfexpress[\s\d.]*(type\s*)?-?a\b/i, 'CFexpress B': /cfexpress[\s\d.]*(type\s*)?-?b\b/i, 'microSD': /micro\s*-?sd/i,
  'SD': /(^|[^a-z])(sd|sdxc|sdhc)([^a-z]|$)/i, 'CFast': /cfast/i, 'XQD': /xqd/i, 'SxS': /sxs/i, 'AXS': /\baxs\b/i, 'Codex': /codex|compact drive/i,
  'RED MINI-MAG': /mini-?mag/i, 'P2': /\bp2\b/i, 'CF': /(^|[^a-z])cf([^a-z]|$)|compact\s*flash/i, 'SSD': /\bssd\b|\bt7\b|\bt5\b/i, 'ProSSD': /pro-?ssd/i,
  'CineMag': /cinemag/i, 'XDCAM': /xdcam|professional disc/i,
};
export const BATTERY = {
  'BP-U': /bp-?u\s?\d*|\bu\d{2,3}\b/i, 'V-Mount': /v-?mount|v-?lock|\bbp-?\d{2,3}s\b|\bv\d{2,3}\b/i, 'Gold': /gold|anton|\bab-?mount|\bg\d{2,3}\b/i, 'B-Mount': /\bb-?mount/i,
  'NP-F': /np-?f\d{3}/i, 'NP-FV': /np-?fv/i, 'NP-FZ100': /np-?fz|fz-?100/i, 'NP-FW50': /fw-?50/i, 'LP-E6': /lp-?e6/i, 'BP-A': /bp-?a\d{2}/i, 'BP-9': /bp-?9\d{2}/i,
  'VBR': /\bvbr|\bvbd|ag-?vb|vw-?vb/i, 'DMW-BLF19': /blf-?19/i, 'DMW-BLK22': /blk-?22/i, 'DMW-BLJ31': /blj-?31/i, 'NP-W235': /w-?235/i, 'TB50': /tb-?50/i, 'BP-FL': /bp-?fl/i,
};

export function parseMounts(text) {
  const out = new Set();
  for (const part of String(text || '').split(/[,;&+/]|\band\b|\bor\b/i)) {
    const key = normalize(part).replace(/ mount$/, '').trim();
    if (MOUNT_ALIASES[key]) out.add(MOUNT_ALIASES[key]);
  }
  return out;
}
export function mountsInName(name) {
  const out = new Set();
  for (const [m, rx] of MOUNT_NAME_RX) if (rx.test(name || '')) out.add(m);
  return out;
}

export function createCompat(data, catalog) {
  const deptKey = (p) => catalog.deptKey(p.dept);
  const subNames = (p) => p.subcats.map(id => catalog.departments.flatMap(d => d.subcategories).find(s => s.id === id)?.en).filter(Boolean);
  const profiles = data.cameras || [];
  const adapters = data.adapters || {};

  function profileFor(product) {
    if (!product) return null;
    let prof = profiles.find(c => c.id === product.id);
    if (!prof) prof = profiles.find(c => c.match && new RegExp(c.match, 'i').test(product.name));
    if (!prof) return null;
    const usable = new Set([...(prof.mount || []).flatMap(m => adapters[m] || []), ...(prof.adapters || [])]);
    for (const m of prof.mount || []) usable.delete(m);
    return { ...prof, product, adapterMounts: [...usable], kit: data.kits?.[prof.type] || [] };
  }
  const isCamera = (p) => deptKey(p) === 'cameras';

  function lensInfo(p) {
    const subs = subNames(p);
    const mounts = new Set();
    for (const key of ['Mount', 'Lens Mount']) for (const m of parseMounts((p.attrs?.[key] || []).join(', '))) mounts.add(m);
    for (const s of subs) if (SUBCAT_MOUNT[s]) mounts.add(SUBCAT_MOUNT[s]);
    if (!mounts.size) for (const m of mountsInName(p.name)) mounts.add(m);
    let format = null;
    for (const s of subs) if (SUBCAT_FORMAT[s]) { format = format === 'FF' ? 'FF' : SUBCAT_FORMAT[s]; }
    const cov = (p.attrs?.['Sensor Coverage / Format Compatibility'] || []).join(' ');
    if (/full ?frame/i.test(cov)) format = 'FF'; else if (/super ?35|s35/i.test(cov) && !format) format = 'S35';
    if (!format && /\bff\b|full[- ]?frame|vista/i.test(p.name)) format = 'FF';
    if (!format && /\bs35\b|super ?35/i.test(p.name)) format = 'S35';
    return { mounts, format, isAdapter: subs.includes('Lens Adapters'), isSet: subs.includes('Lens Sets') };
  }

  const familiesIn = (table, name) => Object.entries(table).filter(([, rx]) => rx.test(name)).map(([k]) => k);

  // Returns { status, reason } for a product against a camera profile.
  function verdict(product, prof) {
    if (!prof || !product || product.manual) return { status: 'neutral' };
    const dept = deptKey(product);
    const subs = subNames(product);
    const camFmt = prof.format;
    if (dept === 'lenses') {
      const info = lensInfo(product);
      if (info.isAdapter) {
        const targets = mountsInName(product.name);
        if (!targets.size) return { status: 'unknown' };
        return prof.mount.some(m => targets.has(m)) ? { status: 'native', reason: 'adapter-for-camera' } : { status: 'no', reason: 'adapter-other-camera' };
      }
      if (!info.mounts.size) return { status: 'unknown' };
      const native = prof.mount.some(m => info.mounts.has(m));
      const viaAdapter = !native && prof.adapterMounts.some(m => info.mounts.has(m));
      if (!native && !viaAdapter) return { status: 'no', reason: 'mount' };
      // sensor coverage
      let partial = false;
      if (info.format) {
        const rank = { '16': 0, 'MFT': 1, '2/3': 1, 'S35': 2, 'FF': 3, 'MF': 4 };
        if (camFmt in rank && info.format in rank && rank[info.format] < rank[camFmt]) partial = true;
      }
      if (partial) return { status: 'partial', reason: 'coverage', via: viaAdapter ? 'adapter' : 'native' };
      return viaAdapter ? { status: 'adapter', reason: 'mount' } : { status: 'native' };
    }
    if (dept === 'video' && subs.includes('Recorders & Media')) {
      const fams = familiesIn(MEDIA, product.name);
      if (!fams.length) return { status: 'neutral' }; // recorders, readers, drives
      // "SD" also matches microSD names — prefer the most specific family present
      const specific = fams.includes('microSD') ? fams.filter(f => f !== 'SD') : fams;
      return specific.some(f => (prof.media || []).includes(f)) ? { status: 'native', reason: 'media' } : { status: 'no', reason: 'media' };
    }
    if (dept === 'power' && (subs.includes('Batteries') || subs.includes('Chargers & PSU'))) {
      const fams = familiesIn(BATTERY, product.name);
      if (!fams.length) return { status: subs.includes('Batteries') ? 'unknown' : 'neutral' };
      return fams.some(f => (prof.battery || []).includes(f)) ? { status: 'native', reason: 'battery' } : { status: 'no', reason: 'battery' };
    }
    return { status: 'neutral' };
  }

  // Kit slot progress against the project's items: how many units of matching products are already in the list.
  function kitStatus(prof, items, resolve) {
    return (prof?.kit || []).map(slot => {
      const deptId = catalog.departments.find(d => d.slug === slot.dept)?.id;
      const subId = slot.subcat ? catalog.departments.flatMap(d => d.subcategories).find(s => s.en === slot.subcat)?.id : null;
      const have = items.reduce((n, it) => { const p = resolve(it.productId) || { dept: it.snapshot?.dept, subcats: [] }; return p.dept === deptId && (!subId || (p.subcats || []).includes(subId)) ? n + it.qty : n; }, 0);
      return { ...slot, deptId, subId, have, done: have >= slot.qty };
    });
  }

  return { profileFor, isCamera, lensInfo, verdict, kitStatus, profiles };
}

export async function loadCompat(url = 'data/compat.json') {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`compat ${res.status}`);
  return res.json();
}
