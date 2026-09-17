#!/usr/bin/env node
// Downloads real brand logos into logos/ and (re)writes logos/index.json.
// Sources, in order: Wikipedia infobox logo → Wikimedia Commons file search → brand website header logo.
// Usage: node scripts/fetch-logos.js [--only slug,slug] [--index-only]
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'logos');
const UA = { 'user-agent': 'camlist-logos/1.0 (viderstudio@gmail.com)' };

// slug → { wiki: article title, commons: search phrase, site: homepage }
const SOURCES = {
  tiffen: { wiki: 'Tiffen', commons: 'Tiffen logo', site: 'https://tiffen.com' },
  sony: { wiki: 'Sony' },
  zeiss: { wiki: 'Carl Zeiss AG', commons: 'Zeiss logo' },
  utopia: { site: 'https://utopiacam.com' },
  arri: { wiki: 'Arri' },
  panasonic: { wiki: 'Panasonic' },
  canon: { wiki: 'Canon Inc.' },
  matthews: { commons: 'Matthews Studio Equipment logo', site: 'https://www.msegrip.com' },
  'blackmagic-design': { wiki: 'Blackmagic Design' },
  dji: { wiki: 'DJI' },
  tilta: { wiki: 'Tilta' },
  dzofilm: { commons: 'DZOFILM logo', site: 'https://www.dzofilm.com' },
  laowa: { wiki: 'Venus Optics' },
  fujinon: { commons: 'Fujinon logo', site: 'https://www.fujifilm.com/us/en/business/optical-devices/cinema' },
  gopro: { wiki: 'GoPro' },
  samyang: { commons: 'Samyang Optics logo', site: 'https://www.samyanglens.com' },
  fxlion: { commons: 'FXLion logo', site: 'https://www.fxlion.com' },
  teradek: { commons: 'Teradek logo', site: 'https://teradek.com' },
  avenger: { commons: 'Avenger grip logo', site: 'https://www.manfrotto.com/global/avenger/' },
  cooke: { wiki: 'Cooke Optics', commons: 'Cooke Optics logo', site: 'https://cookeoptics.com' },
  hollyland: { commons: 'Hollyland logo', site: 'https://www.hollyland.com' },
  cartoni: { commons: 'Cartoni logo', site: 'https://www.cartoni.com' },
  'ronford-baker': { commons: 'Ronford-Baker logo', site: 'https://ronfordbaker.co.uk' },
  sigma: { wiki: 'Sigma Corporation' },
  smallhd: { commons: 'SmallHD logo', site: 'https://smallhd.com' },
  swit: { commons: 'SWIT Electronics logo', site: 'https://www.swit.cc' },
  angenieux: { wiki: 'Angénieux' },
  chrosziel: { commons: 'Chrosziel logo', site: 'https://chrosziel.com' },
  nisi: { commons: 'NiSi Filters logo', site: 'https://nisioptics.com' },
  red: { wiki: 'Red Digital Cinema' },
  easyrig: { commons: 'Easyrig logo', site: 'https://easyrig.se' },
  insta360: { wiki: 'Insta360' },
  manfrotto: { wiki: 'Manfrotto', commons: 'Manfrotto logo' },
  viltrox: { commons: 'Viltrox logo', site: 'https://viltrox.com' },
  digitalfoto: { site: 'https://www.digitalfoto.cn' },
  vaxis: { site: 'https://www.vaxis.cn' },
  movmax: { site: 'https://www.movmax.com' },
  tokina: { wiki: 'Tokina', commons: 'Tokina logo' },
  atlas: { commons: 'Atlas Lens Co logo', site: 'https://www.atlaslensco.com' },
  lexar: { wiki: 'Lexar' },
  portkeys: { site: 'https://portkeys.com' },
  aja: { wiki: 'AJA Video Systems', commons: 'AJA Video Systems logo' },
  cineroid: { site: 'https://www.cineroid.com' },
  'decimator-design': { site: 'https://decimator.com' },
  proaim: { site: 'https://www.proaim.com' },
  sachtler: { wiki: 'Sachtler' },
  'wooden-camera': { site: 'https://www.woodencamera.com' },
  atomos: { wiki: 'Atomos (company)', commons: 'Atomos logo', site: 'https://www.atomos.com' },
  kramer: { wiki: 'Kramer Electronics' },
  leica: { wiki: 'Leica Camera' },
  zacuto: { site: 'https://zacuto.com' },
  angelbird: { site: 'https://www.angelbird.com' },
  apple: { wiki: 'Apple Inc.' },
  cmotion: { site: 'https://cmotion.eu' },
  freefly: { commons: 'Freefly Systems logo', site: 'https://freeflysystems.com' },
  fujifilm: { wiki: 'Fujifilm' },
  sandisk: { wiki: 'SanDisk' },
  sirui: { site: 'https://www.sirui.com' },
  vocas: { site: 'https://vocas.com' },
  datavideo: { site: 'https://www.datavideo.com' },
  oconnor: { site: 'https://www.ocon.com' },
  shape: { site: 'https://shapewlb.com' },
  vinten: { wiki: 'Vinten' },
  'vision-research': { wiki: 'Vision Research (company)' },
  nikon: { wiki: 'Nikon' },
  godox: { site: 'https://www.godox.com' },
  aputure: { wiki: 'Aputure' },
  'bright-tangerine': { site: 'https://www.brighttangerine.com' },
  smallrig: { site: 'https://www.smallrig.com' },
  'core-swx': { site: 'https://coreswx.com' },
  'anton-bauer': { site: 'https://www.antonbauer.com' },
};

const api = (host, params) => fetch(`https://${host}/w/api.php?${new URLSearchParams({ format: 'json', ...params })}`, { headers: UA }).then(r => r.json());
const clean = (u) => u.replace(/\?utm_.*$/, '');

async function fileUrl(host, file) {
  const ii = await api(host, { action: 'query', titles: file, prop: 'imageinfo', iiprop: 'url|mime' });
  const f = Object.values(ii.query.pages)[0];
  return f.imageinfo?.[0]?.url ? clean(f.imageinfo[0].url) : null;
}

async function fromWiki(title) {
  const j = await api('en.wikipedia.org', { action: 'query', titles: title, prop: 'revisions', rvprop: 'content', rvslots: 'main', redirects: 1 });
  const p = Object.values(j.query.pages)[0];
  if (p.missing !== undefined) return null;
  const wt = p.revisions?.[0]?.slots?.main?.['*'] || '';
  const m = wt.match(/\|\s*(?:logo|image)\s*=\s*(?:\[\[(?:File|Image):)?([^|\]\n{}]+\.(?:svg|png|jpg|jpeg|webp))/i);
  if (!m) return null;
  return fileUrl('en.wikipedia.org', 'File:' + m[1].trim().replace(/^File:/i, ''));
}

async function fromCommons(phrase) {
  const j = await api('commons.wikimedia.org', { action: 'query', list: 'search', srnamespace: 6, srlimit: 10, srsearch: phrase });
  const brand = phrase.replace(/\s*logo.*$/i, '').toLowerCase().split(' ')[0];
  const hit = (j.query?.search || []).find(x => /logo/i.test(x.title) && x.title.toLowerCase().includes(brand) && /\.(svg|png)$/i.test(x.title));
  return hit ? fileUrl('commons.wikimedia.org', hit.title) : null;
}

async function fromSite(site) {
  try {
    const res = await fetch(site, { headers: { ...UA, accept: 'text/html' }, redirect: 'follow' });
    const html = await res.text();
    const base = res.url || site;
    const cands = [];
    for (const m of html.matchAll(/<img[^>]+>/gi)) {
      const tag = m[0];
      const src = (tag.match(/\s(?:data-src|src)=["']([^"']+)["']/i) || [])[1];
      if (!src || src.startsWith('data:')) continue;
      const score = (/logo/i.test(tag) ? 2 : 0) + (/\.svg/i.test(src) ? 1 : 0) - (/icon|badge|payment|flag|award|partner/i.test(tag) ? 3 : 0);
      if (score > 0) cands.push({ src, score });
    }
    cands.sort((a, b) => b.score - a.score);
    if (!cands.length) return null;
    return new URL(cands[0].src, base).href;
  } catch { return null; }
}

async function download(url, slug) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const type = res.headers.get('content-type') || '';
  const ext = /svg/.test(type) || /\.svg(\?|$)/i.test(url) ? 'svg' : /png/.test(type) || /\.png(\?|$)/i.test(url) ? 'png' : /webp/.test(type) ? 'webp' : /jpe?g/.test(type) || /\.jpe?g(\?|$)/i.test(url) ? 'jpg' : null;
  if (!ext || buf.length < 200) return null;
  if (ext === 'svg' && !/<svg/i.test(buf.toString('utf8', 0, 2000))) return null;
  const file = `${slug}.${ext}`;
  writeFileSync(join(DIR, file), buf);
  return { file, bytes: buf.length, url };
}

// Logos drawn in white (meant for dark backgrounds) must sit on a dark plate; everything else on a white plate.
const DARK_PLATE = new Set(['atlas', 'avenger', 'chrosziel', 'cmotion', 'smallhd', 'teradek', 'wooden-camera', 'oconnor', 'matthews']);
// Writes logos/index.json as { "<file>": "light" | "dark" } — the plate colour the app should draw behind it.
function writeIndex() {
  const files = readdirSync(DIR).filter(f => /\.(svg|png|webp|jpg)$/i.test(f)).sort();
  const index = {};
  for (const f of files) {
    const slug = f.replace(/\.[^.]+$/, '');
    index[f] = DARK_PLATE.has(slug) ? 'dark' : 'light';
  }
  writeFileSync(join(DIR, 'index.json'), JSON.stringify(index, null, 1));
  console.log(`logos/index.json: ${files.length} files (${Object.values(index).filter(v => v === 'dark').length} dark-plate)`);
}

async function main() {
  mkdirSync(DIR, { recursive: true });
  const args = process.argv.slice(2);
  if (args.includes('--index-only')) return writeIndex();
  const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
  const catalog = JSON.parse(readFileSync(join(ROOT, 'data', 'catalog.json'), 'utf8'));
  const slugs = (only || catalog.brands.map(b => b.id)).filter(s => SOURCES[s]);
  const report = [];
  for (const slug of slugs) {
    if (!only && readdirSync(DIR).some(f => f.startsWith(slug + '.'))) { report.push([slug, 'kept']); continue; }
    const src = SOURCES[slug];
    let got = null, via = '';
    for (const [name, fn, arg] of [['wiki', fromWiki, src.wiki], ['commons', fromCommons, src.commons], ['site', fromSite, src.site]]) {
      if (!arg) continue;
      const url = await fn(arg).catch(() => null);
      if (url) { got = await download(url, slug).catch(() => null); if (got) { via = name; break; } }
    }
    report.push([slug, got ? `${via} → ${got.file} (${got.bytes}b)` : 'NOT FOUND']);
    console.log(report.at(-1).join(': '));
    await new Promise(r => setTimeout(r, 250));
  }
  writeIndex();
  console.log(`\nmissing: ${report.filter(r => r[1] === 'NOT FOUND').map(r => r[0]).join(', ') || 'none'}`);
}
main().catch(e => { console.error(e); process.exit(1); });
