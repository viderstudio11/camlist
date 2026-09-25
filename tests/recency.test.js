import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRecency } from '../js/recency.js';
import { createCatalog } from '../js/catalog.js';

const releases = JSON.parse(readFileSync(new URL('../data/releases.json', import.meta.url), 'utf8'));
const rec = createRecency(releases, { nowYear: 2026 });

test('known products use their curated year', () => {
  assert.equal(rec.yearOf({ id: 16514 }), 2020); // FX6
  assert.equal(rec.yearOf({ id: 12328 }), 2022); // ALEXA 35
  assert.equal(rec.yearOf({ id: 28981 }), 2025); // FX2
});

test('unknown products are estimated from the surrounding anchors, in the right order', () => {
  const y = rec.yearOf({ id: 17000 }); // between FX6 (16514/2020) and FX3 (17205/2021)
  assert.ok(y >= 2019.5 && y <= 2021.5, `got ${y}`);
  const ids = [300, 13000, 17000, 20000, 25000, 29000];
  const years = ids.map(id => rec.yearOf({ id }));
  for (let i = 1; i < years.length; i++) assert.ok(years[i] > years[i - 1], `id ${ids[i]} (${years[i]}) should be newer than ${ids[i - 1]} (${years[i - 1]})`);
  assert.ok(rec.yearOf({ id: 10 }) <= 2011);          // older than every anchor
  assert.ok(rec.yearOf({ id: 99999 }) === 2026);      // beyond the last anchor: treated as current
});

test('supplementary and manual products count as current', () => {
  assert.equal(rec.yearOf({ id: 'x_sony_mrw_g2' }), 2026);
  assert.equal(rec.yearOf({ id: 'm_17654' }), 2026);
});

test('sort puts the newest model of a brand first', () => {
  const sony = [{ id: 654, name: 'PXW-FS7' }, { id: 28981, name: 'ILME-FX2' }, { id: 16514, name: 'PXW-FX6' }, { id: 14868, name: 'PXW-FX9' }];
  assert.deepEqual(rec.sort(sony).map(p => p.name), ['ILME-FX2', 'PXW-FX6', 'PXW-FX9', 'PXW-FS7']);
  const arri = [{ id: 66, name: 'ALEXA EV-1' }, { id: 12328, name: 'ALEXA 35' }, { id: 493, name: 'ALEXA MINI' }, { id: 14095, name: 'ALEXA MINI LF' }];
  assert.deepEqual(rec.sort(arri).map(p => p.name), ['ALEXA 35', 'ALEXA MINI LF', 'ALEXA MINI', 'ALEXA EV-1']);
});

test('every anchor id exists in the catalog', () => {
  const cat = createCatalog(JSON.parse(readFileSync(new URL('../data/catalog.json', import.meta.url), 'utf8')));
  const missing = rec.anchors.map(([id]) => id).filter(id => !cat.byId(id));
  assert.deepEqual(missing, [], `ids not in catalog: ${missing.join(', ')}`);
});
