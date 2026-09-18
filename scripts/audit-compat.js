#!/usr/bin/env node
// Prints every media / battery / charger product with its verdict for a few cameras — for eyeballing the rules.
// Usage: node scripts/audit-compat.js [camera-name-regex ...]
import { readFileSync } from 'node:fs';
import { createCatalog } from '../js/catalog.js';
import { createCompat } from '../js/compat.js';
const cat = createCatalog(JSON.parse(readFileSync(new URL('../data/catalog.json', import.meta.url), 'utf8')));
const cp = createCompat(JSON.parse(readFileSync(new URL('../data/compat.json', import.meta.url), 'utf8')), cat);
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : ['PXW-FX6', '^ALEXA 35$', 'KOMODO 6K', 'C70'];
const cams = wanted.map(rx => cat.products.find(p => cat.deptKey(p.dept) === 'cameras' && new RegExp(rx, 'i').test(p.name))).filter(Boolean);
const profs = cams.map(c => cp.profileFor(c));
const cols = cams.map(c => c.name.slice(0, 12).padEnd(13)).join('');
const pool = cat.products.filter(p => ['video', 'power'].includes(cat.deptKey(p.dept)) && (cp.verdict(p, profs[0]).kind));
console.log(''.padEnd(52) + cols);
for (const p of pool) {
  const vs = profs.map(pr => cp.verdict(p, pr));
  const kind = vs[0].kind;
  console.log(`${kind.padEnd(8)}${p.name.slice(0, 43).padEnd(44)}` + vs.map(v => `${{ native: '✓', adapter: '↻', partial: '⚠', no: '✕', unknown: '?', neutral: '·' }[v.status]} ${(v.family || '').slice(0, 10)}`.padEnd(13)).join(''));
}
