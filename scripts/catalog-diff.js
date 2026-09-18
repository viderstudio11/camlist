#!/usr/bin/env node
// Records products added to / removed from Utopia between catalog refreshes into data/changes.json.
// Usage: node scripts/catalog-diff.js <previous-catalog.json>  — compares that file with the current data/catalog.json.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'data', 'changes.json');
const oldPath = process.argv[2];
if (!oldPath || !existsSync(oldPath)) { console.error('usage: catalog-diff.js <previous-catalog.json>'); process.exit(1); }
const oldC = JSON.parse(readFileSync(oldPath, 'utf8'));
const newC = JSON.parse(readFileSync(join(ROOT, 'data', 'catalog.json'), 'utf8'));
const oldIds = new Set(oldC.products.map(p => p.id));
const newIds = new Set(newC.products.map(p => p.id));
const deptSlug = Object.fromEntries(newC.departments.map(d => [d.id, d.slug]));
const brandName = Object.fromEntries(newC.brands.map(b => [b.id, b.name]));
const today = new Date().toISOString().slice(0, 10);
const added = newC.products.filter(p => !oldIds.has(p.id)).map(p => ({ id: p.id, name: p.name, brand: p.brand, brandName: brandName[p.brand] || null, dept: deptSlug[p.dept] || 'other', image: p.image, url: p.url, date: today }));
const removed = oldC.products.filter(p => !newIds.has(p.id)).map(p => ({ id: p.id, name: p.name, date: today }));
const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { added: [], removed: [] };
const cutoff = new Date(Date.now() - 180 * 864e5).toISOString().slice(0, 10);
const merge = (a, b) => { const m = new Map(a.map(x => [x.id, x])); for (const x of b) m.set(x.id, x); return [...m.values()].filter(x => x.date >= cutoff).sort((x, y) => y.date.localeCompare(x.date)); };
const out = { generatedAt: new Date().toISOString(), added: merge(prev.added, added), removed: merge(prev.removed, removed) };
writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`added ${added.length}, removed ${removed.length} (kept ${out.added.length} / ${out.removed.length} in the last 180 days)`);
