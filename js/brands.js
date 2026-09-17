export const slugify = (name = '') => name.toLowerCase().trim()
  .replace(/['’]/g, '').replace(/[^a-z0-9֐-׿]+/g, '-').replace(/^-+|-+$/g, '');

// Typographic wordmarks (generic fonts, brand-ish colors). text/weight/spacing/style/fg/bg
export const BUILTIN = {
  arri: { text: 'ARRI', weight: 900, spacing: 0.12, fg: '#ffffff', bg: '#1f4fd8' },
  sony: { text: 'SONY', weight: 800, spacing: 0.02, fg: '#ffffff', bg: '#000000', serif: true },
  canon: { text: 'Canon', weight: 800, spacing: -0.02, fg: '#ffffff', bg: '#cc0000', italic: true },
  red: { text: 'RED', weight: 900, spacing: 0.05, fg: '#e0262b', bg: '#111111' },
  nikon: { text: 'Nikon', weight: 800, spacing: 0, fg: '#111111', bg: '#f7d117' },
  'blackmagic-design': { text: 'Blackmagic', weight: 700, spacing: 0, fg: '#ffffff', bg: '#2b2b2b' },
  blackmagic: { text: 'Blackmagic', weight: 700, spacing: 0, fg: '#ffffff', bg: '#2b2b2b' },
  panasonic: { text: 'Panasonic', weight: 800, spacing: 0, fg: '#ffffff', bg: '#0b3d91' },
  dji: { text: 'DJI', weight: 900, spacing: 0.1, fg: '#ffffff', bg: '#000000' },
  gopro: { text: 'GoPro', weight: 900, spacing: 0, fg: '#111111', bg: '#00a3e0' },
  insta360: { text: 'Insta360', weight: 800, spacing: 0, fg: '#111111', bg: '#ffb800' },
  zeiss: { text: 'ZEISS', weight: 800, spacing: 0.15, fg: '#ffffff', bg: '#0060a8' },
  cooke: { text: 'Cooke', weight: 700, spacing: 0.02, fg: '#ffffff', bg: '#6b1e1e', serif: true },
  angenieux: { text: 'Angénieux', weight: 700, spacing: 0, fg: '#ffffff', bg: '#7a0c1a', serif: true },
  fujinon: { text: 'FUJINON', weight: 800, spacing: 0.06, fg: '#ffffff', bg: '#008a3e' },
  fujifilm: { text: 'FUJIFILM', weight: 800, spacing: 0.06, fg: '#ffffff', bg: '#008a3e' },
  sigma: { text: 'SIGMA', weight: 800, spacing: 0.1, fg: '#ffffff', bg: '#111111' },
  leica: { text: 'Leica', weight: 800, spacing: 0.02, fg: '#ffffff', bg: '#e20612' },
  laowa: { text: 'LAOWA', weight: 800, spacing: 0.1, fg: '#ffffff', bg: '#222222' },
  teradek: { text: 'teradek', weight: 800, spacing: 0.02, fg: '#ffffff', bg: '#0a84ff' },
  smallhd: { text: 'SmallHD', weight: 800, spacing: 0, fg: '#ffffff', bg: '#f26522' },
  atomos: { text: 'ATOMOS', weight: 800, spacing: 0.08, fg: '#111111', bg: '#f5f5f5' },
  tilta: { text: 'TILTA', weight: 900, spacing: 0.12, fg: '#ffffff', bg: '#c8102e' },
  smallrig: { text: 'SmallRig', weight: 800, spacing: 0, fg: '#111111', bg: '#f5f5f5' },
  sachtler: { text: 'sachtler', weight: 700, spacing: 0.02, fg: '#ffffff', bg: '#004b87' },
  oconnor: { text: 'OConnor', weight: 800, spacing: 0.02, fg: '#ffffff', bg: '#005eb8' },
  vinten: { text: 'Vinten', weight: 800, spacing: 0.02, fg: '#ffffff', bg: '#5b2a86' },
  'wooden-camera': { text: 'WOODEN', weight: 900, spacing: 0.1, fg: '#111111', bg: '#f2c14e' },
  'bright-tangerine': { text: 'Bright T.', weight: 800, spacing: 0, fg: '#111111', bg: '#ff7f11' },
  easyrig: { text: 'easyrig', weight: 800, spacing: 0.02, fg: '#ffffff', bg: '#d6001c' },
  freefly: { text: 'FREEFLY', weight: 800, spacing: 0.1, fg: '#ffffff', bg: '#0d0d0d' },
  tiffen: { text: 'Tiffen', weight: 800, spacing: 0.02, fg: '#ffffff', bg: '#004b8d' },
  hollyland: { text: 'Hollyland', weight: 800, spacing: 0, fg: '#ffffff', bg: '#1b1b1b' },
  aputure: { text: 'aputure', weight: 800, spacing: 0.02, fg: '#ffffff', bg: '#2a2a2a' },
  manfrotto: { text: 'Manfrotto', weight: 800, spacing: 0, fg: '#ffffff', bg: '#d0021b' },
  cartoni: { text: 'Cartoni', weight: 800, spacing: 0.02, fg: '#ffffff', bg: '#c00000' },
  dzofilm: { text: 'DZOFILM', weight: 800, spacing: 0.08, fg: '#ffffff', bg: '#000000' },
  sirui: { text: 'SIRUI', weight: 800, spacing: 0.1, fg: '#ffffff', bg: '#004aad' },
  portkeys: { text: 'PORTKEYS', weight: 800, spacing: 0.06, fg: '#ffffff', bg: '#0b0b0b' },
  shape: { text: 'SHAPE', weight: 900, spacing: 0.12, fg: '#ffffff', bg: '#1b1b1b' },
  matthews: { text: 'MATTHEWS', weight: 900, spacing: 0.06, fg: '#111111', bg: '#f5f5f5' },
  avenger: { text: 'AVENGER', weight: 900, spacing: 0.08, fg: '#ffffff', bg: '#111111' },
  samyang: { text: 'SAMYANG', weight: 800, spacing: 0.06, fg: '#ffffff', bg: '#c00000' },
  fxlion: { text: 'FXLION', weight: 900, spacing: 0.08, fg: '#ffffff', bg: '#e05a00' },
  'ronford-baker': { text: 'Ronford', weight: 800, spacing: 0.02, fg: '#ffffff', bg: '#2f3b52' },
  utopia: { text: 'UTOPIA', weight: 900, spacing: 0.14, fg: '#ffffff', bg: '#e0262b' },
  'core-swx': { text: 'CORE', weight: 900, spacing: 0.1, fg: '#ffffff', bg: '#0a5bd3' },
  'anton-bauer': { text: 'Anton/Bauer', weight: 800, spacing: 0, fg: '#ffffff', bg: '#005a9c' },
  nanlite: { text: 'NANLITE', weight: 800, spacing: 0.08, fg: '#ffffff', bg: '#00a0e9' },
  godox: { text: 'Godox', weight: 800, spacing: 0.02, fg: '#ffffff', bg: '#ff6b00' },
  nisi: { text: 'NiSi', weight: 800, spacing: 0.04, fg: '#ffffff', bg: '#3b3b3b' },
  tokina: { text: 'Tokina', weight: 800, spacing: 0.02, fg: '#ffffff', bg: '#1a3a7a' },
  tamron: { text: 'TAMRON', weight: 800, spacing: 0.06, fg: '#ffffff', bg: '#1b1b1b' },
};

const hash = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h; };

export function monogram(slug, name) {
  const words = String(name || slug || '?').replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean);
  const text = (words.length >= 2 ? words.slice(0, 3).map(w => w[0]).join('') : (words[0] || '?').slice(0, 2)).toUpperCase();
  return { text, hue: hash(slug || name || '') % 360 };
}

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let misses = null;
function loadMisses() {
  if (misses) return misses;
  misses = new Set();
  try {
    const raw = globalThis.localStorage?.getItem('camlist.logomiss');
    if (raw) { const { at, slugs } = JSON.parse(raw); if (Date.now() - at < 864e5) slugs.forEach(s => misses.add(s)); }
  } catch { /* ignore */ }
  return misses;
}
export function rememberMiss(slug) {
  loadMisses().add(slug);
  try { globalThis.localStorage?.setItem('camlist.logomiss', JSON.stringify({ at: Date.now(), slugs: [...misses] })); } catch { /* ignore */ }
}
export const hasMiss = (slug) => loadMisses().has(slug);

function builtinHTML(slug, name, size) {
  const b = BUILTIN[slug];
  const style = `--bg:${b.bg};--fg:${b.fg};--w:${b.weight};--ls:${b.spacing}em;${b.italic ? 'font-style:italic;' : ''}${b.serif ? 'font-family:Georgia,serif;' : ''}`;
  return `<span class="logo logo-${size} logo-mark" style="${style}" title="${esc(name || slug)}">${esc(b.text)}</span>`;
}
function monogramHTML(slug, name, size) {
  const m = monogram(slug, name);
  return `<span class="logo logo-${size} logo-mono" style="--hue:${m.hue}" title="${esc(name || slug)}">${esc(m.text)}</span>`;
}

export const fallbackHTML = (slug, name, size = 'row') => (BUILTIN[slug] ? builtinHTML(slug, name, size) : monogramHTML(slug, name, size));

export function logoHTML(slug, name, size = 'row') {
  if (!slug) return `<span class="logo logo-${size} logo-none" aria-hidden="true"></span>`;
  if (hasMiss(slug)) return fallbackHTML(slug, name, size);
  // Try user-supplied png → svg → fallback. The inline onerror survives innerHTML; app.js defines window.__logoMiss,
  // which calls rememberMiss(slug) and swaps the wrapper for logoHTML(slug, name, size) (now a fallback).
  return `<span class="logo logo-${size} logo-user" data-slug="${esc(slug)}" data-name="${esc(name || slug)}" data-size="${esc(size)}"><img src="logos/${esc(slug)}.png" alt="${esc(name || slug)}" loading="lazy" onerror="this.onerror=function(){window.__logoMiss&&window.__logoMiss(this)};this.src='logos/${esc(slug)}.svg'"></span>`;
}
