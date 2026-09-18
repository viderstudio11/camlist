#!/usr/bin/env node
// Aggregates gear announcements from trusted pro-video trade press into data/news.json.
// No dependencies: a tolerant regex RSS/Atom parser. Usage: node scripts/fetch-news.js
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'data', 'news.json');
const UA = { 'user-agent': 'Mozilla/5.0 camlist-news/1.0 (+https://viderstudio11.github.io/camlist/)' };

const FEEDS = [
  { source: 'Newsshooter', url: 'https://www.newsshooter.com/feed/' },
  { source: 'CineD', url: 'https://www.cined.com/feed/' },
  { source: 'ProVideo Coalition', url: 'https://www.provideocoalition.com/feed/' },
  { source: 'RedShark News', url: 'https://www.redsharknews.com/rss.xml' },
  { source: 'Y.M.Cinema', url: 'https://ymcinema.com/feed/' },
  { source: 'No Film School', url: 'https://nofilmschool.com/rss.xml' },
];

// Only keep items about the departments CamList covers.
const GEAR = /\b(camera|cinema|cine|lens|lenses|prime|zoom|anamorphic|monitor|recorder|gimbal|tripod|fluid head|head|slider|dolly|crane|jib|matte ?box|follow focus|filter|nd\b|battery|batteries|v-?mount|b-?mount|wireless video|transmitter|receiver|teradek|smallhd|atomos|sdi|cfexpress|media card|card reader)\b/i;
const NOISE = /\b(airpods|iphone|smartphone|patent|patents|earbuds|headphones|review|tutorial|how to|deal|deals|sale|discount|giveaway|podcast|interview|behind the scenes|bts|firmware|update \d|nab recap|ibc recap|best of|top \d+|vs\.?|comparison|black friday|prime day)\b/i;
const LAUNCH = /\b(announce|announces|announced|unveil|unveils|launch|launches|launched|introduce|introduces|new|debut|debuts|reveal|reveals|first look|hands-?on|now shipping|now available)\b/i;

const decode = (s = '') => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/\s+/g, ' ').trim();
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i')); return m ? decode(m[1]) : ''; };
const attr = (xml, name, a) => { const m = xml.match(new RegExp(`<${name}[^>]*\\s${a}="([^"]+)"`, 'i')); return m ? m[1] : ''; };

function parseFeed(xml) {
  const items = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map(m => m[0]);
  return items.map(x => ({
    title: tag(x, 'title'),
    url: tag(x, 'link') || attr(x, 'link', 'href') || tag(x, 'guid'),
    date: tag(x, 'pubDate') || tag(x, 'published') || tag(x, 'updated') || tag(x, 'dc:date'),
    summary: (tag(x, 'description') || tag(x, 'summary') || tag(x, 'content')).slice(0, 220),
  })).filter(i => i.title && i.url);
}

async function main() {
  const catalog = JSON.parse(readFileSync(join(ROOT, 'data', 'catalog.json'), 'utf8'));
  const brands = catalog.brands.map(b => ({ id: b.id, name: b.name, rx: new RegExp(`\\b${b.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i') }));
  const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { items: [] };
  const seen = new Map(prev.items.map(i => [i.url, i]));
  let fetched = 0;
  for (const f of FEEDS) {
    try {
      const res = await fetch(f.url, { headers: UA });
      if (!res.ok) { console.error(`${f.source}: HTTP ${res.status}`); continue; }
      const items = parseFeed(await res.text());
      fetched += items.length;
      for (const it of items) {
        const text = `${it.title} ${it.summary}`;
        if (!GEAR.test(text) || NOISE.test(it.title) || !LAUNCH.test(it.title)) continue;
        const brand = brands.find(b => b.rx.test(it.title))?.id || null;
        const d = new Date(it.date); const date = isNaN(d) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
        if (!seen.has(it.url)) seen.set(it.url, { title: it.title, url: it.url, source: f.source, date, brand, summary: it.summary, addedAt: new Date().toISOString().slice(0, 10) });
      }
      console.log(`${f.source}: ${items.length} items`);
    } catch (e) { console.error(`${f.source}: ${e.message}`); }
  }
  const cutoff = new Date(Date.now() - 120 * 864e5).toISOString().slice(0, 10);
  const items = [...seen.values()].filter(i => i.date >= cutoff).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 120);
  writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), sources: FEEDS.map(f => f.source), items }, null, 1));
  console.log(`fetched ${fetched} → kept ${items.length} gear announcements (${items.filter(i => i.brand).length} with a known brand)`);
}
main().catch(e => { console.error(e); process.exit(1); });
